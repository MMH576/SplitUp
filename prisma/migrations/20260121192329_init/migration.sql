-- CreateEnum
CREATE TYPE "GroupRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdByClerkUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "role" "GroupRole" NOT NULL DEFAULT 'MEMBER',
    "displayNameSnapshot" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "payerClerkUserId" TEXT NOT NULL,
    "category" TEXT,
    "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receiptUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseSplit" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "shareCents" INTEGER NOT NULL,

    CONSTRAINT "ExpenseSplit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupInvite" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByClerkUserId" TEXT NOT NULL,

    CONSTRAINT "GroupInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "fromClerkUserId" TEXT NOT NULL,
    "toClerkUserId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Group_createdByClerkUserId_idx" ON "Group"("createdByClerkUserId");

-- CreateIndex
CREATE INDEX "GroupMember_clerkUserId_idx" ON "GroupMember"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_groupId_clerkUserId_key" ON "GroupMember"("groupId", "clerkUserId");

-- CreateIndex
CREATE INDEX "Expense_groupId_idx" ON "Expense"("groupId");

-- CreateIndex
CREATE INDEX "Expense_payerClerkUserId_idx" ON "Expense"("payerClerkUserId");

-- CreateIndex
CREATE INDEX "Expense_expenseDate_idx" ON "Expense"("expenseDate");

-- CreateIndex
CREATE INDEX "ExpenseSplit_clerkUserId_idx" ON "ExpenseSplit"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseSplit_expenseId_clerkUserId_key" ON "ExpenseSplit"("expenseId", "clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupInvite_token_key" ON "GroupInvite"("token");

-- CreateIndex
CREATE INDEX "GroupInvite_token_idx" ON "GroupInvite"("token");

-- CreateIndex
CREATE INDEX "GroupInvite_groupId_idx" ON "GroupInvite"("groupId");

-- CreateIndex
CREATE INDEX "Settlement_groupId_idx" ON "Settlement"("groupId");

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseSplit" ADD CONSTRAINT "ExpenseSplit_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupInvite" ADD CONSTRAINT "GroupInvite_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
