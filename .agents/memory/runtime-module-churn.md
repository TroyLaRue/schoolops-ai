---
name: Runtime module churn
description: Why seemingly read-only Python commands can change the tracked Replit runtime configuration.
---

In this Node workspace, invoking Python for an otherwise read-only repository scan automatically added the Python runtime module to the tracked Replit configuration. A schema-validated replacement removed the module but serialized the file with a different end-of-file newline.

**Why:** The packaging task was documentation-only, yet runtime autodetection produced an unrelated tracked configuration diff. This is easy to mistake for an intentional application change.

**How to apply:** Prefer the existing Node runtime for one-off repository audits here. If a tool invocation changes the Replit configuration, inspect the diff and use the schema-validated replacement flow to restore the original settings; a harmless newline-only diff may remain after normalization.