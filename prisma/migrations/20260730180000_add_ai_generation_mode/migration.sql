-- AlterEnum
CREATE TYPE "AiGenerationMode" AS ENUM ('LLM', 'HEURISTIC');

-- AlterTable
ALTER TABLE "analysis_results" ADD COLUMN "aiMode" "AiGenerationMode";
