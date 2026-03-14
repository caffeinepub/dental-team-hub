# Dental Team Hub

## Current State
Admins can create and delete color-coded task buckets via the Admin page. There is no way to rename an existing bucket.

## Requested Changes (Diff)

### Add
- `renameBucket(id: Nat, newName: Text)` backend function (admin-only)
- `useRenameBucket` mutation hook in `useQueries.ts`
- `renameBucket` method in `backend.d.ts`
- Inline rename UI on each bucket row in AdminPage: a pencil/edit icon that expands an inline input to rename the bucket and confirm/cancel

### Modify
- `AdminPage.tsx`: add edit state per bucket, inline rename input + save/cancel buttons
- `backend.d.ts`: add `renameBucket(id: bigint, newName: string): Promise<void>`

### Remove
- Nothing

## Implementation Plan
1. Add `renameBucket` to `src/backend/main.mo` (admin-only, updates bucket name in-place)
2. Add `renameBucket` to `src/frontend/src/backend.d.ts`
3. Add `useRenameBucket` hook to `src/frontend/src/hooks/useQueries.ts`
4. Update `AdminPage.tsx` to allow inline renaming of each bucket
