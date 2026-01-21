# SplitUp - Multi-User Expense Splitting App

## Project Context Document

> **IMPORTANT**: This is the single source of truth for the SplitUp application. Read this file at the start of each development session and reference it throughout development.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Guiding Principles](#guiding-principles)
3. [Tech Stack](#tech-stack)
4. [MVP Definition](#mvp-definition)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Folder Structure](#folder-structure)
8. [Development Phases](#development-phases)
9. [Validation Schemas](#validation-schemas)
10. [Algorithms](#algorithms)
11. [Non-Broken Acceptance Checklist](#non-broken-acceptance-checklist)

---

## Project Overview

### What is SplitUp?

SplitUp is a multi-user expense-splitting web application where friend groups log shared expenses. The system correctly tracks who owes whom and generates a clean settlement plan.

### The Problem It Solves

In real life:
- One person pays for a group expense
- Multiple people benefit from that expense
- Money flows become messy over time
- People forget who owes what
- Manual math causes mistakes and disputes

SplitUp turns chaotic real-world spending into **deterministic, auditable data**.

### Example Flow

1. Alice, Bob, and Carol are in a group called "Roommates"
2. Alice pays $90 for groceries (split equally among all three)
3. System records: Bob owes Alice $30, Carol owes Alice $30
4. Bob pays $60 for utilities (split equally)
5. System recalculates all balances
6. Settlement plan generated: Optimized payments to settle all debts

---

## Guiding Principles

These principles prevent bugs and ensure data integrity. **Never violate these.**

### 1. Single Source of Truth
- Store finalized split rows (`ExpenseSplit` table)
- **Never** "recompute splits" later from percentages/equal flags
- Splits are immutable once created

### 2. All Money is Integers
- Store `amountCents` / `shareCents` (never floats)
- Display as dollars only in UI layer
- Example: $12.50 → stored as `1250` cents

### 3. Auth ≠ Authorization
- **Clerk** proves WHO you are (authentication)
- **Database rules** prove you BELONG to the group (authorization)
- Every API endpoint must verify group membership

### 4. Validate at the Boundary
- All API inputs validated with **Zod**
- Never trust client data
- Validate before any database operation

### 5. Transactions for Multi-Write Operations
- Expense + splits must succeed or fail **together**
- Use Prisma transactions for atomic operations
- No partial writes allowed

### 6. No Direct Client-to-DB Writes
- Route everything through server-side handlers
- API routes are the only path to database

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 14+ (App Router) | Full-stack React framework |
| Authentication | Clerk | User auth, session management |
| Database | PostgreSQL (Neon) | Persistent data storage |
| ORM | Prisma | Type-safe database access |
| Validation | Zod | Runtime schema validation |
| UI Components | shadcn/ui | Accessible component library |
| Styling | Tailwind CSS | Utility-first CSS |
| File Upload | UploadThing (optional) | Receipt image storage |

### Environment Variables Required

```env
# .env.local
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
DATABASE_URL=postgresql://...
```

---

## MVP Definition

The Minimum Viable Product includes:

- [ ] Sign in / Sign out (Clerk)
- [ ] Create a group
- [ ] Invite others to group (via link)
- [ ] Join a group (via invite link)
- [ ] Add an expense (equal split)
- [ ] View list of expenses
- [ ] View balances (who owes whom)
- [ ] View settlement plan (optimized payments)

**Not in MVP:**
- Custom split percentages
- Receipt uploads
- Settlement tracking ("mark as paid")
- Categories/filtering
- Activity feed

---

## Database Schema

### Entity Relationship Diagram (Conceptual)

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│   Group     │────<│  GroupMember    │>────│ (ClerkUser) │
└─────────────┘     └─────────────────┘     └─────────────┘
       │
       │
       ▼
┌─────────────┐     ┌─────────────────┐
│  Expense    │────<│  ExpenseSplit   │
└─────────────┘     └─────────────────┘
       │
       │
┌─────────────┐
│ GroupInvite │
└─────────────┘
```

### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// GROUPS & MEMBERSHIP
// ============================================

model Group {
  id                 String        @id @default(cuid())
  name               String
  createdByClerkUserId String
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt

  members            GroupMember[]
  expenses           Expense[]
  invites            GroupInvite[]

  @@index([createdByClerkUserId])
}

model GroupMember {
  id                  String   @id @default(cuid())
  groupId             String
  clerkUserId         String
  role                GroupRole @default(MEMBER)
  displayNameSnapshot String   // Cached display name at join time
  joinedAt            DateTime @default(now())

  group               Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)

  @@unique([groupId, clerkUserId]) // Prevent duplicate memberships
  @@index([clerkUserId])
}

enum GroupRole {
  ADMIN
  MEMBER
}

// ============================================
// EXPENSES & SPLITS
// ============================================

model Expense {
  id               String   @id @default(cuid())
  groupId          String
  title            String
  amountCents      Int      // Always positive integer
  payerClerkUserId String
  category         String?
  expenseDate      DateTime @default(now())
  receiptUrl       String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  group            Group          @relation(fields: [groupId], references: [id], onDelete: Cascade)
  splits           ExpenseSplit[]

  @@index([groupId])
  @@index([payerClerkUserId])
  @@index([expenseDate])
}

model ExpenseSplit {
  id          String  @id @default(cuid())
  expenseId   String
  clerkUserId String
  shareCents  Int     // Amount this user owes (>= 0)

  expense     Expense @relation(fields: [expenseId], references: [id], onDelete: Cascade)

  @@unique([expenseId, clerkUserId]) // One split per user per expense
  @@index([clerkUserId])
}

// ============================================
// INVITES
// ============================================

model GroupInvite {
  id                 String   @id @default(cuid())
  groupId            String
  token              String   @unique
  expiresAt          DateTime
  createdAt          DateTime @default(now())
  createdByClerkUserId String

  group              Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([groupId])
}

// ============================================
// SETTLEMENTS (Phase 10 - Optional)
// ============================================

model Settlement {
  id               String           @id @default(cuid())
  groupId          String
  fromClerkUserId  String
  toClerkUserId    String
  amountCents      Int
  status           SettlementStatus @default(PENDING)
  settledAt        DateTime?
  createdAt        DateTime @default(now())

  @@index([groupId])
}

enum SettlementStatus {
  PENDING
  COMPLETED
}
```

### Important Constraints

| Constraint | Purpose |
|------------|---------|
| `@@unique([groupId, clerkUserId])` on GroupMember | Prevents duplicate memberships |
| `@@unique([expenseId, clerkUserId])` on ExpenseSplit | One split per user per expense |
| `onDelete: Cascade` on relations | Prevents orphan records |
| `amountCents Int` (validated > 0) | No negative or zero expenses |
| `shareCents Int` (validated >= 0) | No negative shares |

---

## API Endpoints

### Groups

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/groups` | List user's groups | Yes |
| POST | `/api/groups` | Create new group | Yes |
| GET | `/api/groups/[groupId]` | Get group details | Yes + Member |
| PATCH | `/api/groups/[groupId]` | Update group | Yes + Admin |
| DELETE | `/api/groups/[groupId]` | Delete group | Yes + Admin |

### Members

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/groups/[groupId]/members` | List members | Yes + Member |
| DELETE | `/api/groups/[groupId]/members/[memberId]` | Remove member | Yes + Admin |

### Invites

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/groups/[groupId]/invites` | Create invite link | Yes + Admin |
| GET | `/api/invites/[token]` | Validate invite | Yes |
| POST | `/api/invites/[token]/accept` | Accept invite (join group) | Yes |

### Expenses

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/groups/[groupId]/expenses` | List expenses | Yes + Member |
| POST | `/api/groups/[groupId]/expenses` | Create expense | Yes + Member |
| GET | `/api/groups/[groupId]/expenses/[expenseId]` | Get expense details | Yes + Member |
| DELETE | `/api/groups/[groupId]/expenses/[expenseId]` | Delete expense | Yes + Member (creator or admin) |

### Balances & Settlements

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/groups/[groupId]/balances` | Get member balances | Yes + Member |
| GET | `/api/groups/[groupId]/settle` | Get settlement plan | Yes + Member |

---

## Folder Structure

```
splitup/
├── .env.local                    # Environment variables (not committed)
├── .env.example                  # Template for env vars
├── prisma/
│   ├── schema.prisma             # Database schema
│   ├── migrations/               # Migration history
│   └── seed.ts                   # Optional seed data
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout with Clerk provider
│   │   ├── page.tsx              # Landing page
│   │   ├── sign-in/[[...sign-in]]/
│   │   │   └── page.tsx          # Clerk sign-in page
│   │   ├── sign-up/[[...sign-up]]/
│   │   │   └── page.tsx          # Clerk sign-up page
│   │   ├── groups/
│   │   │   ├── page.tsx          # Groups list (dashboard)
│   │   │   └── [groupId]/
│   │   │       ├── page.tsx      # Group detail (expenses tab)
│   │   │       ├── balances/
│   │   │       │   └── page.tsx  # Balances tab
│   │   │       ├── settle/
│   │   │       │   └── page.tsx  # Settlement tab
│   │   │       └── settings/
│   │   │           └── page.tsx  # Group settings tab
│   │   ├── join/
│   │   │   └── [token]/
│   │   │       └── page.tsx      # Accept invite page
│   │   └── api/
│   │       ├── groups/
│   │       │   ├── route.ts      # GET (list), POST (create)
│   │       │   └── [groupId]/
│   │       │       ├── route.ts  # GET, PATCH, DELETE group
│   │       │       ├── members/
│   │       │       │   └── route.ts
│   │       │       ├── invites/
│   │       │       │   └── route.ts
│   │       │       ├── expenses/
│   │       │       │   ├── route.ts
│   │       │       │   └── [expenseId]/
│   │       │       │       └── route.ts
│   │       │       ├── balances/
│   │       │       │   └── route.ts
│   │       │       └── settle/
│   │       │           └── route.ts
│   │       └── invites/
│   │           └── [token]/
│   │               ├── route.ts        # GET (validate)
│   │               └── accept/
│   │                   └── route.ts    # POST (join)
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── navbar.tsx
│   │   │   └── sidebar.tsx
│   │   ├── groups/
│   │   │   ├── group-card.tsx
│   │   │   ├── create-group-dialog.tsx
│   │   │   └── invite-dialog.tsx
│   │   ├── expenses/
│   │   │   ├── expense-list.tsx
│   │   │   ├── expense-card.tsx
│   │   │   └── add-expense-dialog.tsx
│   │   ├── balances/
│   │   │   ├── balance-list.tsx
│   │   │   └── balance-card.tsx
│   │   └── settlements/
│   │       ├── settlement-plan.tsx
│   │       └── payment-card.tsx
│   ├── lib/
│   │   ├── prisma.ts             # Prisma client singleton
│   │   ├── auth.ts               # Auth utilities (requireGroupMember, etc.)
│   │   ├── validations/
│   │   │   ├── group.ts          # Zod schemas for groups
│   │   │   ├── expense.ts        # Zod schemas for expenses
│   │   │   └── invite.ts         # Zod schemas for invites
│   │   ├── utils/
│   │   │   ├── money.ts          # Money formatting utilities
│   │   │   ├── splits.ts         # Split calculation logic
│   │   │   ├── balances.ts       # Balance computation
│   │   │   └── settlements.ts    # Settlement algorithm
│   │   └── constants.ts          # App-wide constants
│   ├── hooks/
│   │   ├── use-groups.ts
│   │   ├── use-expenses.ts
│   │   └── use-balances.ts
│   └── types/
│       └── index.ts              # Shared TypeScript types
├── middleware.ts                 # Clerk middleware (route protection)
├── tailwind.config.ts
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## Development Phases

### Phase 0: Architecture Decisions ✅
**Status**: DOCUMENTED (this file)

**Decisions Made:**
- Next.js App Router
- Clerk for auth
- PostgreSQL (Neon)
- Prisma ORM
- shadcn/ui + Tailwind
- Zod for validation
- Route Handlers for API

**Outcome**: MVP scope defined, tech stack locked.

---

### Phase 1: Project Setup
**Status**: COMPLETE

**Objective**: Create a working foundation with auth.

**Tasks**:
1. [x] Initialize Next.js project with TypeScript and App Router
2. [x] Install core dependencies:
   - `@clerk/nextjs`
   - `prisma` and `@prisma/client`
   - `zod`
   - Tailwind CSS
3. [x] Set up shadcn/ui
4. [x] Configure environment variables
5. [x] Set up Clerk middleware for protected routes
6. [x] Create basic layout with navbar and UserButton
7. [x] Create sign-in and sign-up pages

**Verification Checklist**:
- [ ] Can sign in and sign out
- [ ] Protected routes redirect to sign-in
- [ ] User info displays in navbar

---

### Phase 2: Database Schema & Migrations
**Status**: NOT STARTED

**Objective**: Establish the data layer with correct constraints.

**Tasks**:
1. [ ] Initialize Prisma with PostgreSQL
2. [ ] Create schema.prisma with all models (see schema above)
3. [ ] Run initial migration
4. [ ] Create Prisma client singleton (`src/lib/prisma.ts`)
5. [ ] (Optional) Create seed script for testing

**Verification Checklist**:
- [ ] Prisma Studio shows all tables
- [ ] Can manually create/query records
- [ ] Constraints enforce uniqueness

**Critical Code - Prisma Client Singleton**:
```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

---

### Phase 3: Authorization Layer
**Status**: NOT STARTED

**Objective**: Ensure users can only access their own groups.

**Tasks**:
1. [ ] Create `requireGroupMember` utility function
2. [ ] Create `requireGroupAdmin` utility function
3. [ ] Create reusable auth checking pattern for API routes

**Critical Code - Authorization Utilities**:
```typescript
// src/lib/auth.ts
import { auth } from '@clerk/nextjs/server'
import { prisma } from './prisma'

export class AuthorizationError extends Error {
  constructor(message: string, public statusCode: number = 403) {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export async function requireAuth() {
  const { userId } = await auth()
  if (!userId) {
    throw new AuthorizationError('Unauthorized', 401)
  }
  return userId
}

export async function requireGroupMember(groupId: string) {
  const userId = await requireAuth()

  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_clerkUserId: {
        groupId,
        clerkUserId: userId,
      },
    },
  })

  if (!membership) {
    throw new AuthorizationError('Not a member of this group', 403)
  }

  return { userId, membership }
}

export async function requireGroupAdmin(groupId: string) {
  const { userId, membership } = await requireGroupMember(groupId)

  if (membership.role !== 'ADMIN') {
    throw new AuthorizationError('Admin access required', 403)
  }

  return { userId, membership }
}
```

**Verification Checklist**:
- [ ] Accessing another user's group returns 403
- [ ] Non-admin cannot perform admin actions
- [ ] All API routes use authorization utilities

---

### Phase 4: MVP Screens (Groups + Join + Dashboard)
**Status**: NOT STARTED

**Objective**: Build navigation and UI shell before complex money logic.

#### Phase 4A: Groups List Page (`/groups`)
**Tasks**:
1. [ ] Create groups list page
2. [ ] Fetch user's groups from database
3. [ ] Create group card component
4. [ ] Create "Create Group" dialog
5. [ ] Create `POST /api/groups` endpoint

**Verification Checklist**:
- [ ] Can create a new group
- [ ] Groups list shows only user's groups
- [ ] Group creator is auto-added as ADMIN

#### Phase 4B: Invite System (`/join/[token]`)
**Tasks**:
1. [ ] Create `POST /api/groups/[groupId]/invites` endpoint
2. [ ] Create invite dialog component
3. [ ] Create join page (`/join/[token]`)
4. [ ] Create `POST /api/invites/[token]/accept` endpoint
5. [ ] Handle expired invites gracefully

**Verification Checklist**:
- [ ] Can generate invite link
- [ ] Invite link adds user to group
- [ ] Expired links show error
- [ ] Joining twice doesn't duplicate membership
- [ ] New member appears in group

#### Phase 4C: Group Dashboard Shell (`/groups/[groupId]`)
**Tasks**:
1. [ ] Create group detail page layout
2. [ ] Create tab navigation (Expenses, Balances, Settle, Settings)
3. [ ] Show group name and member count
4. [ ] Create placeholder content for each tab

**Verification Checklist**:
- [ ] Tabs navigate correctly
- [ ] Non-members see 403/redirect
- [ ] Group info displays correctly

---

### Phase 5: Add Expense (Equal Split)
**Status**: NOT STARTED

**Objective**: First multi-write operation with atomic transactions.

#### Phase 5A: Expense Creation API
**Tasks**:
1. [ ] Create Zod schema for expense input
2. [ ] Create `POST /api/groups/[groupId]/expenses` endpoint
3. [ ] Implement equal split calculation with remainder handling
4. [ ] Use Prisma transaction for atomic writes
5. [ ] Create `GET /api/groups/[groupId]/expenses` endpoint

**Critical Code - Equal Split Algorithm**:
```typescript
// src/lib/utils/splits.ts
export interface SplitResult {
  clerkUserId: string
  shareCents: number
}

export function calculateEqualSplit(
  amountCents: number,
  participantIds: string[]
): SplitResult[] {
  const n = participantIds.length
  if (n === 0) throw new Error('At least one participant required')

  const baseShare = Math.floor(amountCents / n)
  const remainder = amountCents % n

  // Sort participant IDs for deterministic remainder distribution
  const sortedIds = [...participantIds].sort()

  return sortedIds.map((id, index) => ({
    clerkUserId: id,
    // First 'remainder' participants get +1 cent
    shareCents: baseShare + (index < remainder ? 1 : 0),
  }))
}
```

**Critical Code - Expense Creation with Transaction**:
```typescript
// In POST /api/groups/[groupId]/expenses
const result = await prisma.$transaction(async (tx) => {
  // Create expense
  const expense = await tx.expense.create({
    data: {
      groupId,
      title: validated.title,
      amountCents: validated.amountCents,
      payerClerkUserId: validated.payerClerkUserId,
      category: validated.category,
      expenseDate: validated.expenseDate,
    },
  })

  // Create splits
  const splits = calculateEqualSplit(
    validated.amountCents,
    validated.participantIds
  )

  await tx.expenseSplit.createMany({
    data: splits.map((split) => ({
      expenseId: expense.id,
      clerkUserId: split.clerkUserId,
      shareCents: split.shareCents,
    })),
  })

  return expense
})
```

**Verification Checklist**:
- [ ] Sum of splits ALWAYS equals expense amount
- [ ] Remainder cents distributed correctly
- [ ] Transaction rolls back on error
- [ ] No partial expense/split creation

#### Phase 5B: Add Expense UI
**Tasks**:
1. [ ] Create Add Expense dialog/modal
2. [ ] Amount input (display dollars, store cents)
3. [ ] Payer dropdown (group members)
4. [ ] Participant checkboxes
5. [ ] Form validation with error messages
6. [ ] Optimistic UI update on success

**Verification Checklist**:
- [ ] Expense appears immediately after save
- [ ] Expense persists after page refresh
- [ ] Validation prevents invalid inputs

---

### Phase 6: Balances Computation
**Status**: NOT STARTED

**Objective**: Derive accurate "who owes whom" data.

#### Phase 6A: Balances Endpoint
**Tasks**:
1. [ ] Create `GET /api/groups/[groupId]/balances` endpoint
2. [ ] Implement balance calculation algorithm
3. [ ] Return net balance for each member

**Critical Code - Balance Calculation**:
```typescript
// src/lib/utils/balances.ts
export interface MemberBalance {
  clerkUserId: string
  displayName: string
  netCents: number // Positive = owed money, Negative = owes money
}

export async function calculateGroupBalances(
  groupId: string
): Promise<MemberBalance[]> {
  // Get all expenses with splits for this group
  const expenses = await prisma.expense.findMany({
    where: { groupId },
    include: {
      splits: true,
    },
  })

  // Get all members
  const members = await prisma.groupMember.findMany({
    where: { groupId },
  })

  // Initialize balance map
  const balanceMap = new Map<string, number>()
  members.forEach((m) => balanceMap.set(m.clerkUserId, 0))

  // Calculate balances
  for (const expense of expenses) {
    // Payer gets credit for the full amount
    const payerBalance = balanceMap.get(expense.payerClerkUserId) ?? 0
    balanceMap.set(expense.payerClerkUserId, payerBalance + expense.amountCents)

    // Each split participant gets debited their share
    for (const split of expense.splits) {
      const splitBalance = balanceMap.get(split.clerkUserId) ?? 0
      balanceMap.set(split.clerkUserId, splitBalance - split.shareCents)
    }
  }

  // Convert to array with display names
  return members.map((m) => ({
    clerkUserId: m.clerkUserId,
    displayName: m.displayNameSnapshot,
    netCents: balanceMap.get(m.clerkUserId) ?? 0,
  }))
}
```

**Verification Checklist**:
- [ ] Total of all balances equals 0
- [ ] Payer credited full amount
- [ ] Participants debited their shares
- [ ] Hand-calculated examples match

#### Phase 6B: Balances UI
**Tasks**:
1. [ ] Create Balances tab content
2. [ ] Create balance card component
3. [ ] Show positive (owed) in green, negative (owes) in red
4. [ ] Sort by absolute value (largest first)

**Verification Checklist**:
- [ ] Balances display correctly
- [ ] Colors indicate direction
- [ ] Updates when expenses change

---

### Phase 7: Settlement Plan
**Status**: NOT STARTED

**Objective**: Generate optimized payment instructions.

#### Phase 7A: Settlement Endpoint
**Tasks**:
1. [ ] Create `GET /api/groups/[groupId]/settle` endpoint
2. [ ] Implement greedy settlement algorithm
3. [ ] Return list of transfers

**Critical Code - Settlement Algorithm**:
```typescript
// src/lib/utils/settlements.ts
export interface Transfer {
  fromClerkUserId: string
  fromDisplayName: string
  toClerkUserId: string
  toDisplayName: string
  amountCents: number
}

export function calculateSettlements(
  balances: MemberBalance[]
): Transfer[] {
  // Separate into creditors (positive) and debtors (negative)
  const creditors = balances
    .filter((b) => b.netCents > 0)
    .map((b) => ({ ...b, remaining: b.netCents }))
    .sort((a, b) => b.remaining - a.remaining) // Largest first

  const debtors = balances
    .filter((b) => b.netCents < 0)
    .map((b) => ({ ...b, remaining: Math.abs(b.netCents) }))
    .sort((a, b) => b.remaining - a.remaining) // Largest first

  const transfers: Transfer[] = []

  let creditorIndex = 0
  let debtorIndex = 0

  // Greedy matching
  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex]
    const debtor = debtors[debtorIndex]

    const paymentAmount = Math.min(creditor.remaining, debtor.remaining)

    if (paymentAmount > 0) {
      transfers.push({
        fromClerkUserId: debtor.clerkUserId,
        fromDisplayName: debtor.displayName,
        toClerkUserId: creditor.clerkUserId,
        toDisplayName: creditor.displayName,
        amountCents: paymentAmount,
      })

      creditor.remaining -= paymentAmount
      debtor.remaining -= paymentAmount
    }

    if (creditor.remaining === 0) creditorIndex++
    if (debtor.remaining === 0) debtorIndex++
  }

  return transfers
}
```

**Verification Checklist**:
- [ ] After transfers, everyone settles to 0
- [ ] No transfer with 0 or negative amount
- [ ] Algorithm is deterministic

#### Phase 7B: Settle Up UI
**Tasks**:
1. [ ] Create Settle tab content
2. [ ] Create payment card component
3. [ ] Show "X pays Y $Z" format
4. [ ] Add "Copy summary" button

**Verification Checklist**:
- [ ] Settlement plan displays correctly
- [ ] Copy function works
- [ ] Empty state when all settled

---

### Phase 8: Hardening & Correctness
**Status**: NOT STARTED

**Objective**: Production-ready reliability.

#### Phase 8A: Permissions Audit
**Tasks**:
1. [ ] Audit all API routes for authorization
2. [ ] Ensure admin-only actions are protected
3. [ ] Add rate limiting (optional)

#### Phase 8B: Input Validation
**Tasks**:
1. [ ] Validate all API inputs with Zod
2. [ ] Handle edge cases:
   - Empty titles
   - Zero/negative amounts
   - Payer not in participants (allowed)
   - Invalid participant IDs

#### Phase 8C: Money Formatting
**Tasks**:
1. [ ] Create money formatting utility
2. [ ] Ensure consistent display everywhere

**Critical Code - Money Utilities**:
```typescript
// src/lib/utils/money.ts
export function centsToDollars(cents: number): number {
  return cents / 100
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100)
}

export function formatMoney(cents: number): string {
  const dollars = centsToDollars(cents)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars)
}
```

#### Phase 8D: Error Handling
**Tasks**:
1. [ ] Standardize API error responses
2. [ ] Create error boundary components
3. [ ] Add logging for server errors

#### Phase 8E: Testing
**Tasks**:
1. [ ] Unit test: equal split calculation
2. [ ] Unit test: balance computation
3. [ ] Unit test: settlement algorithm
4. [ ] Integration test: full expense flow

**Verification Checklist**:
- [ ] All edge cases handled
- [ ] Consistent error responses
- [ ] Tests pass

---

### Phase 9: UX Polish
**Status**: NOT STARTED

**Objective**: Make it feel like a real product.

**Tasks**:
1. [ ] Add empty states ("No expenses yet")
2. [ ] Add loading skeletons
3. [ ] Add toast notifications
4. [ ] Improve mobile responsiveness
5. [ ] Add keyboard shortcuts (optional)

---

### Phase 10: Mark Paid Settlements (Optional)
**Status**: NOT STARTED

**Objective**: Track when debts are settled.

**Approach**: Store settlement records without affecting balance calculations.

**Tasks**:
1. [ ] Create Settlement model (already in schema)
2. [ ] Create "Mark as paid" UI
3. [ ] Create settlement history view
4. [ ] Settlement doesn't change computed balances

---

### Phase 11: Receipts Upload (Optional)
**Status**: NOT STARTED

**Objective**: Attach photos to expenses.

**Tasks**:
1. [ ] Set up UploadThing or Cloudinary
2. [ ] Add upload UI to expense form
3. [ ] Display receipt thumbnail on expense
4. [ ] Allow viewing full receipt

---

### Phase 12: Deployment
**Status**: NOT STARTED

**Objective**: Ship to production.

**Tasks**:
1. [ ] Create Neon production database
2. [ ] Run migrations on production
3. [ ] Configure Clerk for production domain
4. [ ] Deploy to Vercel
5. [ ] Smoke test all features

**Deployment Checklist**:
- [ ] Environment variables set in Vercel
- [ ] Database migrations run
- [ ] Clerk configured for production URLs
- [ ] Login works
- [ ] Create group works
- [ ] Invite/join works
- [ ] Add expense works
- [ ] Balances display correctly
- [ ] Settlement plan works

---

## Validation Schemas

```typescript
// src/lib/validations/group.ts
import { z } from 'zod'

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100),
})

