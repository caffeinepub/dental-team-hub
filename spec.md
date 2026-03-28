# Dental Team Hub

## Current State
Invite system uses long random URL tokens embedded in links.

## Requested Changes (Diff)

### Add
- Short 6-digit numeric PIN generation in backend createInvite
- Admin sees PIN directly in invite list

### Modify
- Backend: createInvite generates 6-digit numeric PIN
- Admin page: Show PIN value directly with copy button
- Register page: PIN input form after Internet Identity login

### Remove
- URL-based invite token flow

## Implementation Plan
1. Backend: Change createInvite to generate 6-digit numeric PIN
2. Admin page: Show PIN in invite row, copy PIN button
3. Register page: Simple PIN input instead of URL token
