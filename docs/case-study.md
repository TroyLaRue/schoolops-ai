# SchoolOps AI — Portfolio Case Study

**Evidence before action for school operations.** [View the source on GitHub](https://github.com/TroyLaRue/schoolops-ai) · Try Demo Mode at `/demo` on the running app (no sign-in required).

> **Portfolio prototype, not a production student-information system.** All schools, people, attendance records, policies, and scenarios shown here are fictional. The public demo is a browser-local simulation: it does not contact a real family, send an email, create a calendar event, or write to a school workspace.

## Problem

School staff must often reconcile attendance patterns, student context, policy guidance, and follow-up work across separate tools. An unexplained alert is not enough: the person responsible needs to see the supporting facts and retain control over what happens next.

## Solution

SchoolOps AI brings a finding, its evidence, relevant policy excerpts, and a proposed next step into one reviewable workflow. The goal is to help staff make informed decisions, not automate sensitive school communication or replace professional judgment.

## How It Works

1. **Observe:** Flag a pattern in synthetic school-operations records without guessing its cause.
2. **Ground:** Show underlying entries and, where available, a matched excerpt from an invented school policy. Ask SchoolOps distinguishes observed facts, policy citations, and suggestions; no policy match is not represented as policy authority.
3. **Recommend:** Propose an internal review or next step instead of silently acting.
4. **Decide:** A person approves or rejects the proposed action.
5. **Act, optionally:** Only in an authorized authenticated synthetic test flow, a separately approved proposal can trigger a constrained demo-safe Gmail message or attendee-free Google Calendar event. Public-demo follow-ups are simulated and send nothing.
6. **Trace:** Record runs and decisions in the authenticated school's history; the public demo shows a separate browser-local history entry.

The current Ask SchoolOps pipeline uses **deterministic application logic** over school facts and matched policy sections. This prototype does not claim a live SIS feed or an autonomous language-model agent.

## Architecture

```text
Public /demo ── fictional case ── browser sessionStorage only

Authenticated React + Vite app
   └── generated React Query client (OpenAPI contract)
       └── Express API + Clerk identity
           └── membership + active-school checks
               ├── PostgreSQL / Drizzle: operations, policies, proposals, history
               └── approved action gate → optional authorized Gmail / Calendar

Integration-shaped input → normalized school context → evaluation → human decision
```

The integration-first boundary normalizes operational records before reasoning about them. **Smartcare is represented only by a synthetic Demo Connector and illustrative field mapping, not a live Smartcare/vendor integration.** There is no official Smartcare API access, import, or connection in this project. A real adapter would require authorized vendor API access, a school's permission, appropriate data agreements, and separate implementation and testing.

The authenticated Gmail and Google Calendar connections are a shared test setup for the original synthetic demo school, **not school-owned, per-school OAuth integrations**. Other schools are not treated as connected. The public demo calls neither connector.

## Key Features

- Public six-step Demo Mode that requires no account and keeps progress in the current browser tab.
- Authenticated school workspace with onboarding, membership-aware school switching, student directory/details, communications, knowledge, and activity history.
- Ask SchoolOps answers school-operations questions using active-school facts and relevant policy excerpts/citations when available.
- Explicit proposal approval/rejection and traceable action history.
- OpenAPI-defined API contract with generated validation and React client hooks.

## Safety / Approval Design

Authentication identifies the user; server-side membership and active-school checks scope school records, policies, proposals, and history. School switching is limited to memberships. Admin-only changes have additional role restrictions. Approval and execution are separate: an authenticated external action requires a persisted, approved proposal and another server-side authorization check before any demo-safe connector use. The public demo's approval exists only in browser state and cannot authorize an API side effect.

These controls demonstrate a design approach; they are **not a certification for production handling of student records**. Never upload real student, family, school, or policy data to this demo.

## Demo Flow

Visit **`/demo`** in the running app to step through a fictional attendance finding, evidence and invented policy, a recommended internal review, a human decision, an optional simulated follow-up, and demo-only Activity History. You can restart the walkthrough; the tab's `sessionStorage` holds progress. No account or connector authorization is required. The screenshot in [the repository](screenshots/demo-walkthrough.jpg) shows the synthetic walkthrough.

## Tech Stack

**Frontend:** React 19, Vite, TypeScript, Tailwind CSS, Wouter, TanStack Query, Clerk UI.  
**Backend:** Express 5, Clerk middleware, OpenAPI contracts, generated Zod validation and client hooks.  
**Data:** PostgreSQL and Drizzle ORM.  
**Optional integration tests:** Replit Connectors SDK with authorized Gmail and Google Calendar connections for the designated synthetic test school only.

## My Role

I independently conceived and built SchoolOps AI as a portfolio project, informed by real school-operations experience and graduate AI/business studies. It is **not officially sponsored, endorsed, or affiliated with USF or Sunshine Christian Academy**; neither institution is presented as a customer, partner, or provider of project data.

## What This Project Proves

An operations assistant can be designed around evidence, explicit uncertainty, policy context, tenant boundaries, and human approval rather than a black-box recommendation or automatic outbound action. The prototype demonstrates full-stack product thinking and an integration-ready architecture without claiming production adoption, live Smartcare access, or verified outcomes.

## Current Status

Working portfolio prototype and public, no-sign-in simulated walkthrough. The repository documents setup and current limitations. School-owned Gmail/Calendar authorization, additional cross-school isolation tests, and an official vendor adapter (if access and agreements become available) remain future work. **No license has been selected for the project's original code; public visibility alone does not grant reuse rights.**