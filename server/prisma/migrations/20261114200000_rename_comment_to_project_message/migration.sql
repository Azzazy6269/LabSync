-- Rename Comment to ProjectMessage
ALTER TABLE "Comment" RENAME TO "ProjectMessage";

-- Drop NOT NULL on content to support document-only messages
ALTER TABLE "ProjectMessage" ALTER COLUMN "content" DROP NOT NULL;

-- Add attachmentId column and unique constraint
ALTER TABLE "ProjectMessage" ADD COLUMN IF NOT EXISTS "attachmentId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectMessage_attachmentId_key" ON "ProjectMessage"("attachmentId");

-- Add foreign key constraint for attachmentId
ALTER TABLE "ProjectMessage" ADD CONSTRAINT "ProjectMessage_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "ProjectMessage_userId_idx" ON "ProjectMessage"("userId");
CREATE INDEX IF NOT EXISTS "ProjectMessage_createdAt_idx" ON "ProjectMessage"("createdAt");
