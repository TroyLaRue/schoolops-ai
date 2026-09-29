import { Router, type IRouter, type Response } from "express";
import { and, asc, desc, eq } from "drizzle-orm";
import { db, agentActionsTable, agentIssuesTable, agentRunsTable } from "@workspace/db";
import {
  CreateAgentActionBody,
  CreateAgentRunBody,
  GetActivityHistoryResponse,
  UpdateAgentActionBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

type SchoolContext = { id: number; slug: string; name: string; role: "admin" | "principal" | "staff" };

function getSchool(res: Response): SchoolContext {
  return res.locals.school as SchoolContext;
}

function isAdministrator(school: SchoolContext): boolean {
  return school.role === "admin" || school.role === "principal";
}

type ActionRow = typeof agentActionsTable.$inferSelect;
type IssueRow = typeof agentIssuesTable.$inferSelect;
type RunRow = typeof agentRunsTable.$inferSelect;

const SEED_ISSUES = [
  {
    sourceId: "iss-001",
    title: "37 Students Missing Immunization Records",
    category: "Required Documents",
    severity: "critical",
    evidence: "37 students in Grade 6-8 have not submitted updated Tdap booster records. State reporting deadline is 5:00 PM today.",
    impact: "Non-compliance results in automatic state funding deductions and students must be excluded from campus starting tomorrow.",
    actions: [
      {
        sourceId: "act-001a",
        type: "communication",
        title: "Draft Urgent SMS to Parents",
        description: "Send a final warning SMS to the 37 unverified families.",
        content: "URGENT from Oakridge Middle: Your child is missing required Tdap records. By state law, they cannot attend school tomorrow without proof of vaccination. Please upload to the parent portal immediately.",
      },
      {
        sourceId: "act-001b",
        type: "task",
        title: "Create Task for Nurse Jenkins",
        description: "Instruct school nurse to process incoming forms immediately.",
        content: "Task: Review and approve pending Tdap uploads in SIS. Priority: HIGH.",
      },
    ],
  },
  {
    sourceId: "iss-002",
    title: "Unusual Attendance Drop in Grade 11",
    category: "Attendance",
    severity: "critical",
    evidence: "Grade 11 attendance dropped to 81% today (historical average 94%). 23 students absent.",
    impact: "Sudden drops often indicate a spreading illness or an unapproved senior skip day. Needs immediate investigation.",
    actions: [
      {
        sourceId: "act-002a",
        type: "communication",
        title: "Email 11th Grade Advisors",
        description: "Ask advisors to check in with absent students.",
        content: "Subject: URGENT: Grade 11 Attendance Drop\n\nHi team, we are seeing an 81% attendance rate for Grade 11 today. Please reach out to your advisees who are absent to determine if this is illness-related or other coordinated absences.",
      },
    ],
  },
  {
    sourceId: "iss-003",
    title: "12 Inquiries pending follow-up > 48 hours",
    category: "Enrollment",
    severity: "attention",
    evidence: "12 prospective families for Grade 9 have not been contacted since submitting inquiry forms on Tuesday.",
    impact: "Lead conversion drops by 40% when response time exceeds 24 hours.",
    actions: [
      {
        sourceId: "act-003a",
        type: "task",
        title: "Assign to Admissions Team",
        description: "Create a high-priority task in CRM for admissions.",
        content: "Task: Follow up with 12 aging inquiries for Grade 9. Goal: Schedule campus tours.",
      },
    ],
  },
  {
    sourceId: "iss-004",
    title: "Tuition Collection on Track",
    category: "Tuition/Payment",
    severity: "healthy",
    evidence: "94% of October installments collected successfully.",
    impact: "Ensures operational cash flow for payroll next week.",
    actions: [],
  },
] as const;

const SAFE_SYNTHETIC_EMAIL_TEMPLATE = {
  subject: "SchoolOps synthetic follow-up test",
  content: "This is a synthetic SchoolOps email test. It contains no student, family, or school operational information.",
};

const SEED_COMMUNICATIONS = [
  {
    sourceId: "COM-2041",
    recipient: "Johnson Family (Maya Johnson, 11th)",
    channel: "email",
    subject: "Urgent: Missing Immunization Record",
    title: "Urgent: Missing Immunization Record",
    message: "Dear Johnson Family,\n\nOur records indicate that Maya is missing the required Tdap booster record. Per state law, students without this documentation cannot attend classes starting tomorrow. Please upload the record to the portal immediately.",
    reason: "State compliance deadline approaching.",
    status: "pending",
  },
  {
    sourceId: "COM-2042",
    recipient: "Williams Family (Olivia Williams, 8th)",
    channel: "sms",
    title: "Missing emergency contact forms",
    subject: null,
    message: "Oakridge Middle: Olivia is missing required emergency contact forms. Please update via parent portal today to avoid field trip restrictions.",
    reason: "Missing emergency contacts.",
    status: "pending",
  },
  {
    sourceId: "COM-2043",
    recipient: "11th Grade Advisors",
    channel: "email",
    subject: SAFE_SYNTHETIC_EMAIL_TEMPLATE.subject,
    title: "SchoolOps synthetic follow-up test",
    message: SAFE_SYNTHETIC_EMAIL_TEMPLATE.content,
    reason: "Server-provided safe demo email template.",
    status: "pending",
  },
] as const;

const SEED_ISSUE_SOURCE_IDS = new Set(SEED_ISSUES.map((issue) => issue.sourceId));
const SEED_ACTION_SOURCE_IDS = new Set([
  ...SEED_ISSUES.flatMap((issue) => issue.actions.map((action) => action.sourceId)),
  ...SEED_COMMUNICATIONS.map((communication) => communication.sourceId),
]);

function isOakridgeSeedSourceId(sourceId: string): boolean {
  return [...SEED_ISSUE_SOURCE_IDS, ...SEED_ACTION_SOURCE_IDS].some((seedId) =>
    sourceId === seedId || sourceId.startsWith(`${seedId}-`));
}

const SEED_ACTIVITY = [
  "Initializing Morning Audit...",
  "Connecting to SIS (Student Information System)...",
  "Analyzing attendance patterns across 1,240 active students...",
  "Flagging anomaly: Grade 11 attendance variance > 10%...",
  "Checking state compliance document statuses...",
  "Identified 37 critical missing immunization records.",
  "Reviewing enrollment inquiries and tuition collection...",
  "Morning Audit complete. Recommendations ready for review.",
];

function toAction(row: ActionRow) {
  return {
    id: row.id,
    sourceId: row.sourceId,
    issueId: row.issueId,
    type: row.type,
    title: row.title,
    description: row.description,
    content: row.content,
    recipient: row.recipient,
    subject: row.subject,
    channel: row.channel,
    reason: row.reason,
    status: row.status,
    createdAt: row.createdAt,
    approvedAt: row.approvedAt,
    dismissedAt: row.dismissedAt,
    completedAt: row.completedAt,
  };
}

function toIssue(row: IssueRow, actions: ActionRow[]) {
  return {
    id: row.id,
    sourceId: row.sourceId,
    title: row.title,
    category: row.category,
    severity: row.severity,
    evidence: row.evidence,
    impact: row.impact,
    status: row.status,
    createdAt: row.createdAt,
    actions: actions.filter((action) => action.issueId === row.id).map(toAction),
  };
}

function toRun(row: RunRow, issues: IssueRow[], actions: ActionRow[]) {
  return {
    id: row.id,
    status: row.status,
    activityLog: row.activityLog,
    summary: row.summary,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    issueCount: issues.length,
    issues: issues.map((issue) => toIssue(issue, actions)),
  };
}

async function seedDemoHistory(school: SchoolContext) {
  if (school.slug !== "oakridge-middle") return;
  const existing = await db.select({ id: agentRunsTable.id }).from(agentRunsTable)
    .where(eq(agentRunsTable.schoolId, school.id)).limit(1);
  if (existing.length > 0) {
    const safeDraft = await db.select({ id: agentActionsTable.id }).from(agentActionsTable).where(and(
      eq(agentActionsTable.schoolId, school.id),
      eq(agentActionsTable.subject, SAFE_SYNTHETIC_EMAIL_TEMPLATE.subject),
      eq(agentActionsTable.content, SAFE_SYNTHETIC_EMAIL_TEMPLATE.content),
    )).limit(1);
    if (safeDraft.length === 0) {
      await db.insert(agentActionsTable).values({
        schoolId: school.id,
        runId: existing[0].id,
        sourceId: `COM-SYNTHETIC-EMAIL-${school.id}`,
        type: "communication",
        title: SAFE_SYNTHETIC_EMAIL_TEMPLATE.subject,
        description: "Server-provided synthetic Gmail template for administrator review.",
        content: SAFE_SYNTHETIC_EMAIL_TEMPLATE.content,
        recipient: "Connected Gmail test account (self-send)",
        subject: SAFE_SYNTHETIC_EMAIL_TEMPLATE.subject,
        channel: "email",
        reason: "Server-provided safe synthetic email template.",
        status: "pending",
      }).onConflictDoNothing();
    }
    return;
  }

  await db.transaction(async (tx) => {
    const [run] = await tx.insert(agentRunsTable).values({
      schoolId: school.id,
      status: "completed",
      activityLog: [...SEED_ACTIVITY],
      summary: "Morning audit completed with 4 findings and 4 recommended actions.",
      startedAt: new Date(Date.now() - 1000 * 60 * 90),
      completedAt: new Date(Date.now() - 1000 * 60 * 84),
    }).returning();

    if (!run) return;

    for (const issue of SEED_ISSUES) {
      const [savedIssue] = await tx.insert(agentIssuesTable).values({
        schoolId: school.id,
        runId: run.id,
        sourceId: issue.sourceId,
        title: issue.title,
        category: issue.category,
        severity: issue.severity,
        evidence: issue.evidence,
        impact: issue.impact,
      }).returning();

      if (!savedIssue || issue.actions.length === 0) continue;
      await tx.insert(agentActionsTable).values(issue.actions.map((action) => ({
        schoolId: school.id,
        runId: run.id,
        issueId: savedIssue.id,
        sourceId: action.sourceId,
        type: action.type,
        title: action.title,
        description: action.description,
        content: action.content,
        status: "pending",
      })));
    }

    await tx.insert(agentActionsTable).values(SEED_COMMUNICATIONS.map((communication) => ({
      schoolId: school.id,
      runId: run.id,
      sourceId: communication.sourceId,
      type: "communication",
      title: communication.title,
      description: `Synthetic ${communication.channel} draft for administrator review.`,
      content: communication.message,
      recipient: communication.recipient,
      subject: communication.subject ?? null,
      channel: communication.channel,
      reason: communication.reason,
      status: communication.status,
      approvedAt: null,
    })));
  });
}

async function getHistoryData(school: SchoolContext) {
  await seedDemoHistory(school);
  const storedRuns = await db.select().from(agentRunsTable)
    .where(eq(agentRunsTable.schoolId, school.id)).orderBy(desc(agentRunsTable.startedAt));
  const storedIssues = await db.select().from(agentIssuesTable)
    .where(eq(agentIssuesTable.schoolId, school.id)).orderBy(asc(agentIssuesTable.id));
  const storedActions = await db.select().from(agentActionsTable)
    .where(eq(agentActionsTable.schoolId, school.id)).orderBy(desc(agentActionsTable.createdAt));
  const copiedSeedRunIds = school.slug === "oakridge-middle"
    ? new Set<number>()
    : new Set(storedIssues.filter((issue) => isOakridgeSeedSourceId(issue.sourceId)).map((issue) => issue.runId));
  const runs = storedRuns.filter((run) => !copiedSeedRunIds.has(run.id));
  const issues = storedIssues.filter((issue) =>
    !copiedSeedRunIds.has(issue.runId) && (school.slug === "oakridge-middle" || !isOakridgeSeedSourceId(issue.sourceId)));
  const actions = storedActions.filter((action) =>
    !copiedSeedRunIds.has(action.runId ?? -1)
    && (school.slug === "oakridge-middle" || !isOakridgeSeedSourceId(action.sourceId)));

  return {
    runs: runs.map((run) => toRun(
      run,
      issues.filter((issue) => issue.runId === run.id),
      actions,
    )),
    actions: actions.map(toAction),
  };
}

router.get("/history", async (_req, res): Promise<void> => {
  const data = await getHistoryData(getSchool(res));
  res.json(GetActivityHistoryResponse.parse(data));
});

router.post("/agent-runs", async (req, res): Promise<void> => {
  const school = getSchool(res);
  const parsed = CreateAgentRunBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid agent run payload." });
    return;
  }
  const referencedRunIds = parsed.data.issues.flatMap((issue) => issue.actions
    .map((action) => action.runId).filter((id): id is number => id != null));
  const referencedIssueIds = parsed.data.issues.flatMap((issue) => issue.actions
    .map((action) => action.issueId).filter((id): id is number => id != null));
  if (referencedRunIds.length > 0 || referencedIssueIds.length > 0) {
    const [referencedRun] = referencedRunIds.length > 0
      ? await db.select({ id: agentRunsTable.id }).from(agentRunsTable).where(and(
        eq(agentRunsTable.id, referencedRunIds[0]),
        eq(agentRunsTable.schoolId, school.id),
      )).limit(1)
      : [];
    const [referencedIssue] = referencedIssueIds.length > 0
      ? await db.select({ id: agentIssuesTable.id }).from(agentIssuesTable).where(and(
        eq(agentIssuesTable.id, referencedIssueIds[0]),
        eq(agentIssuesTable.schoolId, school.id),
      )).limit(1)
      : [];
    if ((referencedRunIds.length > 0 && !referencedRun)
      || (referencedIssueIds.length > 0 && !referencedIssue)) {
      res.status(404).json({ error: "Referenced agent records were not found for this school." });
      return;
    }
    res.status(400).json({ error: "New run actions cannot reference existing runs or issues." });
    return;
  }
  if (parsed.data.issues.some((issue) => issue.actions.some((action) => action.status !== "pending"))) {
    res.status(400).json({ error: "New agent actions must be staged as pending." });
    return;
  }

  const data = await db.transaction(async (tx) => {
    const [run] = await tx.insert(agentRunsTable).values({
      schoolId: school.id,
      status: "running",
      activityLog: parsed.data.activityLog,
    }).returning();
    if (!run) throw new Error("Agent run was not created.");

    const issueRows: IssueRow[] = [];
    const actionRows: ActionRow[] = [];
    for (const issue of parsed.data.issues) {
      const [savedIssue] = await tx.insert(agentIssuesTable).values({
        schoolId: school.id,
        runId: run.id,
        sourceId: issue.sourceId,
        title: issue.title,
        category: issue.category,
        severity: issue.severity,
        evidence: issue.evidence,
        impact: issue.impact,
      }).returning();
      if (!savedIssue) continue;
      issueRows.push(savedIssue);
      if (issue.actions.length > 0) {
        const savedActions = await tx.insert(agentActionsTable).values(issue.actions.map((action) => ({
          schoolId: school.id,
          runId: run.id,
          issueId: savedIssue.id,
          sourceId: action.sourceId,
          type: action.type,
          title: action.title,
          description: action.description,
          content: action.content,
          status: action.status,
        }))).returning();
        actionRows.push(...savedActions);
      }
    }

    return toRun(run, issueRows, actionRows);
  });

  res.status(201).json(data);
});

