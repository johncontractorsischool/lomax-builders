export const projectTypes = [
  "New Home Construction",
  "Home Renovation / Remodel",
  "Home Addition",
] as const;

export const timelines = [
  "As soon as possible",
  "Within 3–6 months",
  "Within 6–12 months",
  "More than a year",
  "Just exploring",
] as const;

export const referrals = [
  "Friends or family",
  "Online search",
  "Social media",
  "Architect or designer",
  "Saw one of your projects",
  "Other",
] as const;

export type Inquiry = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  projectType: string;
  timeline: string;
  budget: string;
  referral: string;
  message: string;
  newsletter: boolean;
};

export function isEmail(value: string) {
  return (
    value.length <= 254 &&
    /^[^\s@<>(),;:\\"]+@[^\s@<>(),;:\\"]+\.[^\s@<>(),;:\\"]+$/.test(value)
  );
}

export function parseInquiry(input: unknown): Inquiry {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Please provide your project details.");
  }
  const data = input as Record<string, unknown>;
  function field(
    name: string,
    max: number,
    required = false,
    multiline = false,
  ) {
    const value = data[name] ?? "";
    if (
      typeof value !== "string" ||
      value.length > max ||
      (!multiline && /[\r\n\x00]/.test(value))
    ) {
      throw new Error("Please check your form fields and try again.");
    }
    const trimmed = value.trim();
    if (required && !trimmed)
      throw new Error(
        "Please enter your first name, last name, and email address.",
      );
    return trimmed;
  }
  const inquiry: Inquiry = {
    firstName: field("firstName", 100, true),
    lastName: field("lastName", 100, true),
    email: field("email", 254, true),
    phone: field("phone", 40),
    projectType: field("projectType", 100),
    timeline: field("timeline", 100),
    budget: field("budget", 30),
    referral: field("referral", 100),
    message: field("message", 5000, false, true),
    newsletter: data.newsletter === true,
  };
  if (!isEmail(inquiry.email))
    throw new Error("Please enter a valid email address.");
  for (const [value, choices] of [
    [inquiry.projectType, projectTypes],
    [inquiry.timeline, timelines],
    [inquiry.referral, referrals],
  ] as const) {
    if (value && !(choices as readonly string[]).includes(value)) {
      throw new Error("Please choose one of the available options.");
    }
  }
  if (
    inquiry.budget &&
    (!/^\d+(\.\d+)?$/.test(inquiry.budget) ||
      !Number.isFinite(Number(inquiry.budget)))
  ) {
    throw new Error("Please enter a valid budget of zero or more.");
  }
  if (data.newsletter !== undefined && typeof data.newsletter !== "boolean") {
    throw new Error("Please check the news and updates checkbox.");
  }
  return inquiry;
}

export function inquiryMessage(inquiry: Inquiry) {
  return [
    "New project inquiry from the Lomax Builders website",
    "",
    `Name: ${inquiry.firstName} ${inquiry.lastName}`,
    `Email: ${inquiry.email}`,
    `Phone: ${inquiry.phone || "Not provided"}`,
    `Project type: ${inquiry.projectType || "Not selected"}`,
    `Estimated timeline: ${inquiry.timeline || "Not selected"}`,
    `Budget: ${inquiry.budget ? `$${inquiry.budget}` : "Not provided"}`,
    `How they heard about us: ${inquiry.referral || "Not selected"}`,
    `News and updates opt-in: ${inquiry.newsletter ? "Yes" : "No"}`,
    "",
    "Additional details:",
    inquiry.message || "Not provided",
  ].join("\n");
}
