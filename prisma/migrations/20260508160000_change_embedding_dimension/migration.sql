-- Change embedding vector dimension from 1536 to 1024
-- Required because Together AI serverless only offers intfloat/multilingual-e5-large-instruct (1024-dim)

-- Drop existing embeddings (they're incompatible with new dimension)
UPDATE "knowledge_chunks" SET embedding = NULL;

-- Alter column type
ALTER TABLE "knowledge_chunks" ALTER COLUMN "embedding" TYPE vector(1024);
