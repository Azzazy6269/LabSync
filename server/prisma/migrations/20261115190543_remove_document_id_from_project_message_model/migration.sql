/*
  Warnings:

  - You are about to drop the column `documentId` on the `ProjectMessage` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProjectMessage" DROP CONSTRAINT "Comment_documentId_fkey";

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "status" SET DEFAULT 'PENDING_ADMIN_APPROVAL';

-- AlterTable
ALTER TABLE "ProjectMessage" DROP COLUMN "documentId";
ALTER TABLE "ProjectMessage" RENAME CONSTRAINT "Comment_pkey" TO "ProjectMessage_pkey";

-- CreateIndex
CREATE INDEX "ProjectMessage_projectId_idx" ON "ProjectMessage"("projectId");

-- RenameForeignKey
ALTER TABLE "ProjectMessage" RENAME CONSTRAINT "Comment_projectId_fkey" TO "ProjectMessage_projectId_fkey";

-- RenameForeignKey
ALTER TABLE "ProjectMessage" RENAME CONSTRAINT "Comment_userId_fkey" TO "ProjectMessage_userId_fkey";
