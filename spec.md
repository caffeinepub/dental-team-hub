# Dental Team Hub

## Current State
The Company Directory on the Admin page supports adding and deleting entries (Labs, Dental Supply, Insurance tabs). There is no way to edit an existing entry's name, URL, or password.

## Requested Changes (Diff)

### Add
- Backend: `editCompanyEntry(id, name, website_url, password)` function (admin-only)
- Frontend: Inline edit mode on each `CompanyEntryRow` — pencil icon opens editable fields for name, URL, and password; Save/Cancel controls confirm or discard changes
- Frontend: `useEditCompanyEntry` hook in useQueries.ts

### Modify
- `CompanyEntryRow` component: add edit state and editing UI (matching the pattern used by `ResourceEntryRow`)

### Remove
- Nothing

## Implementation Plan
1. Add `editCompanyEntry` to main.mo (admin-only, updates name/website_url/password by id)
2. Add `useEditCompanyEntry` mutation hook to useQueries.ts
3. Update `CompanyEntryRow` in AdminPage.tsx to support inline editing with pencil/save/cancel controls
