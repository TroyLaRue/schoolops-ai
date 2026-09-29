import { randomUUID } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db, policyDocumentsTable } from "@workspace/db";
import {
  CreatePolicyDocumentBody,
  CreatePolicyDocumentResponse,
  DeletePolicyDocumentParams,
  DeletePolicyDocumentResponse,
  ListPolicyDocumentsResponse,
  UpdatePolicyDocumentBody,
  UpdatePolicyDocumentParams,
  UpdatePolicyDocumentResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const DEMO_POLICIES = [
  {
    sourceId: "POL-ATT-2026",
    title: "Attendance & Student Support Policy",
    category: "attendance",
    description: "Demo thresholds and response steps for attendance concerns.",
    filename: "attendance-policy-demo.md",
    mimeType: "text/markdown",
    version: "2026.1",
    effectiveDate: "2026-08-01",
    content: `# Attendance & Student Support Policy

## Section 2. Daily attendance review
SchoolOps flags a student record for administrator review when rolling attendance falls below 90 percent or when a significant grade-level variance appears against the school baseline.

## Section 3. Support response
An attendance flag starts a support review, not an automatic disciplinary action. Staff should verify the underlying record, look for recurring absence patterns, and coordinate a human-reviewed family or advisor check-in.

## Section 4. Urgent patterns
Three consecutive unverified absences or a grade-level drop greater than 10 percentage points requires same-day review by the attendance team.`,
  },
  {
    sourceId: "POL-ENR-2026",
    title: "Enrollment & Required Documents Guide",
    category: "enrollment",
    description: "Demo checklist for enrollment and student compliance records.",
    filename: "enrollment-requirements-demo.md",
    mimeType: "text/markdown",
    version: "2026.2",
    effectiveDate: "2026-07-15",
    content: `# Enrollment & Required Documents Guide

## Section 1. Required student records
The synthetic demo checklist includes an enrollment agreement, birth certificate, emergency contact, annual physical, and grade-appropriate immunization records.

## Section 2. Immunization review
Students in grades 6 through 12 are reviewed for a current Tdap booster record in this demonstration. A missing item creates a compliance review flag and must be verified by an administrator before any family communication.

## Section 3. Missing-document workflow
Staff should identify the exact missing document, confirm the record is not pending processing, and use a reviewed communication draft. SchoolOps must not represent a demo flag as a legal determination.`,
  },
  {
    sourceId: "POL-TUI-2026",
    title: "Tuition Account Review Policy",
    category: "tuition",
    description: "Demo guidance for reviewing past-due accounts and payment plans.",
    filename: "tuition-policy-demo.md",
    mimeType: "text/markdown",
    version: "2026.1",
    effectiveDate: "2026-08-01",
    content: `# Tuition Account Review Policy

## Section 2. Account flags
A past-due or payment-plan status creates an administrative review flag. The flag is context for staff and does not authorize automated collection, enrollment, or student-status changes.

## Section 3. Human review
Before contacting a family, staff should verify balance age, posted payments, active payment arrangements, and any approved accommodations.

## Section 4. Communications
Account communications must be reviewed by an authorized administrator and should use neutral language that does not disclose financial details outside the intended recipient.`,
  },
  {
    sourceId: "POL-HBK-2026",
    title: "School Operations Handbook",
    category: "handbook",
    description: "Demo handbook for SchoolOps recommendations and approvals.",
    filename: "school-operations-handbook-demo.md",
    mimeType: "text/markdown",
    version: "2026.3",
    effectiveDate: "2026-08-01",
    content: `# School Operations Handbook

## Section 5. Agent recommendations
SchoolOps may summarize synthetic operational signals and recommend a next step. Recommendations must identify their supporting data source and, when applicable, the policy section used.

## Section 6. Human approval
No recommendation is permission to contact a family, change a student record, create an external task, or schedule an event. A designated administrator must review and approve each external action.

## Section 7. Source boundaries
Demo connector records and demo policies must be labeled synthetic. The system must not claim access to real school records or documents unless they were deliberately uploaded through an authorized workflow.`,
  },
  {
    sourceId: "POL-PRO-2026",
    title: "Operational Follow-up Procedure",
    category: "procedure",
    description: "Demo procedure for communications, tasks, and Calendar follow-ups.",
    filename: "follow-up-procedure-demo.md",
    mimeType: "text/markdown",
    version: "2026.1",
    effectiveDate: "2026-08-15",
    content: `# Operational Follow-up Procedure

## Section 1. Review sequence
Staff should review the evidence, confirm the policy basis, stage the recommended action, and record approval before taking an external action.

## Section 2. Communications
Synthetic Gmail demonstrations are limited to the connected test account. Draft approval and message delivery are separate recorded steps.

## Section 3. Calendar events
Calendar follow-ups require a persisted approved action. Events contain no attendees and send no updates unless a future authorized policy explicitly changes that behavior.`,
  },
] as const;

function toDateString(value: Date | null | undefined) {
  if (value === null) return null;
  if (value === undefined) return undefined;
  return value.toISOString().slice(0, 10);
}

async function seedDemoPolicies() {
  for (const policy of DEMO_POLICIES) {
    await db.insert(policyDocumentsTable).values({
      ...policy,
      status: "active",
      sourceKind: "demo",
      syntheticOnly: true,
    }).onConflictDoNothing({ target: policyDocumentsTable.sourceId });
  }
}

router.get("/policy-documents", async (_req, res): Promise<void> => {
  await seedDemoPolicies();
  const documents = await db.select().from(policyDocumentsTable).orderBy(
    asc(policyDocumentsTable.category),
    asc(policyDocumentsTable.title),
  );
  res.json(ListPolicyDocumentsResponse.parse(documents));
});

router.post("/policy-documents", async (req, res): Promise<void> => {
  const parsed = CreatePolicyDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Only reviewed synthetic text or Markdown policy documents can be added." });
    return;
  }
  if (!["text/plain", "text/markdown"].includes(parsed.data.mimeType)) {
    res.status(415).json({ error: "This demo currently supports .txt and .md policy documents only." });
    return;
  }

  const [document] = await db.insert(policyDocumentsTable).values({
    sourceId: `POL-UPL-${randomUUID()}`,
    title: parsed.data.title.trim(),
    category: parsed.data.category,
    description: parsed.data.description.trim(),
    filename: parsed.data.filename,
    mimeType: parsed.data.mimeType,
    content: parsed.data.content.trim(),
    version: parsed.data.version.trim(),
    effectiveDate: toDateString(parsed.data.effectiveDate) ?? null,
    status: "active",
    sourceKind: "uploaded",
    syntheticOnly: true,
  }).returning();

  if (!document) {
    res.status(500).json({ error: "Policy document was not created." });
    return;
  }
  res.status(201).json(CreatePolicyDocumentResponse.parse(document));
});

router.patch("/policy-documents/:id", async (req, res): Promise<void> => {
  const params = UpdatePolicyDocumentParams.safeParse(req.params);
  const parsed = UpdatePolicyDocumentBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid policy document update." });
    return;
  }

  const { syntheticDataOnly: _syntheticDataOnly, ...update } = parsed.data;
  const [document] = await db.update(policyDocumentsTable).set({
    ...update,
    effectiveDate: toDateString(update.effectiveDate),
    updatedAt: new Date(),
  }).where(eq(policyDocumentsTable.id, params.data.id)).returning();

  if (!document) {
    res.status(404).json({ error: "Policy document not found." });
    return;
  }
  res.json(UpdatePolicyDocumentResponse.parse(document));
});

router.delete("/policy-documents/:id", async (req, res): Promise<void> => {
  const params = DeletePolicyDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid policy document id." });
    return;
  }

  const [document] = await db.delete(policyDocumentsTable)
    .where(eq(policyDocumentsTable.id, params.data.id))
    .returning({ id: policyDocumentsTable.id });
  if (!document) {
    res.status(404).json({ error: "Policy document not found." });
    return;
  }
  res.json(DeletePolicyDocumentResponse.parse({ deleted: true, id: document.id }));
});

export default router;