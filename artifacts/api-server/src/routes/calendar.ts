import { ReplitConnectors } from "@replit/connectors-sdk";
import { and, eq } from "drizzle-orm";
import { Router, type IRouter, type Response } from "express";
import { agentActionsTable, db, schoolsTable } from "@workspace/db";
import {
  CreateCalendarFollowUpBody,
  CreateCalendarFollowUpResponse,
  GetCalendarStatusResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

type SchoolContext = { id: number; slug: string; name: string; role: "admin" | "principal" | "staff" };

function getSchool(res: Response): SchoolContext {
  return res.locals.school as SchoolContext;
}

function requireAdministrator(res: Response): boolean {
  const { role } = getSchool(res);
  if (role === "admin" || role === "principal") return true;
  res.status(403).json({ error: "Administrator or principal access is required." });
  return false;
}

interface CalendarProposal {
  studentId: string;
  start: string;
  end: string;
  timeZone: string;
}

function parseProposal(content: string | null): CalendarProposal | null {
  if (!content) return null;
  try {
    const value = JSON.parse(content) as Partial<CalendarProposal>;
    if (
      typeof value.studentId !== "string"
      || typeof value.start !== "string"
      || typeof value.end !== "string"
      || typeof value.timeZone !== "string"
      || value.timeZone.trim().length === 0
      || Number.isNaN(Date.parse(value.start))
      || Number.isNaN(Date.parse(value.end))
      || Date.parse(value.end) <= Date.parse(value.start)
    ) {
      return null;
    }
    return value as CalendarProposal;
  } catch {
    return null;
  }
}

router.get("/calendar/status", async (req, res): Promise<void> => {
  const { role, slug } = getSchool(res);
  if (slug !== "oakridge-middle") {
    res.json(GetCalendarStatusResponse.parse({
      connected: false,
      canCreate: false,
      accountLabel: "No calendar connected for this school",
    }));
    return;
  }
  const canManage = role === "admin" || role === "principal";
  try {
    const connectors = new ReplitConnectors();
    const response = await connectors.proxy(
      "google-calendar",
      "/calendar/v3/users/me/calendarList?maxResults=10&minAccessRole=writer",
      { method: "GET" },
    );

    if (!response.ok) {
      req.log.warn({ statusCode: response.status }, "Google Calendar status check failed");
      res.json(GetCalendarStatusResponse.parse({
        connected: false,
        canCreate: false,
        accountLabel: "Google Calendar not connected",
      }));
      return;
    }

    const calendarList = await response.json() as { items?: Array<{ accessRole?: string }> };
    const canCreate = calendarList.items?.some((item) => item.accessRole === "owner" || item.accessRole === "writer") === true;
    res.json(GetCalendarStatusResponse.parse({
      connected: true,
      canCreate: canManage && canCreate,
      accountLabel: "Connected Google Calendar",
    }));
  } catch (error) {
    req.log.warn({ error }, "Google Calendar connector unavailable");
    res.json(GetCalendarStatusResponse.parse({
      connected: false,
      canCreate: false,
      accountLabel: "Google Calendar not connected",
    }));
  }
});

router.post("/calendar/follow-ups", async (req, res): Promise<void> => {
  if (!requireAdministrator(res)) return;
  const school = getSchool(res);
  if (school.slug !== "oakridge-middle") {
    res.status(403).json({ error: "The shared demo calendar is not connected for this school." });
    return;
  }
  const parsed = CreateCalendarFollowUpBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ validationError: parsed.error.message }, "Rejected unsafe Calendar follow-up request");
    res.status(400).json({ error: "Only explicitly approved synthetic follow-ups can be created." });
    return;
  }

  const [action] = await db.select().from(agentActionsTable).where(and(
    eq(agentActionsTable.id, parsed.data.actionId),
    eq(agentActionsTable.schoolId, school.id),
    eq(agentActionsTable.type, "task"),
    eq(agentActionsTable.channel, "calendar"),
  )).limit(1);

  if (!action) {
    res.status(404).json({ error: "Calendar follow-up action not found." });
    return;
  }
  if (action.status !== "approved") {
    res.status(409).json({ error: action.status === "completed" ? "This follow-up was already created." : "This follow-up must be approved before calendar creation." });
    return;
  }

  const proposal = parseProposal(action.content);
  const [schoolRecord] = await db.select({
    operationsData: schoolsTable.operationsData,
    syntheticOnly: schoolsTable.syntheticOnly,
  })
    .from(schoolsTable).where(eq(schoolsTable.id, school.id)).limit(1);
  const students = schoolRecord?.syntheticOnly ? schoolRecord.operationsData?.students : undefined;
  const matchingStudent = Array.isArray(students)
    ? students.find((entry: unknown): entry is { id: string; name: string } =>
      typeof entry === "object" && entry !== null
      && "id" in entry && typeof entry.id === "string" && entry.id === proposal?.studentId
      && "name" in entry && typeof entry.name === "string")
    : undefined;
  if (!proposal || !matchingStudent) {
    req.log.warn({ actionId: action.id }, "Rejected invalid persisted Calendar proposal");
    res.status(400).json({ error: "The persisted follow-up proposal is invalid or is not synthetic demo data." });
    return;
  }

  try {
    const connectors = new ReplitConnectors();
    const eventId = `schoolopsevent${action.id}`;
    const eventPath = `/calendar/v3/calendars/primary/events?sendUpdates=none`;
    const eventBody = {
      id: eventId,
      summary: "Synthetic SchoolOps follow-up review",
      description: `Synthetic SchoolOps follow-up review for ${matchingStudent.name} (${matchingStudent.id}). Review the synthetic record and confirm the appropriate support step. No real student data or attendees are included.`,
      start: { dateTime: proposal.start, timeZone: proposal.timeZone },
      end: { dateTime: proposal.end, timeZone: proposal.timeZone },
      extendedProperties: {
        private: {
          schoolopsActionId: String(action.id),
          schoolopsStudentId: proposal.studentId,
          syntheticDataOnly: "true",
        },
      },
    };

    const createResponse = await connectors.proxy("google-calendar", eventPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventBody),
    });

    if (!createResponse.ok && createResponse.status !== 409) {
      req.log.warn({ actionId: action.id, statusCode: createResponse.status }, "Google Calendar follow-up creation failed");
      res.status(503).json({ error: "Google Calendar could not create the approved follow-up." });
      return;
    }

    if (createResponse.status === 409) {
      const existingResponse = await connectors.proxy(
        "google-calendar",
        `/calendar/v3/calendars/primary/events/${eventId}`,
        { method: "GET" },
      );
      if (!existingResponse.ok) {
        res.status(503).json({ error: "Google Calendar could not confirm the existing follow-up." });
        return;
      }
    }

    const now = new Date();
    const [completedAction] = await db.update(agentActionsTable).set({
      status: "completed",
      completedAt: now,
    }).where(and(
      eq(agentActionsTable.id, action.id),
      eq(agentActionsTable.schoolId, school.id),
      eq(agentActionsTable.status, "approved"),
    )).returning();

    if (!completedAction) {
      res.status(409).json({ error: "The follow-up action changed before completion could be recorded." });
      return;
    }

    req.log.info({ actionId: action.id, sourceId: action.sourceId }, "Approved synthetic Google Calendar follow-up created");
    res.json(CreateCalendarFollowUpResponse.parse({
      created: true,
      eventId,
      calendarLabel: "Connected Google Calendar",
      actionId: action.id,
      completedAt: now,
    }));
  } catch (error) {
    req.log.error({ error, actionId: action.id }, "Google Calendar follow-up request failed");
    res.status(503).json({ error: "Google Calendar is temporarily unavailable." });
  }
});

export default router;