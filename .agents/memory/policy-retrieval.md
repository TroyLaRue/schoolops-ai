---
name: Policy retrieval across categories
description: Why policy question matching must use section content rather than only upload categories.
---

Policy retrieval must consider relevant sections of every active document even if an uploaded document's category does not match the question's topic. Preserve the document's own source identifier separately from any policy ID explicitly printed inside the section; never infer an ID when absent.

**Why:** An administrator can upload a multi-topic policy under a general handbook category. Restricting retrieval to the category hides its more specific rules, while substituting an inferred ID makes citations unverifiable.

**How to apply:** When changing policy search, ranking, or citation presentation, use the section text and heading as primary evidence, treat category as a ranking hint, and show an embedded policy ID only when the matched section contains one.

Ask SchoolOps should put a brief source-backed answer first and keep the full matched excerpt available on demand, not copy the whole excerpt into the initial response. The policy ID and document citation remain visible without expanding details.

**Why:** Administrators need a direct answer they can scan quickly, while still being able to inspect the exact rule and its provenance before acting.

**How to apply:** When changing answer generation or chat presentation, derive any short policy summary from the retrieved section, preserve its full quote in the citation, and keep supporting records, recommendation context, and source metadata accessible in expandable detail.