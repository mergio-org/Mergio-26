import { z } from "zod";

// Shared by the registration form (client) and the server action. Plain data only, no server imports.

export const ROLES = ["CONTRIBUTOR", "MAINTAINER", "MENTOR"] as const;
export type RoleName = (typeof ROLES)[number];

export const roleInfo: Record<
  RoleName,
  { label: string; blurb: string; review: string }
> = {
  CONTRIBUTOR: {
    label: "Contributor",
    blurb: "Pick projects, solve issues and open pull requests.",
    review: "Approved instantly",
  },
  MAINTAINER: {
    label: "Maintainer",
    blurb: "List an open-source project and review contributor PRs.",
    review: "Reviewed by the team",
  },
  MENTOR: {
    label: "Mentor",
    blurb: "Guide contributors and help them get their first merge.",
    review: "Reviewed by the team",
  },
};

/** Maps ?role=maintainer to MAINTAINER. Anything unrecognised is null. */
export function parseRole(value: string | string[] | null | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const upper = raw?.toUpperCase();
  return ROLES.find((role) => role === upper) ?? null;
}

// Blank inputs arrive as "" from FormData. Treat them as "not provided".
const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max, `Keep this under ${max} characters`).optional(),
  );

export const registrationSchema = z.object({
  roles: z
    .array(z.enum(ROLES))
    .min(1, "Pick at least one role"),
  college: z
    .string()
    .trim()
    .min(2, "Enter your college or university")
    .max(120, "Keep this under 120 characters"),
  graduationYear: z.coerce
    .number("Pick your graduation year")
    .int()
    .min(2020, "Pick your graduation year")
    .max(2040, "Pick your graduation year"),
  phone: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z
      .string()
      .trim()
      .regex(/^\+?[\d\s-]{7,18}$/, "Enter a valid phone number")
      .optional(),
  ),
  discord: optionalText(40),
  // A GitHub repository URL, e.g. https://github.com/owner/repo
  repoUrl: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z
      .string()
      .trim()
      .max(200, "Keep this under 200 characters")
      .regex(
        /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/,
        "Use a GitHub repo link like https://github.com/owner/repo",
      )
      .optional(),
  ),
  codeOfConduct: z.literal("on", "You need to accept the code of conduct"),
  updatesOptIn: z.boolean(),
});

export type RegistrationState = {
  errors?: Partial<
    Record<
      | "roles"
      | "college"
      | "graduationYear"
      | "phone"
      | "discord"
      | "repoUrl"
      | "codeOfConduct"
      | "form",
      string
    >
  >;
};
