# SplitUp - Complete Feature Testing Guide

## 1. Authentication

- [ ] Sign up with email
- [ ] Sign in with existing account
- [ ] Unauthenticated user redirected to sign-in
- [ ] Sign out

---

## 2. Friends (1:1 Expense Tracking)

### Adding a Friend
- [ ] Click "Add Friend" → dialog opens
- [ ] Enter a valid email of an existing user → friend added, redirected to their page
- [ ] Enter an email that doesn't exist → error: "No account found with this email. They need to sign up first."
- [ ] Enter your own email → error: "You can't add yourself as a friend."
- [ ] Add the same friend twice → error: "You already have an expense group with this person."
- [ ] Enter invalid email format → validation error

### Friend Card (on /groups page)
- [ ] Shows friend's display name
- [ ] Shows "Waiting for them to join" if only 1 member (edge case)
- [ ] Clicking card navigates to the friend group page

### Friend Group Page
- [ ] Breadcrumb shows "Friends / [name]" (not "Groups")
- [ ] Subtitle shows "with [friend name]"
- [ ] Invite button visible for admin to share link

---

## 3. Groups (3+ People)

### Creating a Group
- [ ] Click "Create Group" → dialog opens
- [ ] Enter group name → group created, redirected to group page
- [ ] Empty name → error

### Joining a Group
- [ ] Click "Join Group" → dialog opens
- [ ] Paste a full invite URL → joins group
- [ ] Paste just the 64-char token → joins group
- [ ] Invalid token → error: "Invalid invite link"
- [ ] Expired token → error about expiration
- [ ] Already a member → info toast, no error

### Group Card (on /groups page)
- [ ] Shows group name and member count
- [ ] Shows "Admin" badge if you're admin
- [ ] Clicking card navigates to group page

### Group Page Header
- [ ] Breadcrumb shows "Groups / [name]"
- [ ] Shows member count and expense count
- [ ] "Add Expense" button always visible
- [ ] "Invite Members" button visible if admin

---

## 4. Expenses

### Adding an Expense (Equal Split)
- [ ] Click "Add Expense" → dialog opens
- [ ] Enter description (required)
- [ ] Enter total amount (required for equal)
- [ ] Select date (defaults to today)
- [ ] Select who paid (defaults to you)
- [ ] Check/uncheck participants
- [ ] "Select all" / "Clear" buttons work
- [ ] Per-person calculation shows in real-time
- [ ] Rounding tooltip appears when amount doesn't divide evenly
- [ ] Shows "N people owe [payer] $X total"
- [ ] Shows "paid for themselves" if only payer is selected
- [ ] Submit → expense created, list refreshes

### Adding an Expense (Custom Split)
- [ ] Switch to "Custom Amounts" tab
- [ ] Amount field disappears (auto-calculated)
- [ ] Enter individual amounts for each person
- [ ] Total auto-calculates and displays
- [ ] Shows count: "N of M people included"
- [ ] "Clear" button resets all amounts
- [ ] Submit with at least one non-zero amount → expense created

### Adding an Expense (Friend Group - Simplified)
- [ ] No participant checkboxes shown
- [ ] Shows "Split equally between both of you"
- [ ] Only need: description, amount, who paid, date
- [ ] Custom split still shows both people's inputs

### Viewing Expense Details
- [ ] Click "..." menu → "View details"
- [ ] Shows full amount, date, who paid
- [ ] Shows split breakdown per person with share amounts
- [ ] Shows "paid" vs "owes [payer]" for each participant
- [ ] Shows split type badge (Equal/Custom)

### Editing an Expense
- [ ] Click "..." menu → "Edit"
- [ ] All fields pre-filled with current values
- [ ] Change title, amount, payer, date, participants
- [ ] Switch split type (EQUAL ↔ CUSTOM)
- [ ] Save → expense updated, balances recalculated

### Deleting an Expense
- [ ] Click "..." menu → "Delete"
- [ ] Confirmation dialog shows expense name and amount
- [ ] Cancel → nothing happens
- [ ] Confirm → expense deleted, balances recalculated

### Expense Search & Filter
- [ ] Search input filters by title (real-time, case-insensitive)
- [ ] Payer dropdown filters by who paid
- [ ] Both filters work together
- [ ] "Showing X of Y expenses" count appears when filtered
- [ ] "Clear filters" button resets everything
- [ ] "No expenses match your filters" message when nothing matches

