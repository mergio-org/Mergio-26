import { randomUUID } from "node:crypto";
import { prisma, Prisma, type SyncJobKind } from "@repo/db";

// GitHub sync queue (SyncJob) helper for super-admin.
// Enqueues jobs into Postgres with deduplication, processed by apps/backend/src/worker.ts.

export type JobPayloads = {
  PULL_REQUEST: { githubRepoId: string; number: number };
  ISSUE: { githubRepoId: string; number: number };
  REPO_RESYNC: { githubRepoId: string };
  INSTALLATION: {
    installationId: string;
    action: string;
    githubRepoIds: string[];
  };
  REPOSITORY: { githubRepoId: string; action: string };
  USER_RESCORE: { userId: string };
  MENTOR_ACCESS: { projectId: string };
  LEADERBOARD_REFRESH: { seasonId: string; kind: "user" | "mentor" | "college"; id: string };
};

export type Job = { [K in SyncJobKind]: { kind: K; payload: JobPayloads[K] } }[SyncJobKind];

export function dedupeKeyOf(job: Job): string {
  switch (job.kind) {
    case "PULL_REQUEST":
      return `pr:${job.payload.githubRepoId}:${job.payload.number}`;
    case "ISSUE":
      return `issue:${job.payload.githubRepoId}:${job.payload.number}`;
    case "REPO_RESYNC":
      return `resync:${job.payload.githubRepoId}`;
    case "INSTALLATION":
      return `installation:${job.payload.installationId}:${job.payload.action}:${job.payload.githubRepoIds.join(",")}`;
    case "REPOSITORY":
      return `repository:${job.payload.githubRepoId}:${job.payload.action}`;
    case "USER_RESCORE":
      return `user:${job.payload.userId}`;
    case "MENTOR_ACCESS":
      return `mentor-access:${job.payload.projectId}`;
    case "LEADERBOARD_REFRESH":
      return `leaderboard:${job.payload.seasonId}:${job.payload.kind}:${job.payload.id}`;
  }
}

export async function enqueueJobs(jobs: Job[], options: { runAt?: Date } = {}) {
  const unique = [...new Map(jobs.map((job) => [dedupeKeyOf(job), job])).values()];
  if (unique.length === 0) return;
  const runAt = options.runAt ?? new Date();
  const rows = unique.map(
    (job) =>
      Prisma.sql`(${randomUUID()}, ${job.kind}::"SyncJobKind", ${dedupeKeyOf(job)}, ${JSON.stringify(job.payload)}::jsonb, 'QUEUED', ${runAt}, CURRENT_TIMESTAMP)`,
  );
  await prisma.$executeRaw`
    INSERT INTO "SyncJob" ("id", "kind", "dedupeKey", "payload", "status", "runAt", "createdAt")
    VALUES ${Prisma.join(rows)}
    ON CONFLICT ("dedupeKey") WHERE "status" = 'QUEUED'
    DO UPDATE SET "runAt" = LEAST("SyncJob"."runAt", EXCLUDED."runAt")
  `;
}
