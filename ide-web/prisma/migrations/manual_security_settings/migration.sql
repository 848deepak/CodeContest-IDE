-- Add security fields to Contest table
ALTER TABLE "Contest" ADD COLUMN IF NOT EXISTS "disableCopyPaste" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Contest" ADD COLUMN IF NOT EXISTS "preventTabSwitching" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Contest" ADD COLUMN IF NOT EXISTS "requireFullScreen" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Contest" ADD COLUMN IF NOT EXISTS "blockNavigation" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Contest" ADD COLUMN IF NOT EXISTS "webcamMonitoring" BOOLEAN NOT NULL DEFAULT false;

-- Create security_violations table if it doesn't exist
CREATE TABLE IF NOT EXISTS "security_violations" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "contestId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "details" TEXT,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "evidence" TEXT,

  CONSTRAINT "security_violations_pkey" PRIMARY KEY ("id")
);

-- Add indexes
CREATE INDEX IF NOT EXISTS "security_violations_contestId_userId_idx" ON "security_violations"("contestId", "userId");
CREATE INDEX IF NOT EXISTS "security_violations_timestamp_idx" ON "security_violations"("timestamp");

-- Add foreign key constraints
ALTER TABLE "security_violations" ADD CONSTRAINT "security_violations_contestId_fkey" 
  FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
