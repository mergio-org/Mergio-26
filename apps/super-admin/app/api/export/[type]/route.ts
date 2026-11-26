import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireAdmin } from "@/lib/dal";

function toCsvRow(items: (string | number | boolean | null | undefined)[]): string {
  return items
    .map((item) => {
      if (item === null || item === undefined) return '""';
      let str = String(item).replace(/"/g, '""');
      // Prevent CSV formula injection (OWASP):
      // If cell starts with '=', '+', '-', '@', '\t', or '\r', prefix with single quote "'"
      if (/^[=+\-@\t\r]/.test(str)) {
        str = `'${str}`;
      }
      return `"${str}"`;
    })
    .join(",");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  await requireAdmin();
  const { type } = await params;
  const searchParams = request.nextUrl.searchParams;
  const seasonId = searchParams.get("seasonId") || undefined;

  let filename = `${type}-${Date.now()}.csv`;
  let csvContent = "";

  if (type === "contributors") {
    filename = `contributors-${new Date().toISOString().split("T")[0]}.csv`;
    const users = await prisma.user.findMany({
      include: {
        profile: true,
        registrations: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "User ID",
      "Name",
      "Email",
      "GitHub Login",
      "College",
      "Graduation Year",
      "Phone",
      "Discord",
      "Roles",
      "Is Admin",
      "Is Banned",
      "Ban Reason",
      "Registered At",
    ];
    const rows = users.map((u) => [
      u.id,
      u.name,
      u.email,
      u.githubLogin,
      u.profile?.college,
      u.profile?.graduationYear,
      u.profile?.phone,
      u.profile?.discord,
      u.registrations.map((r) => `${r.role}(${r.status})`).join("; "),
      u.isAdmin,
      !!u.bannedAt,
      u.banReason,
      u.createdAt.toISOString(),
    ]);

    csvContent = [toCsvRow(headers), ...rows.map(toCsvRow)].join("\n");
  } else if (type === "prs") {
    filename = `prs-${new Date().toISOString().split("T")[0]}.csv`;
    const scoreEvents = await prisma.scoreEvent.findMany({
      where: {
        seasonId,
      },
      include: {
        user: { select: { name: true, githubLogin: true, email: true } },
        season: { select: { name: true } },
        pullRequest: { select: { number: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "Event ID",
      "User Name",
      "User Email",
      "GitHub Login",
      "PR Number",
      "PR Title",
      "Points",
      "Kind",
      "Rule Key",
      "Description",
      "Season",
      "Created At",
    ];
    const rows = scoreEvents.map((s) => [
      s.id,
      s.user.name,
      s.user.email,
      s.user.githubLogin,
      s.pullRequest?.number ?? "",
      s.pullRequest?.title ?? "",
      s.points,
      s.kind,
      s.ruleKey,
      s.description,
      s.season.name,
      s.createdAt.toISOString(),
    ]);

    csvContent = [toCsvRow(headers), ...rows.map(toCsvRow)].join("\n");
  } else if (type === "leaderboard") {
    filename = `leaderboard-${new Date().toISOString().split("T")[0]}.csv`;

    const userScores = await prisma.scoreEvent.groupBy({
      by: ["userId"],
      where: seasonId ? { seasonId } : undefined,
      _sum: { points: true },
      _count: { id: true },
      orderBy: { _sum: { points: "desc" } },
    });

    const userIds = userScores.map((s) => s.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      include: { profile: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const headers = [
      "Rank",
      "User ID",
      "Name",
      "Email",
      "GitHub Login",
      "College",
      "Graduation Year",
      "Total Score",
      "Score Events Count",
    ];

    const rows = userScores.map((s, index) => {
      const u = userMap.get(s.userId);
      return [
        index + 1,
        s.userId,
        u?.name,
        u?.email,
        u?.githubLogin,
        u?.profile?.college,
        u?.profile?.graduationYear,
        s._sum.points ?? 0,
        s._count.id ?? 0,
      ];
    });

    csvContent = [toCsvRow(headers), ...rows.map(toCsvRow)].join("\n");
  } else if (type === "certificates") {
    filename = `certificates-${new Date().toISOString().split("T")[0]}.csv`;

    // Users with approved registrations and active standing
    const approvedRegistrations = await prisma.registration.findMany({
      where: { status: "APPROVED" },
      include: {
        user: {
          include: {
            profile: true,
            scoreEvents: seasonId ? { where: { seasonId } } : true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const headers = [
      "Registration ID",
      "Name",
      "Email",
      "GitHub Login",
      "Role",
      "College",
      "Graduation Year",
      "Total Score",
      "Is Eligible",
    ];

    const rows = approvedRegistrations.map((reg) => {
      const totalScore = reg.user.scoreEvents.reduce((acc: number, s: { points: number }) => acc + s.points, 0);
      const isEligible = !reg.user.bannedAt && (reg.role !== "CONTRIBUTOR" || totalScore > 0);
      return [
        reg.id,
        reg.user.name,
        reg.user.email,
        reg.user.githubLogin,
        reg.role,
        reg.user.profile?.college,
        reg.user.profile?.graduationYear,
        totalScore,
        isEligible ? "YES" : "NO",
      ];
    });

    csvContent = [toCsvRow(headers), ...rows.map(toCsvRow)].join("\n");
  } else {
    return new NextResponse("Invalid export type", { status: 400 });
  }

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
