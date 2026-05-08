-- AlterTable: add column as nullable first, backfill, then set NOT NULL
ALTER TABLE "ai_models" ADD COLUMN "model_name" TEXT;
UPDATE "ai_models" SET "model_name" = "slug" WHERE "model_name" IS NULL;
ALTER TABLE "ai_models" ALTER COLUMN "model_name" SET NOT NULL;
