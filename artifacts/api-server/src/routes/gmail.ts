import { and, eq } from "drizzle-orm";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { Router, type IRouter, type Response } from "express";
import { agentActionsTable, db } from "@workspace/db";
import {
  GetGmailStatusResponse,
  SendGmailDemoEmailBody,
  SendGmailDemoEmailResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const SAFE_SYNTHETIC_EMAIL_TEMPLATE = {
  subject: "SchoolOps synthetic follow-up test",
  body: "This is a synthetic SchoolOps email test. It contains no student, family, or school operational information.",
};

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

function encodeMessage(to: string, subject: string, body: string) {
  const safeSubject = subject.replace(/[\r\n]+/g, " ").trim();
  const message = [
    `To: ${to}`,
    `Subject: ${safeSubject}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
    "",
    body,
  ].join("\r\n");

  return Buffer.from(message, "utf8").toString("base64url");
}

router.get("/gmail/status", async (req, res): Promise<void> => {
  const { role, slug } = getSchool(res);
  if (slug !== "oakridge-middle") {
    res.json(GetGmailStatusResponse.parse({
      connected: false,
      canSend: false,
      accountLabel: "No Gmail account connected for this school",
    }));
    return;
  }
  const canManage = role === "admin" || role === "principal";
  try {
    const connectors = new ReplitConnectors();
    const response = await connectors.proxy("google-mail", "/gmail/v1/users/me/profile", {
      method: "GET",
    });

    if (!response.ok) {
      req.log.warn({ statusCode: response.status }, "Gmail profile check failed");
      res.json(GetGmailStatusResponse.parse({
        connected: false,
        canSend: false,
        accountLabel: "Demo Gmail account",
      }));
      return;
    }

    res.json(GetGmailStatusResponse.parse({
      connected: true,
      canSend: canManage,
      accountLabel: "Connected Gmail test account",
    }));
  } catch (error) {
    req.log.warn({ error }, "Gmail connector unavailable");
    res.json(GetGmailStatusResponse.parse({
      connected: false,
      canSend: false,
      accountLabel: "Demo Gmail account",
    }));
  }
});

router.post("/gmail/send", async (req, res): Promise<void> => {
  if (!requireAdministrator(res)) return;
  const school = getSchool(res);
  if (school.slug !== "oakridge-middle") {
    res.status(403).json({ error: "The shared demo Gmail account is not connected for this school." });
    return;
  }
  const parsed = SendGmailDemoEmailBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ validationError: parsed.error.message }, "Rejected unsafe Gmail demo send request");
    res.status(400).json({ error: "Only explicitly approved synthetic demo messages can be sent." });
    return;
  }
  if (
    parsed.data.subject !== SAFE_SYNTHETIC_EMAIL_TEMPLATE.subject
    || parsed.data.body !== SAFE_SYNTHETIC_EMAIL_TEMPLATE.body
  ) {
    res.status(403).json({ error: "Only the server-approved synthetic email template can be sent." });
    return;
  }

  const [approvedAction] = await db.select().from(agentActionsTable).where(and(
    eq(agentActionsTable.schoolId, school.id),
    eq(agentActionsTable.type, "communication"),
    eq(agentActionsTable.channel, "email"),
    eq(agentActionsTable.status, "approved"),
    eq(agentActionsTable.subject, parsed.data.subject),
    eq(agentActionsTable.content, parsed.data.body),
  )).limit(1);
  if (!approvedAction) {
    res.status(403).json({ error: "A persisted, approved synthetic email draft is required before sending." });
    return;
  }

  try {
    const connectors = new ReplitConnectors();
    const profileResponse = await connectors.proxy("google-mail", "/gmail/v1/users/me/profile", {
      method: "GET",
    });

    if (!profileResponse.ok) {
      res.status(503).json({ error: "Gmail credentials are not available." });
      return;
    }

    const profile = await profileResponse.json() as { emailAddress?: string };
    if (!profile.emailAddress) {
      res.status(503).json({ error: "The connected Gmail account could not be verified." });
      return;
    }

    const sendResponse = await connectors.proxy("google-mail", "/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        raw: encodeMessage(profile.emailAddress, parsed.data.subject, parsed.data.body),
      }),
    });

    if (!sendResponse.ok) {
      req.log.warn({ statusCode: sendResponse.status }, "Gmail demo send failed");
      res.status(503).json({ error: "Gmail could not send the approved demo message." });
      return;
    }

    const sentMessage = await sendResponse.json() as { id?: string };
    if (!sentMessage.id) {
      res.status(503).json({ error: "Gmail returned an invalid send response." });
      return;
    }

    try {
      const [auditedAction] = await db.update(agentActionsTable).set({
        status: "completed",
        completedAt: new Date(),
      }).where(and(
        eq(agentActionsTable.id, approvedAction.id),
        eq(agentActionsTable.schoolId, school.id),
        eq(agentActionsTable.status, "approved"),
      )).returning({ id: agentActionsTable.id });
      if (!auditedAction) {
        req.log.warn({ actionId: approvedAction.id }, "Gmail send succeeded but the approved action audit was concurrently updated");
      }
    } catch (error) {
      req.log.error({ error, actionId: approvedAction.id }, "Gmail send succeeded but the action audit could not be persisted");
    }

    req.log.info({ messageId: sentMessage.id }, "Approved synthetic Gmail demo message sent");
    res.json(SendGmailDemoEmailResponse.parse({
      sent: true,
      messageId: sentMessage.id,
      recipientLabel: "Connected Gmail test account",
    }));
  } catch (error) {
    req.log.error({ error }, "Gmail demo send request failed");
    res.status(503).json({ error: "Gmail is temporarily unavailable." });
  }
});

export default router;