export const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
})

// src/lib/validations/expense.ts
import { z } from 'zod'

export const createExpenseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  amountCents: z.number().int().positive('Amount must be positive'),
  payerClerkUserId: z.string().min(1),
  participantIds: z.array(z.string()).min(1, 'At least one participant required'),
  category: z.string().max(50).optional(),
  expenseDate: z.string().datetime().optional(),
})

// src/lib/validations/invite.ts
import { z } from 'zod'

export const createInviteSchema = z.object({
  expiresInDays: z.number().int().min(1).max(30).default(7),
})
```

---

## Algorithms

### Equal Split with Remainder Handling

**Problem**: Splitting $10.00 three ways gives $3.333... which can't be stored exactly.

**Solution**:
1. Calculate base share: `floor(1000 / 3) = 333 cents`
2. Calculate remainder: `1000 % 3 = 1 cent`
3. Distribute remainder to first N participants (deterministic order)
4. Result: [334, 333, 333] cents = 1000 cents total ✓

### Balance Computation

**For each expense:**
- Payer: `+amountCents` (credit)
- Each participant: `-shareCents` (debit)

**Net balance:**
- Positive = others owe you money
- Negative = you owe others money
- Sum of all balances = 0 (invariant)

### Settlement Algorithm (Greedy)

1. Separate members into creditors (+) and debtors (-)
2. Sort both by amount (largest first)
3. Match largest debtor with largest creditor
4. Transfer `min(debt, credit)` between them
5. Repeat until all settled

This minimizes the number of transactions needed.

---

## Non-Broken Acceptance Checklist

**Authorization:**
- [ ] Can't access a group you're not a member of (403)
- [ ] Can't perform admin actions as regular member
- [ ] All API routes check membership

**Money Integrity:**
- [ ] Sum of splits == expense total (ALWAYS)
- [ ] Balances sum to 0 across all members
- [ ] Settlement payments fully settle to 0
- [ ] No floating point in storage

**Data Integrity:**
- [ ] Transactions prevent partial expense writes
- [ ] All inputs validated (no NaN/negative/invalid)
- [ ] Unique constraints prevent duplicates

**Production:**
- [ ] Works after page refresh
- [ ] Works on production domain
- [ ] Auth redirects work correctly

---

## Quick Reference

### Common Commands

```bash
# Start development server
npm run dev

# Run Prisma Studio (database viewer)
npx prisma studio

# Create migration
npx prisma migrate dev --name <migration_name>

# Reset database (careful!)
npx prisma migrate reset

# Generate Prisma client
npx prisma generate

# Deploy migrations to production
npx prisma migrate deploy
```

### Key Files to Check

- `prisma/schema.prisma` - Database schema
- `src/lib/auth.ts` - Authorization utilities
- `src/lib/utils/splits.ts` - Split calculation
- `src/lib/utils/balances.ts` - Balance computation
- `src/lib/utils/settlements.ts` - Settlement algorithm
- `middleware.ts` - Route protection

---

*Last Updated: Phase 0 - Project Planning*
*Next Phase: Phase 1 - Project Setup*
