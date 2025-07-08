-- CreateTable
CREATE TABLE "security_violations" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "contest_id" TEXT NOT NULL,
    "violation_type" TEXT NOT NULL,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_violations_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Contest" ADD COLUMN "disableCopyPaste" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Contest" ADD COLUMN "preventTabSwitching" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Contest" ADD COLUMN "requireFullScreen" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "security_violations_contest_id_user_id_idx" ON "security_violations"("contest_id", "user_id");
