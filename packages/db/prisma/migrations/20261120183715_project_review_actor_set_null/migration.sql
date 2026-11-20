-- DropForeignKey
ALTER TABLE "ProjectReview" DROP CONSTRAINT "ProjectReview_actorId_fkey";

-- AlterTable
ALTER TABLE "ProjectReview" ALTER COLUMN "actorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ProjectReview" ADD CONSTRAINT "ProjectReview_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
