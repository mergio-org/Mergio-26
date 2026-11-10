"use server";

import { prisma } from "@repo/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSession } from "@/lib/dal";
import {
  parseRole,
  registrationSchema,
  type RegistrationState,
} from "@/lib/registration";

export async function signInWithGitHub(formData: FormData) {
  // Only ever return to our own registration page. The role is validated, never echoed raw.
  const role = parseRole(formData.get("role")?.toString());
  const callbackURL = role ? `/register?role=${role.toLowerCase()}` : "/register";

  const { url } = await auth.api.signInSocial({
    body: { provider: "github", callbackURL },
    headers: await headers(),
  });
  if (!url) throw new Error("GitHub sign-in did not return a redirect URL");
  redirect(url);
}

export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}

export async function registerAction(
  _prev: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> {
  const text = (name: string) => formData.get(name)?.toString() ?? "";
  const fields = {
    roles: formData.getAll("role").map(String),
    college: text("college"),
    graduationYear: text("graduationYear"),
    phone: text("phone"),
    discord: text("discord"),
    repoUrl: text("repoUrl"),
    updatesOptIn: formData.get("updatesOptIn") === "on",
  };

  const session = await getSession();
  if (!session) {
    return { errors: { form: "Your session expired. Sign in with GitHub again." } };
  }

  const parsed = registrationSchema.safeParse({
    ...fields,
    codeOfConduct: formData.get("codeOfConduct"),
  });
  if (!parsed.success) {
    const errors: NonNullable<RegistrationState["errors"]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form") as keyof typeof errors;
      errors[key] ??= issue.message;
    }
    return { errors };
  }

  const data = parsed.data;
  const userId = session.user.id;

  // Roles the person already holds keep their status; submitting again never resets a review.
  const existing = await prisma.registration.findMany({
    where: { userId },
    select: { role: true },
  });
  const held = new Set(existing.map((registration) => registration.role));
  const newRoles = data.roles.filter((role) => !held.has(role));

  await prisma.$transaction([
    prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        college: data.college,
        graduationYear: data.graduationYear,
        phone: data.phone,
        discord: data.discord,
        updatesOptIn: data.updatesOptIn,
        codeOfConductAcceptedAt: new Date(),
      },
      // The original code-of-conduct acceptance time is kept.
      update: {
        college: data.college,
        graduationYear: data.graduationYear,
        phone: data.phone ?? null,
        discord: data.discord ?? null,
        updatesOptIn: data.updatesOptIn,
      },
    }),
    prisma.registration.createMany({
      data: newRoles.map((role) => ({
        userId,
        role,
        // Contributors are open to everyone; leads for the other roles are reviewed by the team.
        status: role === "CONTRIBUTOR" ? "APPROVED" : "PENDING",
        repoUrl: role === "MAINTAINER" ? data.repoUrl : undefined,
      })),
      skipDuplicates: true,
    }),
  ]);

  redirect("/dashboard");
}
