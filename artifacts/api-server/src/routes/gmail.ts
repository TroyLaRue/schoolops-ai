import { ReplitConnectors } from "@replit/connectors-sdk";
import { Router, type IRouter } from "express";
import {
  GetGmailStatusResponse,
  SendGmailDemoEmailBody,
  SendGmailDemoEmailResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

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
      canSend: true,
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
  const parsed = SendGmailDemoEmailBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ validationError: parsed.error.message }, "Rejected unsafe Gmail demo send request");
    res.status(400).json({ error: "Only explicitly approved synthetic demo messages can be sent." });
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