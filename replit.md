# SchoolOps AI

School operations prototype with an authenticated, school-scoped workspace and a separate public, browser-local synthetic walkthrough. See [README.md](README.md) for the product, architecture, integration limits, setup, and reviewer flow.

## Run and check

- Replit managed workflows: `artifacts/api-server: API Server` and `artifacts/schoolops-ai: web`. The web artifact is mounted at `/`; the API is mounted at `/api`.
- `pnpm run typecheck` — all packages.
- `pnpm --filter @workspace/schoolops-ai run test` — agent regression tests.
- `pnpm --filter @workspace/api-spec run codegen` — regenerate client and schema after OpenAPI edits.
- `pnpm --filter @workspace/db run push` — development database only; review schema impact first.
- Use workspace secrets/managed credentials. Never put actual credentials in `.env.example` or source control.

## Boundaries

- `/demo` uses synthetic browser-local state only. It never accesses school tenant records or sends email/calendar events.
- Smartcare is a synthetic demo mapping, not a live API integration.
- Shared Gmail/Calendar connectors are limited to the designated synthetic test school until per-school authorization exists.
- `artifacts/mockup-sandbox/` is a design preview workspace, not a deployed product feature.