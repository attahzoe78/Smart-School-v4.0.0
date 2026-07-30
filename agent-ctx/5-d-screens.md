# Task 5-d: Homework, Exams, and Calendar Screens

**Agent:** Screens Builder (Z.ai Code)
**Task:** Build three production-ready screen components for Smart School project.

## Files Created / Modified

### Created
1. `src/components/screens/homework.tsx` — Homework & Download Center screen
2. `src/components/screens/exams.tsx` — Examinations screen
3. `src/components/screens/calendar.tsx` — Calendar & Tasks screen

### Modified
- `src/app/api/homework/route.ts` — Added endpoints for Download Center:
  - `GET ?action=downloads` — list all download content with class & subject
  - `POST action=upload-content` — create new download content
  - `DELETE ?id=X&action=download` — delete download content

## Implementation Notes

### homework.tsx
- Stats: Total Homework, Pending Submissions, Evaluated, This Week (computed from list)
- Tabs: Homework List + Download Center
- Homework list table: title, class+section, subject, homework date, submission date (with overdue badge), submissions count, view/evaluate + delete actions
- Download Center: responsive grid of cards with type-specific icon/color, download link, delete action
- Three dialogs: `AssignHomeworkDialog`, `UploadContentDialog`, `EvaluateDialog`
- Evaluate dialog fetches `?action=single&id=X` and shows table of student submissions with marks + remarks inputs; saves evaluations in parallel via Promise.all

### exams.tsx
- Stats: Total Exams, Active Exams, Total Results, Average Score
- Tabs: Examinations + Results
- Exams table: name, class+section, start/end date, results count, status badge (Active/Upcoming/Completed), view results + delete actions
- `CreateExamDialog`: name, description, classId, sectionId (cascaded), startDate, endDate (with end-after-start validation)
- `ResultsTab` (inline): exam selector, optional class override, grade scale reference (using GRADE_SCALE constant), marks entry table with per-row subject dropdown, marks input, total marks (default 100), auto-calculated grade badge using `getGrade()`; bulk save via `action=save-results`
- Pre-populates rows with existing exam results when switching exams

### calendar.tsx
- Two-column responsive layout: calendar (lg:col-span-2) + tasks sidebar
- Custom month-view calendar grid (42 cells, 6 weeks); weekday headers; month/year label with prev/next/today navigation
- Events shown as colored dots on calendar days; truncated title preview for days with 1-2 events
- Click any day to select; selected day's events listed below calendar with type badge, description, date range, location
- `EventDialog`: title, description, type (Event/Holiday/Meeting/Exam), location, start/end date, color picker (6 preset colors)
- Tasks sidebar: 3 stat tiles (Pending/In Progress/Completed), filter buttons (All/Active/Completed), scrollable task list
- Each task: click status icon to cycle Pending → In Progress → Completed; priority badge (Low/Medium/High with color), due date (with overdue highlighting), delete
- `TaskDialog`: title, description, priority, due date

## Patterns Followed (from reference `students.tsx`)
- `"use client"` directive at top of each file
- `useQuery`/`useMutation`/`useQueryClient` from `@tanstack/react-query`
- `api()` helper from `@/lib/api-client` for all HTTP
- `toast` from `sonner` for feedback
- Shared components: `PageHeader`, `StatCard`, `EmptyState`, `ConfirmDialog`
- shadcn/ui: `Button`, `Input`, `Label`, `Textarea`, `Select`, `Card`, `Table`, `Dialog`, `Tabs`, `Badge`, `ScrollArea`
- `useMemo(() => { if (open) setForm(...) }, [open])` pattern for resetting dialog forms
- Emerald primary color (`bg-emerald-600 hover:bg-emerald-700`) for all primary actions — no blue/indigo
- Mobile-first responsive grids (`grid-cols-2 md:grid-cols-4`, `sm:grid-cols-2 lg:grid-cols-3`)
- `cn()` utility for conditional classnames in calendar.tsx

## Lint Status
- All three new screen files pass `eslint` with zero errors/warnings
- Modified `homework/route.ts` passes lint cleanly
- Pre-existing lint error in `src/components/screens/hr.tsx` (not in scope of this task)
- Dev server log shows `✓ Compiled` — no module-not-found errors for the new screens

## Wired Into App
- `src/components/layout/app-shell.tsx` already imports all three screens:
  - `case "homework": case "download-center": return <HomeworkScreen />`
  - `case "examinations": return <ExamsScreen />`
  - `case "calendar": return <CalendarScreen />`
