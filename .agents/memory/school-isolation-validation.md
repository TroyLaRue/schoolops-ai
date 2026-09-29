---
name: School isolation validation
description: User-confirmed isolation and how to keep public demonstrations from changing tenant records.
---

The user confirmed that the two schools have separate data and that the isolation works in their signed-in use.

**Why:** A public portfolio walkthrough should not require claiming a school, and should not create or mutate records in either authenticated school workspace merely to provide a no-setup demonstration.

**How to apply:** Treat public demo state as a separate, explicitly labeled synthetic sandbox. Keep authenticated school operations, actions, policies, and integrations behind membership checks. Never represent browser-only demo approval as a persisted school action.