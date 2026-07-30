# Task 5-e — Screens Builder Agent Record

## Scope
Build four production-ready screen components for the Smart School Next.js 16 app:

1. `src/components/screens/cms.tsx` — Front CMS (Pages / News / Events / Gallery / Banners / Menus)
2. `src/components/screens/settings.tsx` — Settings (General / Classes / Subjects / Departments / Hostel / Transport / Sessions)
3. `src/components/screens/roles.tsx` — Roles & Permissions with ACL editor + module visibility toggles
4. `src/components/screens/certificates.tsx` — Certificates & ID Cards generation with previews

## Approach
- Read the worklog and reference files first (`students.tsx`, `dashboard.tsx`, `constants.ts`, `format.ts`, `api-client.ts`, `store/app.ts`, shared components).
- Inspected the relevant API routes (`/api/cms`, `/api/settings`, `/api/roles`, `/api/certificates`) and matching Prisma models (`Page`, `News`, `Event`, `Gallery`, `Banner`, `Menu`, `Class`, `Section`, `Subject`, `Department`, `Hostel`, `HostelRoom`, `TransportRoute`, `Session`, `SystemSetting`, `Role`, `CertificateTemplate`, `IdCardTemplate`, `GeneratedCertificate`) so the request payloads match exactly what the backend expects.
- Followed the established pattern from `students.tsx`: `"use client"`, TanStack Query (`useQuery` / `useMutation` / `useQueryClient`), `api()` helper, sonner toasts, PageHeader + StatCard + EmptyState + ConfirmDialog shared components, emerald primary color, responsive Tailwind grids, shadcn/ui dialogs/tables/tabs.

## Implementation Highlights

### cms.tsx
- Six tabs in a horizontally scrollable TabsList.
- Pages/News/Events use the shared Table + Add Dialog pattern. Gallery uses an image grid with hover overlay delete. Banners use a card list with image thumbnail. Menus use a Table with internal/external badge.
- Each panel has its own dialog with the exact fields requested (title/slug/content/excerpt/status for pages; title/content/excerpt/category/image for news; etc.).
- Centralized `useCmsList` / `useCmsDelete` hooks keep things DRY.

### settings.tsx
- General tab loads from `/api/settings?type=settings`, populates the form via `useEffect`, and saves via POST `{ type: "settings", ...form }`. Includes Identity / Contact / Location / Localization sections.
- Classes tab shows class cards with section badges + student counts. "Manage Sections" opens a sub-dialog allowing add/delete of sections for a specific class (POST `{ type: "section", ... }`).
- Subjects tab uses pill-style badges with code + type + delete button.
- Departments tab uses cards with staff counts.
- Hostel tab lists hostels with rooms shown as a grid below each; both "Add Hostel" and "Add Room" dialogs included.
- Transport tab uses route cards showing start/end/driver/fare/capacity.
- Sessions tab uses a Table with Active + Default badges.
- All delete operations call `/api/settings?id=X&type=...` and invalidate `["settings"]`.

### roles.tsx
- Four StatCards (Total / System / Custom / Total Users) computed with `useMemo`.
- Roles table shows name, description, user count, type badge (System amber / Custom emerald), status badge, edit + delete actions. System roles get a disabled Trash2 button (title="System roles cannot be deleted") plus `ConfirmDialog` for custom roles.
- Add/Edit dialog uses a fixed-height layout with a sticky header, form section, scrollable permissions area, and sticky footer. Permissions organized by `MODULE_CATEGORIES` with category-level "select all" checkboxes (supports indeterminate state), per-module checkboxes (uses `MODULES` from `@/lib/constants`), and "Select all / Clear all" global controls.
- Module Visibility card persists toggles via POST `{ action: "toggle-module", modules }` (stored in SystemSetting.theme as JSON, matching the existing API implementation). Each category card has its own "Enable all / Disable all" buttons.

### certificates.tsx
- Certificates tab: 1/3 + 2/3 split. Left = type selector + student search dropdown + student summary card + generate button + generated-cert info card. Right = live certificate preview with school header, type-specific body text (different wording for Transfer/Character/Bonafide/Completion), student details grid, certificate number, date of issue, and principal signature placeholder.
- ID Cards tab: same layout. Right shows front card (emerald header + photo + admission info + mini-info grid) and back card (parent info + school address + valid-until + signature line).
- Generated tab: searchable table of generated certificates from `/api/certificates?action=generated` with certificate no, student name, type, date, generated-by, and print action.
- Reusable `useStudentSearch` hook + `StudentSearch` dropdown component shared between Certificates and ID Cards panels.

## Verification
- `npx eslint` on all four files → no errors, no warnings (clean).
- Project-wide lint has one pre-existing error in `src/components/screens/hr.tsx` (setState-in-effect, outside this task's scope).
- Dev server log shows compilation succeeds (318ms); the only outstanding build issue is a missing `@/components/screens/calendar` module from another agent's work, not from this task. All four of my files are correctly imported in `app-shell.tsx` and resolve cleanly.

## Files Written
- `/home/z/my-project/src/components/screens/cms.tsx` (≈ 770 lines)
- `/home/z/my-project/src/components/screens/settings.tsx` (≈ 940 lines)
- `/home/z/my-project/src/components/screens/roles.tsx` (≈ 470 lines)
- `/home/z/my-project/src/components/screens/certificates.tsx` (≈ 600 lines)

## Notes for Future Agents
- The `calendar` screen is still missing — `app-shell.tsx` line 18 imports it. Whoever owns that file should create `/src/components/screens/calendar.tsx` exporting `CalendarScreen`.
- The `hr.tsx` setState-in-effect lint error (line 278) needs the effect refactored to use a derived value or event handler instead of `useEffect`.
- The CMS, Settings, Roles & Certificates screens all depend on the existing API routes already implemented — no backend changes were needed.
