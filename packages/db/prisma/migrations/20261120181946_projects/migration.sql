-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RepoApproval" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RepoTrackingStatus" AS ENUM ('NOT_INSTALLED', 'ACTIVE', 'SUSPENDED');

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "techStack" TEXT[],
    "difficultyEasy" INTEGER NOT NULL,
    "difficultyMedium" INTEGER NOT NULL,
    "difficultyHard" INTEGER NOT NULL,
    "logoUrl" TEXT,
    "discordChannel" TEXT,
    "contributingUrl" TEXT,
    "expectedMentors" INTEGER NOT NULL DEFAULT 0,
    "license" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "publicReason" TEXT,
    "copiedFromId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectRepo" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "githubRepoId" BIGINT NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "approval" "RepoApproval" NOT NULL DEFAULT 'PENDING',
    "trackingStatus" "RepoTrackingStatus" NOT NULL DEFAULT 'NOT_INSTALLED',
    "validation" JSONB,
    "validatedAt" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectRepo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Season_slug_key" ON "Season"("slug");

-- CreateIndex
CREATE INDEX "Project_seasonId_status_idx" ON "Project"("seasonId", "status");

-- CreateIndex
CREATE INDEX "Project_ownerId_idx" ON "Project"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_seasonId_slug_key" ON "Project"("seasonId", "slug");

-- CreateIndex
CREATE INDEX "ProjectRepo_githubRepoId_idx" ON "ProjectRepo"("githubRepoId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectRepo_projectId_githubRepoId_key" ON "ProjectRepo"("projectId", "githubRepoId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_copiedFromId_fkey" FOREIGN KEY ("copiedFromId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRepo" ADD CONSTRAINT "ProjectRepo_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed the current season so projects have one to apply to. F-03 adds the season editor.
INSERT INTO "Season" ("id", "slug", "name", "isActive", "createdAt", "updatedAt")
VALUES ('season_winter_2026', 'winter-2026', 'Winter 2026', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
