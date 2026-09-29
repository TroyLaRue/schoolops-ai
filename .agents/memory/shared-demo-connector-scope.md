---
name: Shared demo connector scope
description: Why shared Gmail and Calendar credentials must not be presented as connections owned by every school.
---

The project's existing Gmail and Calendar connections are shared test credentials, not per-school OAuth connections. Only the original synthetic demo school may use them; other schools should see them as unavailable until a genuinely school-specific authorization flow exists.

**Why:** Reusing one connected account across school tenants would mix external actions and falsely imply that each school's integration is isolated. Read-only synthetic operations can still be demonstrated independently without access to these shared accounts.

**How to apply:** Whenever expanding connector UI, authorization, audit logs, or external actions, scope the server capability to the school that actually owns the connection. Do not enable other schools merely by toggling a local setting or copying a status label. Keep all outgoing content server-validated and human-approved.