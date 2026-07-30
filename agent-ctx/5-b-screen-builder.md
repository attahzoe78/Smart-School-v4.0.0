# Task 5-b: Fees & Attendance Screens

## Summary

Built two production-ready screen files for the Smart School project:

1. **`src/components/screens/fees.tsx`** — `FeesScreen` export
2. **`src/components/screens/attendance.tsx`** — `AttendanceScreen` export

Both files follow the existing project patterns (students.tsx, dashboard.tsx) and pass ESLint cleanly. The only remaining lint error in the repo is in `hr.tsx` (another agent's file).

## What was built

### fees.tsx — `FeesScreen`
- 4 stat cards: Collected (This Month), Total Discount, Total Fine, Pending Invoices
- 3 tabs: Fee Payments, Fee Types, Invoices — the header action button dynamically switches based on the active tab
- Each tab has searchable + paginated tables with delete (ConfirmDialog) and edit actions where applicable
- 3 dialogs:
  - Collect Payment (student select, amount, discount, fine, paymentMode, description, optional invoice link with auto-filtered unpaid invoices, live net-payable calculator)
  - Add/Edit Fee Type (name, code, description, amount, type, class, status)
  - Generate Invoice (student, feeType with auto-fill amount, amount, discount, dueDate, net amount calculator)

### attendance.tsx — `AttendanceScreen`
- 2 tabs: Student Attendance, Staff Attendance
- Student tab: Class/Section/Date filters, bulk-mark buttons, summary bar with Progress, per-student status toggle (Present/Absent/Late/Excused)
- Staff tab: Date filter, search, bulk-mark buttons, summary bar, per-staff status toggle (Present/Absent/Late/Half Day/Holiday)
- Both use a derived-state pattern (overrides + useMemo) instead of setState-in-effect to satisfy the react-hooks/set-state-in-effect lint rule

## Reference patterns used
- `src/components/screens/students.tsx` — table/pagination/dialog/filter patterns
- `src/components/screens/dashboard.tsx` — stat card / chart usage
- `src/components/shared/{page-header,stat-card,empty-state,confirm-dialog}.tsx`
- `src/lib/{format,constants,api-client}.ts`
- `src/app/api/{fees,attendance,students,staff,settings}/route.ts` — verified API contracts

## Lint status
- `bun run lint` reports **1 error** in `src/components/screens/hr.tsx` (pre-existing, another agent's file)
- Both new files (`fees.tsx`, `attendance.tsx`) pass cleanly

## Wiring
- `app-shell.tsx` already imports both screens at lines 12-13 and renders them at lines 51-52 (cases: `fees`/`expenses` → `<FeesScreen/>`; `attendance`/`staff-attendance` → `<AttendanceScreen/>`)
