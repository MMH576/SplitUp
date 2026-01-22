-- CreateEnum
CREATE TYPE "SplitType" AS ENUM ('EQUAL', 'CUSTOM');

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "splitType" "SplitType" NOT NULL DEFAULT 'EQUAL';