router.post("/agent-runs/:id/complete", async (req, res): Promise<void> => {
  const school = getSchool(res);
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid agent run id." });
    return;
  }
  if (school.slug !== "oakridge-middle") {
    const copied = await db.select({ sourceId: agentIssuesTable.sourceId }).from(agentIssuesTable)
      .where(and(eq(agentIssuesTable.runId, id), eq(agentIssuesTable.schoolId, school.id)));
    if (copied.some((issue) => isOakridgeSeedSourceId(issue.sourceId))) {
      res.status(404).json({ error: "Agent run not found." });
      return;
    }
  }

  const [run] = await db.update(agentRunsTable)
    .set({
      status: "completed",
      completedAt: new Date(),
      summary: "Morning audit completed. Findings and recommendations are ready for review.",
    })
    .where(and(
      eq(agentRunsTable.id, id),
      eq(agentRunsTable.schoolId, school.id),
    ))
    .returning();

  if (!run) {
    res.status(404).json({ error: "Agent run not found." });
    return;
  }

  const issues = await db.select().from(agentIssuesTable).where(and(
    eq(agentIssuesTable.runId, id),
    eq(agentIssuesTable.schoolId, school.id),
  ));
  const actions = await db.select().from(agentActionsTable).where(and(
    eq(agentActionsTable.runId, id),
    eq(agentActionsTable.schoolId, school.id),
  ));
  res.json(toRun(run, issues, actions));
});

