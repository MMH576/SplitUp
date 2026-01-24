-- CreateEnum
CREATE TYPE "GroupType" AS ENUM ('GROUP', 'FRIEND');

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "type" "GroupType" NOT NULL DEFAULT 'GROUP';
