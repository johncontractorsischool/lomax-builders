import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import nodemailer from "nodemailer";
import type { SendMailOptions } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { POST } from "../app/api/contact/route";

const valid = {
  firstName: "Alex",
  lastName: "Morgan",
  email: "alex@example.com",
  phone: "555-0100",
  projectType: "Home Addition",
  timeline: "Within 6–12 months",
  budget: "250000",
  referral: "Friends or family",
  message: "A new guest suite.\nAccessible entry.",
  newsletter: true,
  website: "",
};
const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.SMTP_USER = "sender@example.com";
  process.env.SMTP_PASSWORD = "test app password";
  process.env.CONTACT_TO_EMAIL = "recipient@example.com";
});
afterEach(() => {
  mock.restoreAll();
  for (const key of ["SMTP_USER", "SMTP_PASSWORD", "CONTACT_TO_EMAIL"]) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});

function request(data: unknown, headers: Record<string, string> = {}) {
  return new Request("https://lomax.example/api/contact", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://lomax.example",
      ...headers,
    },
    body: JSON.stringify(data),
  });
}

function mockDelivery(send: (message: SendMailOptions) => Promise<unknown>) {
  return mock.method(
    nodemailer,
    "createTransport",
    (options: SMTPTransport.Options) => {
      assert.equal(options.host, "smtp.gmail.com");
      assert.equal(options.secure, true);
      assert.equal(options.port, 465);
      return { sendMail: send } as unknown as ReturnType<
        typeof nodemailer.createTransport
      >;
    },
  );
}

test("routes every field to the configured recipient and replies to the visitor", async () => {
  let sent: SendMailOptions | undefined;
  const transport = mockDelivery(async (message) => {
    sent = message;
    return { accepted: ["recipient@example.com"] };
  });
  const response = await POST(
    request({
      ...valid,
      to: "attacker@example.com",
      from: "spoof@example.com",
    }),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true });
  assert.equal(transport.mock.callCount(), 1);
  assert.equal(sent?.to, "recipient@example.com");
  assert.deepEqual(sent?.from, {
    name: "Lomax Builders Website",
    address: "sender@example.com",
  });
  assert.deepEqual(sent?.replyTo, {
    name: "Alex Morgan",
    address: "alex@example.com",
  });
  for (const value of [
    "Alex Morgan",
    valid.email,
    valid.phone,
    valid.projectType,
    valid.timeline,
    "$250000",
    valid.referral,
    valid.message,
    "News and updates opt-in: Yes",
  ]) {
    assert.ok(String(sent?.text).includes(value));
  }
  assert.equal(sent?.html, undefined);
});

test("rejects invalid or injected fields before contacting SMTP", async () => {
  const transport = mockDelivery(async () => {
    throw new Error("Must not send");
  });
  for (const input of [
    null,
    [],
    { ...valid, firstName: " " },
    { ...valid, email: "bad email" },
    { ...valid, email: "a@example.com\r\nBcc: b@example.com" },
    { ...valid, budget: "-1" },
    { ...valid, projectType: "Invalid" },
    { ...valid, message: "x".repeat(5001) },
    { ...valid, newsletter: "yes" },
  ]) {
    assert.equal((await POST(request(input))).status, 400);
  }
  assert.equal(transport.mock.callCount(), 0);
});

test("rejects cross-origin, honeypot, malformed, and oversized requests", async () => {
  const transport = mockDelivery(async () => {
    throw new Error("Must not send");
  });
  assert.equal(
    (await POST(request(valid, { origin: "https://other.example" }))).status,
    403,
  );
  assert.equal(
    (await POST(request(valid, { "content-type": "text/plain" }))).status,
    415,
  );
  assert.equal(
    (await POST(request({ ...valid, website: "spam" }))).status,
    400,
  );
  assert.equal(
    (await POST(request({ ...valid, message: "x".repeat(24001) }))).status,
    413,
  );
  const malformed = new Request("https://lomax.example/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{",
  });
  assert.equal((await POST(malformed)).status, 400);
  assert.equal(transport.mock.callCount(), 0);
});

test("reports unavailable configuration without attempting to send", async () => {
  delete process.env.SMTP_PASSWORD;
  const transport = mockDelivery(async () => {
    throw new Error("Must not send");
  });
  const response = await POST(request(valid));
  assert.equal(response.status, 503);
  assert.equal(transport.mock.callCount(), 0);
});

test("does not claim success or expose SMTP details when delivery fails", async () => {
  mock.method(console, "error", () => {});
  mockDelivery(async () => {
    throw new Error("Private SMTP diagnostic and credentials");
  });
  const response = await POST(request(valid));
  assert.equal(response.status, 502);
  const result = await response.json();
  assert.ok(result.error.includes("info@lomaxbuilders.com"));
  assert.ok(!JSON.stringify(result).includes("Private SMTP"));
  assert.equal(result.success, undefined);
});

test("does not claim success when SMTP accepts no recipient", async () => {
  mock.method(console, "error", () => {});
  mockDelivery(async () => ({ accepted: [] }));
  assert.equal((await POST(request(valid))).status, 502);
});

test("throttles repeated requests on the same server instance", async () => {
  const transport = mockDelivery(async () => ({
    accepted: ["recipient@example.com"],
  }));
  for (let i = 0; i < 5; i++) {
    assert.equal(
      (await POST(request(valid, { "x-forwarded-for": "192.0.2.10" }))).status,
      200,
    );
  }
  assert.equal(
    (await POST(request(valid, { "x-forwarded-for": "192.0.2.10" }))).status,
    429,
  );
  assert.equal(transport.mock.callCount(), 5);
});
