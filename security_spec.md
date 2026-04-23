# Security Specification: ResourceCore

## 1. Data Invariants
- An employee can only create/update their own submissions.
- A manager can only update submissions of employees in their team (or if assigned as managerId).
- An admin can read all approved submissions but should not modify employee effort values directly (only approve/verify).
- Submissions are locked once `status == 'approved'`.
- `userId` in `EffortSubmission` must match the authenticated user during creation.
- `allocations` must be an array, and each entries must have a valid `projectId`.

## 2. The "Dirty Dozen" Payloads (Deny Cases)

1.  **Identity Spoofing**: Employee A tries to create a submission for Employee B.
2.  **Role Escalation**: Employee tries to set their own role to 'admin' in `/users/{userId}`.
3.  **State Shortcutting**: Employee tries to set status straight to 'approved' without manager review.
4.  **Admin Bypass**: Non-admin tries to read the full `/projects` list if it were restricted (though it's usually public read).
5.  **Locked Update**: Employee tries to update an 'approved' submission.
6.  **Orphaned Message**: Sent a message to a submission that doesn't exist.
7.  **Unauthorized Revision**: Manager A tries to request revision on a team managed by Manager B.
8.  **Malicious String**: Injecting 1MB string into a `content` field of a message.
9.  **ID Poisoning**: Injecting non-alphanumeric characters into `{submissionId}`.
10. **Timestamp Fraud**: Sending a future `updatedAt` instead of `request.time`.
11. **PII Leak**: Unauthorized user reading someone else's `/users/{userId}` private fields (if any).
12. **Shadow Field**: Adding `isVerified: true` to a submission payload.

## 3. Test Runner (Mock Tests)
- `test('Employee cannot update others submissions').denies()...`
- `test('Status cannot be set to approved by employee').denies()...`
- `test('Cannot update locked submission').denies()...`
