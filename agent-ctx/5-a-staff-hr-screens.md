# Task 5-a: Staff & HR Screens

## Agent
Subagent A (Staff & HR screens)

## Files Created
1. `/home/z/my-project/src/components/screens/staff.tsx` - Staff Directory screen
2. `/home/z/my-project/src/components/screens/hr.tsx` - HR Module (Payroll/Leave/Departments) screen

## Exported Components
- `StaffScreen` (matches `app-shell.tsx` import on line 11)
- `HrScreen` (matches `app-shell.tsx` import on line 22 — note: casing matters, `HrScreen` not `HRScreen`)

## Routing (already in app-shell.tsx)
- `case "staff": case "departments": case "designations": return <StaffScreen />;`
- `case "payroll": case "leave": return <HrScreen />;`

## API Endpoints Used
### Staff (`/api/staff`)
- GET `?search=&departmentId=&status=&id=` - list/filter/single
- POST (body includes role, username, password for user account creation)
- PUT (body must include id)
- DELETE `?id=`

### HR (`/api/hr`)
- GET `?action=payroll&month=X&year=Y`
- GET `?action=leave-requests`
- GET `?action=leave-types`
- GET `?action=departments` (returns with `_count.staff`)
- GET `?action=designations` (returns with `_count.staff`)
- POST with body action: `generate-payroll`, `pay-salary`, `apply-leave`, `approve-leave`, `add-department`, `add-designation`
- DELETE `?id=&action=department|designation|leave-type|payroll`

### Settings (`/api/settings`)
- Returns `{ classes, sections, subjects, sessions, departments, designations, houses, ... }`
- Used by StaffFormDialog for department/designation dropdowns

## Lint Status
✅ `bun run lint` passes clean (no errors in staff.tsx or hr.tsx)

## Lint Notes
- ESLint's `react-hooks/set-state-in-render` rule flags `setState` inside `useMemo`
- Pattern used in `students.tsx` (single `setForm(objectLiteral)` call inside `useMemo` with `if(open)` guard) PASSES lint
- PayDialog initially had two separate `useState` + two `setState` in `useMemo` — was flagged
- Fix: PayDialog now uses conditional rendering `{payDialog && <PayDialog open={true} ... />}` so each open is a fresh mount (no reset useEffect needed). Trade-off: no close animation.
- ApplyLeaveDialog and AddSimpleDialog use the same `useMemo`+`setForm(object)` pattern as students.tsx (single combined state object) — passes lint

## Screens Reference Patterns Followed
- PageHeader with icon + action button (emerald primary)
- StatCard grid (2 cols mobile, 4 cols desktop)
- Card + CardContent with filter bar + Table
- EmptyState component for empty lists
- ConfirmDialog for destructive actions
- Sheet (right side, sm:max-w-2xl) for detail view with tabs
- Avatar + AvatarFallback with emerald-100/emerald-700 initials
- Badge variants: emerald-500 (active), amber-100/700 (pending), rose-50/700 (reject)
- toast from sonner for feedback
- useQuery/useMutation from @tanstack/react-query
- queryClient.invalidateQueries for cache busting

## Color Palette (NO blue/indigo for primary actions)
- Primary: `bg-emerald-600 hover:bg-emerald-700`
- Secondary accents: teal-500, amber-500, violet-500, rose-500
- Status badges: emerald-500 (active/paid/approved), amber-100/700 (pending/generated), rose-500 (rejected)
- Department badge: emerald-50/700 border emerald-200
