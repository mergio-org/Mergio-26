// Dumps every registration to CSV on stdout, one row per (person, role):
//   pnpm --silent export:registrations > registrations.csv
import { prisma } from "@repo/db";

// Cells come from user input and this file gets opened in Excel or Sheets, so a value that
// starts with = + - @ (or a tab/CR) would run as a formula. A leading apostrophe defuses it.
function cell(value: string | number | boolean | Date | null | undefined) {
  if (value === null || value === undefined) return "";
  let text = value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const header = [
  "github_login",
  "name",
  "email",
  "role",
  "status",
  "repo_url",
  "college",
  "graduation_year",
  "phone",
  "discord",
  "updates_opt_in",
  "registered_at",
];

const registrations = await prisma.registration.findMany({
  orderBy: [{ createdAt: "asc" }],
  include: { user: { include: { profile: true } } },
});

const lines = [header.join(",")];
for (const { user, ...registration } of registrations) {
  const { profile } = user;
  lines.push(
    [
      user.githubLogin,
      user.name,
      user.email,
      registration.role,
      registration.status,
      registration.repoUrl,
      profile?.college,
      profile?.graduationYear,
      profile?.phone,
      profile?.discord,
      profile?.updatesOptIn,
      registration.createdAt,
    ]
      .map(cell)
      .join(","),
  );
}

process.stdout.write(lines.join("\n") + "\n");
await prisma.$disconnect();