---

## 5. Balances Tab

- [ ] Shows each member's net balance
- [ ] Green positive = others owe them
- [ ] Red negative = they owe others
- [ ] "Settled up" for zero balance
- [ ] "All settled up!" card when everyone is at zero
- [ ] Balances reflect all expenses and completed settlements

---

## 6. Settle Tab

### Settlement Plan
- [ ] Shows optimized payment plan (fewest transactions)
- [ ] Each row: from → to, amount
- [ ] Your payments highlighted red
- [ ] Payments to you highlighted green
- [ ] Others' payments in gray
- [ ] "Mark Paid" button only on rows involving you
- [ ] "All settled up!" when no payments needed

### Mark as Paid
- [ ] Click "Mark Paid" → confirmation dialog
- [ ] Confirm → payment recorded
- [ ] Toast shows "Payment recorded" with "Undo" button (8 seconds)
- [ ] Click "Undo" within 8s → payment reversed

### Copy Summary
- [ ] Click "Copy Summary" button
- [ ] Clipboard contains formatted settlement plan
- [ ] Includes expense breakdown details

### Payment History
- [ ] Shows all completed settlements
- [ ] Each entry: who paid whom, amount, date
- [ ] "Undo" button on each entry → deletes settlement record

### Expense Breakdown
- [ ] Shows each expense with your share
- [ ] Calculation: "Total you paid" - "Your fair share" = net balance
- [ ] Helps users understand why they owe/are owed

---

## 7. Settings Tab

### Rename Group (Admin Only)
- [ ] Click current name / rename button
- [ ] Dialog with text input pre-filled
- [ ] Save → group name updated everywhere

### Members List
- [ ] Shows all members with join dates
- [ ] "Admin" badge on admin members
- [ ] "(you)" indicator on your entry

### Promote/Demote Members (Admin Only)
- [ ] Shield icon → promote member to admin
- [ ] ShieldOff icon → demote admin to member
- [ ] Can't demote yourself if you're the only admin
- [ ] Toast confirmation on role change

### Remove Members (Admin Only)
- [ ] X icon → remove member from group
- [ ] Confirmation dialog
- [ ] Can't remove yourself if you're the only admin

### Leave Group
- [ ] "Leave Group" button visible (unless only admin)
- [ ] Confirmation dialog warns about needing new invite
- [ ] If only admin with other members → warning to promote someone first
- [ ] After leaving → redirected to /groups

### Delete Group (Admin Only)
- [ ] "Delete Group" button
- [ ] Confirmation dialog warns about permanent deletion
- [ ] Confirm → group and all data deleted
- [ ] Redirected to /groups

---

## 8. Invite System (Admin Only)

- [ ] Click "Invite Members" button
- [ ] "Create New Invite Link" generates a link (7-day expiry)
- [ ] Link appears in list with truncated token
- [ ] "Copy" button copies full URL to clipboard
- [ ] Expiration shown: "Expires in X days" / "Expires tomorrow"
- [ ] "Revoke" button deletes the invite immediately
- [ ] Expired invites not shown in list

---

## 9. Edge Cases & Error Handling

### Split Rounding
- [ ] $10 split among 3 people → $3.33, $3.33, $3.34 (extra cent distributed)
- [ ] Tooltip explains remainder distribution

### Admin Protection
- [ ] Only admin can't leave if there are other members
- [ ] Must promote someone else first
- [ ] Warning card explains this clearly

### Settlement Edge Cases
- [ ] Only payer or receiver can mark paid
- [ ] Only payer or receiver can undo
- [ ] Settlement reflects in balance calculation immediately

### URL Tab Persistence
- [ ] Switching tabs updates URL (?tab=balances, ?tab=settle, ?tab=settings)
- [ ] Refreshing page keeps you on the same tab
- [ ] Sharing URL with tab param opens correct tab

---

## 10. UI/UX Details

- [ ] All forms show loading states during submission
- [ ] Buttons disabled during loading (prevents double-submit)
- [ ] Toast notifications for all success/error states
- [ ] Responsive layout works on mobile
- [ ] Dialogs scrollable on small screens
- [ ] Truncated text for long names with ellipsis
