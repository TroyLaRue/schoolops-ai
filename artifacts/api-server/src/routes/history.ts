import { Router, type IRouter } from "express";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db, agentActionsTable, agentIssuesTable, agentRunsTable } from "@workspace/db";
import {
  CreateAgentActionBody,
  CreateAgentRunBody,
  GetActivityHistoryResponse,
  UpdateAgentActionBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

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
    subject: "Action Required: Attendance Check",
    title: "Action Required: Attendance Check",
    message: "Team, we are seeing an anomalous 81% attendance rate for Grade 11 today. Please check in with absent advisees to determine if this is illness-related or an unapproved skip day. Report findings by 12:00 PM.",
    reason: "Attendance anomaly detection.",
    status: "approved",
  },
] as const;

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

async function seedDemoHistory() {
  const existing = await db.select({ id: agentRunsTable.id }).from(agentRunsTable).limit(1);
  if (existing.length > 0) return;

  await db.transaction(async (tx) => {
    const [run] = await tx.insert(agentRunsTable).values({
      status: "completed",
      activityLog: [...SEED_ACTIVITY],
      summary: "Morning audit completed with 4 findings and 4 recommended actions.",
      startedAt: new Date(Date.now() - 1000 * 60 * 90),
      completedAt: new Date(Date.now() - 1000 * 60 * 84),
    }).returning();

    if (!run) return;

    for (const issue of SEED_ISSUES) {
      const [savedIssue] = await tx.insert(agentIssuesTable).values({
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
      approvedAt: communication.status === "approved" ? new Date(Date.now() - 1000 * 60 * 70) : null,
    })));
  });
}

async function getHistoryData() {
  await seedDemoHistory();
  const runs = await db.select().from(agentRunsTable).orderBy(desc(agentRunsTable.startedAt));
  const issues = await db.select().from(agentIssuesTable).orderBy(asc(agentIssuesTable.id));
  const actions = await db.select().from(agentActionsTable).orderBy(desc(agentActionsTable.createdAt));

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
  const data = await getHistoryData();
  res.json(GetActivityHistoryResponse.parse(data));
});

router.post("/agent-runs", async (req, res): Promise<void> => {
  const parsed = CreateAgentRunBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid agent run payload." });
    return;
  }

  const data = await db.transaction(async (tx) => {
    const [run] = await tx.insert(agentRunsTable).values({
      status: "running",
      activityLog: parsed.data.activityLog,
    }).returning();
    if (!run) throw new Error("Agent run was not created.");

    const issueRows: IssueRow[] = [];
    const actionRows: ActionRow[] = [];
    for (const issue of parsed.data.issues) {
      const [savedIssue] = await tx.insert(agentIssuesTable).values({
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
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid agent run id." });
    return;
  }

  const [run] = await db.update(agentRunsTable)
    .set({
      status: "completed",
      completedAt: new Date(),
      summary: "Morning audit completed. Findings and recommendations are ready for review.",
    })
    .where(eq(agentRunsTable.id, id))
    .returning();

  if (!run) {
    res.status(404).json({ error: "Agent run not found." });
    return;
  }

  const issues = await db.select().from(agentIssuesTable).where(eq(agentIssuesTable.runId, id));
  const actions = await db.select().from(agentActionsTable).where(eq(agentActionsTable.runId, id));
  res.json(toRun(run, issues, actions));
});

router.post("/actions", async (req, res): Promise<void> => {
  const parsed = CreateAgentActionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid action payload." });
    return;
  }

  const [action] = await db.insert(agentActionsTable).values(parsed.data).returning();
  if (!action) {
    res.status(500).json({ error: "Action was not created." });
    return;
  }
  res.status(201).json(toAction(action));
});

router.patch("/actions/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const parsed = UpdateAgentActionBody.safeParse(req.body);
  if (!Number.isInteger(id) || !parsed.success) {
    res.status(400).json({ error: "Invalid action update." });
    return;
  }

  const [existing] = await db.select().from(agentActionsTable).where(eq(agentActionsTable.id, id)).limit(1);
  if (!existing) {
    res.status(404).json({ error: "Action not found." });
    return;
  }

  const now = new Date();
  const status = parsed.data.status;
  const [action] = await db.update(agentActionsTable).set({
    status,
    approvedAt: status === "approved" ? now : existing.approvedAt,
    dismissedAt: status === "dismissed" ? now : existing.dismissedAt,
    completedAt: status === "completed" ? now : existing.completedAt,
  }).where(eq(agentActionsTable.id, id)).returning();

  if (!action) {
    res.status(404).json({ error: "Action not found." });
    return;
  }
  res.json(toAction(action));
});

export default router;