router.post("/actions", async (req, res): Promise<void> => {
  const school = getSchool(res);
  const parsed = CreateAgentActionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid action payload." });
    return;
  }

  if (parsed.data.status !== "pending") {
    res.status(400).json({ error: "New actions must be staged as pending." });
    return;
  }
  if (parsed.data.runId != null) {
    const [run] = await db.select({ id: agentRunsTable.id }).from(agentRunsTable).where(and(
      eq(agentRunsTable.id, parsed.data.runId),
      eq(agentRunsTable.schoolId, school.id),
    )).limit(1);
    if (!run) {
      res.status(404).json({ error: "Agent run not found." });
      return;
    }
  }
  if (parsed.data.issueId != null) {
    const [issue] = await db.select({
      id: agentIssuesTable.id,
      runId: agentIssuesTable.runId,
    }).from(agentIssuesTable).where(and(
      eq(agentIssuesTable.id, parsed.data.issueId),
      eq(agentIssuesTable.schoolId, school.id),
    )).limit(1);
    if (!issue || (parsed.data.runId != null && issue.runId !== parsed.data.runId)) {
      res.status(404).json({ error: "Agent issue not found for this school and run." });
      return;
    }
    if (parsed.data.runId == null) {
      const [run] = await db.select({ id: agentRunsTable.id }).from(agentRunsTable).where(and(
        eq(agentRunsTable.id, issue.runId),
        eq(agentRunsTable.schoolId, school.id),
      )).limit(1);
      if (!run) {
        res.status(404).json({ error: "Agent run not found for this school." });
        return;
      }
    }
  }

  const [action] = await db.insert(agentActionsTable).values({
    ...parsed.data,
    schoolId: school.id,
  }).returning();
  if (!action) {
    res.status(500).json({ error: "Action was not created." });
    return;
  }
  res.status(201).json(toAction(action));
});

