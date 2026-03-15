# Dental Team Hub

## Current State
Admin page has two sections: Generate Invite Links and Manage Buckets (color-coded task categories). All data is stored on-chain via Motoko. Admin-only access is enforced at the canister level.

## Requested Changes (Diff)

### Add
- A new `CompanyEntry` type in the backend with fields: id, category (labs | dental_supply | insurance), name, url, password, createdAt.
- Backend functions (admin-only): `addCompanyEntry`, `deleteCompanyEntry`, `getCompanyEntries`.
- A new "Company Directory" section in the Admin page, below the existing sections.
- Three tabs inside that section: Labs, Dental Supply, Insurance.
- Each tab shows a list of saved entries (name, link that opens in new tab, password with show/hide toggle).
- A form at the bottom of each tab to add a new entry (name, URL, password fields).
- Delete button per entry (admin only).

### Modify
- AdminPage.tsx: Add Company Directory section with tabs and entry management UI.

### Remove
- Nothing.

## Implementation Plan
1. Add `CompanyEntry` type and CRUD functions to `main.mo` (admin-only).
2. Regenerate `backend.d.ts` bindings.
3. Add `useGetCompanyEntries`, `useAddCompanyEntry`, `useDeleteCompanyEntry` hooks.
4. Build the Company Directory UI section in `AdminPage.tsx` with tabs for each category.
