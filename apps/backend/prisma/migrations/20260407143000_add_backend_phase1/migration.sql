-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PURCHASE');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "idempotencyKey" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "status" "TransactionStatus" NOT NULL DEFAULT 'COMPLETED';
ALTER TABLE "Transaction" ADD COLUMN "type" "TransactionType" NOT NULL DEFAULT 'PURCHASE';

-- Backfill idempotency keys for existing rows if any are present.
UPDATE "Transaction"
SET "idempotencyKey" = 'legacy-' || "id"
WHERE "idempotencyKey" IS NULL;

ALTER TABLE "Transaction" ALTER COLUMN "idempotencyKey" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_idempotencyKey_key" ON "Transaction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Transaction_status_createdAt_idx" ON "Transaction"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_type_createdAt_idx" ON "Transaction"("type", "createdAt");