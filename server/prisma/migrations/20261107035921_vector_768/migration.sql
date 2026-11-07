/*
  Warnings:

  - The values [PENDING_SUPERVISOR_ACCEPTANCE] on the enum `ProjectStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProjectStatus_new" AS ENUM ('PENDING_SUPERVISOR_ACKNOWLEDGEMENT', 'PENDING_ADMIN_APPROVAL', 'IN_PROGRESS', 'PENDING_FINAL_APPROVAL', 'PUBLISHED', 'REJECTED');
ALTER TABLE "public"."Project" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Project" ALTER COLUMN "status" TYPE "ProjectStatus_new" USING ("status"::text::"ProjectStatus_new");
ALTER TYPE "ProjectStatus" RENAME TO "ProjectStatus_old";
ALTER TYPE "ProjectStatus_new" RENAME TO "ProjectStatus";
DROP TYPE "public"."ProjectStatus_old";
ALTER TABLE "Project" ALTER COLUMN "status" SET DEFAULT 'PENDING_SUPERVISOR_ACKNOWLEDGEMENT';
COMMIT;

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_supervisorId_fkey";

-- AlterTable
ALTER TABLE "DocumentChunk" ALTER COLUMN "accessLevel" SET DEFAULT 'GLOBAL_LAB';

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "status" SET DEFAULT 'PENDING_SUPERVISOR_ACKNOWLEDGEMENT';

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
