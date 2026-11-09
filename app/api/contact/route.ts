import nodemailer from "nodemailer";
import { inquiryMessage, isEmail, parseInquiry } from "../../../lib/inquiry";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BODY_BYTES = 24_000;
// Best-effort per-instance throttle. This is not a distributed rate limiter.
const attempts = new Map<string, { count: number; expires: number }>();

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return errorResponse("Please submit the form from our website.", 403);
  }
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    return errorResponse("Please submit a valid form.", 415);
  }

  let data: unknown;
  try {
    // Read with a byte limit rather than trusting Content-Length.
    const reader = request.body?.getReader();
    if (!reader)
      return errorResponse("Please provide your project details.", 400);
    const decoder = new TextDecoder();
    let text = "";
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        return errorResponse(
          "Your submission is too long. Please shorten your message.",
          413,
        );
      }
      text += decoder.decode(value, { stream: true });
    }
    data = JSON.parse(text + decoder.decode());
  } catch {
    return errorResponse("Please submit a valid form.", 400);
  }

  if (data && typeof data === "object" && "website" in data && data.website) {
    return errorResponse("Unable to submit this form.", 400);
  }

  let inquiry;
  try {
    inquiry = parseInquiry(data);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Please check your form.",
      400,
    );
  }

  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD?.replace(/\s/g, "");
  const recipient = process.env.CONTACT_TO_EMAIL?.trim();
  if (
    !user ||
    !password ||
    !recipient ||
    !isEmail(user) ||
    !isEmail(recipient)
  ) {
    return errorResponse(
      "The form is temporarily unavailable. Please email info@lomaxbuilders.com directly.",
      503,
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim();
  if (ip) {
    const now = Date.now();
    for (const [key, value] of attempts) {
      if (value.expires <= now) attempts.delete(key);
    }
    const entry = attempts.get(ip);
    if (entry && entry.count >= 5) {
      return errorResponse(
        "Too many submissions. Please wait 15 minutes or email info@lomaxbuilders.com.",
        429,
      );
    }
    // Keep memory bounded; new instances naturally start a new throttle window.
    if (!entry && attempts.size >= 5000) {
      return errorResponse("The form is busy. Please try again later.", 429);
    }
    attempts.set(ip, {
      count: (entry?.count ?? 0) + 1,
      expires: entry?.expires ?? now + 15 * 60_000,
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass: password },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
    const result = await transporter.sendMail({
      from: { name: "Lomax Builders Website", address: user },
      to: recipient,
      replyTo: {
        name: `${inquiry.firstName} ${inquiry.lastName}`,
        address: inquiry.email,
      },
      subject: "New project inquiry — Lomax Builders",
      text: inquiryMessage(inquiry),
    });
    if (!result.accepted.length) throw new Error("Recipient not accepted");
    return Response.json({ success: true });
  } catch {
    // Never log SMTP credentials, message content, or visitor contact details.
    console.error("Contact form email delivery failed.");
    return errorResponse(
      "We couldn’t send your inquiry. Please try again or email info@lomaxbuilders.com directly.",
      502,
    );
  }
}