router.patch("/actions/:id", async (req, res): Promise<void> => {
  const school = getSchool(res);
  const id = Number(req.params.id);
  const parsed = UpdateAgentActionBody.safeParse(req.body);
  if (!Number.isInteger(id) || !parsed.success) {
    res.status(400).json({ error: "Invalid action update." });
    return;
  }

  const [existing] = await db.select().from(agentActionsTable).where(and(
    eq(agentActionsTable.id, id),
    eq(agentActionsTable.schoolId, school.id),
  )).limit(1);
  if (!existing || (school.slug !== "oakridge-middle" && isOakridgeSeedSourceId(existing.sourceId))) {
    res.status(404).json({ error: "Action not found." });
    return;
  }

  const now = new Date();
  const status = parsed.data.status;
  if (status !== existing.status) {
    const allowed = existing.status === "pending"
      ? status === "approved" || status === "dismissed"
      : existing.status === "approved" && status === "completed";
    if (!allowed) {
      res.status(409).json({ error: `Action cannot transition from ${existing.status} to ${status}.` });
      return;
    }
    if ((status === "approved" || status === "dismissed" || status === "completed") && !isAdministrator(school)) {
      res.status(403).json({ error: "Administrator or principal access is required for this status change." });
      return;
    }
  }
  const [action] = await db.update(agentActionsTable).set({
    status,
    approvedAt: status === "approved" ? now : existing.approvedAt,
    dismissedAt: status === "dismissed" ? now : existing.dismissedAt,
    completedAt: status === "completed" ? now : existing.completedAt,
  }).where(and(
    eq(agentActionsTable.id, id),
    eq(agentActionsTable.schoolId, school.id),
    eq(agentActionsTable.status, existing.status),
  )).returning();

  if (!action) {
    res.status(409).json({ error: "The action changed before the update could be recorded." });
    return;
  }
  res.json(toAction(action));
});

export default router;