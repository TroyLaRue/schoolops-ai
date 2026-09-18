---
name: Calendar side-effect safety
description: Safety rules for creating external Calendar events from SchoolOps recommendations.
---

Calendar event creation must read its event proposal from a persisted synthetic action that is already approved. Recording approval and creating the external event are separate user actions.

**Why:** A client-only approval gate can be bypassed, and combining approval with creation makes it unclear whether an external side effect has already happened. The persisted action provides an auditable source of truth.

**How to apply:** For future Calendar work, validate the action status and synthetic boundary on the server, create no attendees or notifications unless explicitly requested, and mark the action completed only after Google confirms the event.