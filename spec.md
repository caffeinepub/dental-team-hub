# Dental Team Hub

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Secure multi-user sign-in with role-based access (admin, staff)
- Group chat: send messages visible to the whole team
- Private threads: direct messages between two users
- Shared to-do list: create tasks, assign to team members, check off, delete
- User directory: list all registered users with active/inactive status
- Persistent on-chain storage for users, messages, and tasks via Motoko backend

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan
1. Select `authorization` component for secure multi-user sign-in
2. Generate Motoko backend with:
   - User profiles (name, role, last-seen timestamp for active status)
   - Group chat messages (sender, content, timestamp)
   - Private messages (sender, recipient, content, timestamp)
   - Tasks (title, assignee, completed flag, creator, timestamp)
3. Frontend pages:
   - Login / register screen
   - Main layout with sidebar nav (Chat, Tasks, Directory)
   - Group Chat view with message list and input
   - Private thread view per user
   - To-do list view with task creation, assignment, check-off, delete
   - User directory panel showing active status based on last-seen
