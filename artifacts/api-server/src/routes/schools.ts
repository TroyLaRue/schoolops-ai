import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, count, eq, gt, isNull, sql } from "drizzle-orm";
import { Router, type IRouter, type Response } from "express";
import {
  ClaimDemoSchoolBody,
  ClaimDemoSchoolResponse,
  CreateSchoolBody,
  CreateSchoolInvitationBody,
  CreateSchoolInvitationResponse,
  CreateSchoolResponse,
  GetSchoolOperationsResponse,
  GetSessionResponse,
  JoinSchoolBody,
  JoinSchoolResponse,
  ListSchoolMembersResponse,
  SwitchSchoolBody,
  SwitchSchoolResponse,
  UpdateCurrentSchoolBody,
  UpdateCurrentSchoolResponse,
  UpdateSchoolMemberRoleBody,
  UpdateSchoolMemberRoleParams,
  UpdateSchoolMemberRoleResponse,
} from "@workspace/api-zod";
import {
  db,
  schoolInvitationsTable,
  schoolMembersTable,
  schoolsTable,
  type School,
  type SchoolRole,
} from "@workspace/db";
import { requireSignedIn, type ActiveSchoolContext } from "../middlewares/schoolContext";
import {
  ensureDemoSchools,
  isDemoSchoolSlug,
  syntheticOperationsForNewSchool,
} from "../lib/synthetic-schools";

export const sessionRouter: IRouter = Router();
export const onboardingRouter: IRouter = Router();
const schoolRouter: IRouter = Router();

type MemberWithSchool = {
  id: number;
  schoolId: number;
  clerkUserId: string;
  role: SchoolRole;
  isActive: boolean;
  createdAt: Date;
  school: School;
};

function localUserId(res: Response): string {
  return res.locals.clerkUserId as string;
}

function activeSchool(res: Response): ActiveSchoolContext {
  return res.locals.school as ActiveSchoolContext;
}

function schoolView(school: School) {
  return {
    id: school.id,
    slug: school.slug,
    name: school.name,
    settings: school.settings,
    syntheticOnly: school.syntheticOnly,
  };
}

function membershipView(membership: Omit<MemberWithSchool, "school">, school: School) {
  return {
    id: membership.id,
    schoolId: membership.schoolId,
    clerkUserId: membership.clerkUserId,
    role: membership.role,
    isActive: membership.isActive,
    createdAt: membership.createdAt,
    school: schoolView(school),
  };
}

function membershipPair(membership: Omit<MemberWithSchool, "school">, school: School) {
  return {
    school: schoolView(school),
    membership: membershipView(membership, school),
  };
}

async function membershipResult(clerkUserId: string, schoolId: number) {
  const [row] = await db.select({
    id: schoolMembersTable.id,
    schoolId: schoolMembersTable.schoolId,
    clerkUserId: schoolMembersTable.clerkUserId,
    role: schoolMembersTable.role,
    isActive: schoolMembersTable.isActive,
    createdAt: schoolMembersTable.createdAt,
    school: schoolsTable,
  }).from(schoolMembersTable)
    .innerJoin(schoolsTable, eq(schoolsTable.id, schoolMembersTable.schoolId))
    .where(and(
      eq(schoolMembersTable.clerkUserId, clerkUserId),
      eq(schoolMembersTable.schoolId, schoolId),
    ))
    .limit(1);
  return row;
}

sessionRouter.get("/session", requireSignedIn, async (_req, res): Promise<void> => {
  await ensureDemoSchools();
  const userId = localUserId(res);
  const rows = await db.select({
    id: schoolMembersTable.id,
    schoolId: schoolMembersTable.schoolId,
    clerkUserId: schoolMembersTable.clerkUserId,
    role: schoolMembersTable.role,
    isActive: schoolMembersTable.isActive,
    createdAt: schoolMembersTable.createdAt,
    school: schoolsTable,
  }).from(schoolMembersTable)
    .innerJoin(schoolsTable, eq(schoolsTable.id, schoolMembersTable.schoolId))
    .where(eq(schoolMembersTable.clerkUserId, userId));
  const memberships = rows.map(({ school, ...member }) => membershipPair(member, school));
  const currentSchool = memberships.find((membership) => membership.membership.isActive) ?? null;
  res.json(GetSessionResponse.parse({ userId, currentSchool, memberships }));
});

onboardingRouter.use(requireSignedIn);

onboardingRouter.post("/schools/claim", async (req, res): Promise<void> => {
  const parsed = ClaimDemoSchoolBody.safeParse(req.body);
  if (!parsed.success || !isDemoSchoolSlug(parsed.data.slug)) {
    res.status(400).json({ error: "Choose one of the available synthetic demo schools." });
    return;
  }
  const userId = localUserId(res);
  const demos = await ensureDemoSchools();
  const school = demos.get(parsed.data.slug);
  if (!school) {
    res.status(404).json({ error: "Demo school not found." });
    return;
  }

  const claimed = await db.transaction(async (tx) => {
    const [updatedSchool] = await tx.update(schoolsTable)
      .set({ isClaimed: true })
      .where(and(eq(schoolsTable.id, school.id), eq(schoolsTable.isClaimed, false)))
      .returning();
    if (!updatedSchool) return null;

    await tx.update(schoolMembersTable)
      .set({ isActive: false })
      .where(eq(schoolMembersTable.clerkUserId, userId));
    const [membership] = await tx.insert(schoolMembersTable).values({
      schoolId: updatedSchool.id,
      clerkUserId: userId,
      role: "admin",
      isActive: true,
    }).returning();
    if (!membership) throw new Error("Could not create demo school membership.");
    return { school: updatedSchool, membership };
  });
  if (!claimed) {
    res.status(409).json({ error: "That synthetic demo school has already been claimed." });
    return;
  }
  const result = {
    school: schoolView(claimed.school),
    membership: membershipView(claimed.membership, claimed.school),
  };
  res.status(201).json(ClaimDemoSchoolResponse.parse(result));
});

onboardingRouter.post("/schools", async (req, res): Promise<void> => {
  const parsed = CreateSchoolBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Provide a valid synthetic school name." });
    return;
  }
  const userId = localUserId(res);
  const name = parsed.data.name.trim();
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "school";
  const school = await db.transaction(async (tx) => {
    await tx.update(schoolMembersTable)
      .set({ isActive: false })
      .where(eq(schoolMembersTable.clerkUserId, userId));
    const [createdSchool] = await tx.insert(schoolsTable).values({
      slug: `${baseSlug}-${randomUUID().slice(0, 8)}`,
      name,
      settings: {},
      operationsData: syntheticOperationsForNewSchool(name) as unknown as Record<string, unknown>,
      syntheticOnly: true,
      isDemo: false,
      isClaimed: true,
    }).returning();
    if (!createdSchool) throw new Error("School was not created.");
    const [membership] = await tx.insert(schoolMembersTable).values({
      schoolId: createdSchool.id,
      clerkUserId: userId,
      role: "admin",
      isActive: true,
    }).returning();
    if (!membership) throw new Error("School membership was not created.");
    return { school: createdSchool, membership };
  });
  const result = {
    school: schoolView(school.school),
    membership: membershipView(school.membership, school.school),
  };
  res.status(201).json(CreateSchoolResponse.parse(result));
});

onboardingRouter.post("/schools/switch", async (req, res): Promise<void> => {
  const parsed = SwitchSchoolBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Provide a valid school membership." });
    return;
  }
  const userId = localUserId(res);
  const membership = await membershipResult(userId, parsed.data.schoolId);
  if (!membership) {
    res.status(403).json({ error: "You are not a member of that school." });
    return;
  }
  await db.transaction(async (tx) => {
    await tx.update(schoolMembersTable)
      .set({ isActive: false })
      .where(eq(schoolMembersTable.clerkUserId, userId));
    await tx.update(schoolMembersTable)
      .set({ isActive: true })
      .where(and(
        eq(schoolMembersTable.clerkUserId, userId),
        eq(schoolMembersTable.schoolId, parsed.data.schoolId),
      ));
  });
  const active = await membershipResult(userId, parsed.data.schoolId);
  if (!active) {
    res.status(500).json({ error: "Could not activate school membership." });
    return;
  }
  const result = membershipPair(active, active.school);
  res.json(SwitchSchoolResponse.parse(result));
});

onboardingRouter.post("/schools/join", async (req, res): Promise<void> => {
  const parsed = JoinSchoolBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Provide a valid invitation token." });
    return;
  }
  const userId = localUserId(res);
  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const result = await db.transaction(async (tx) => {
    const [invitation] = await tx.select().from(schoolInvitationsTable)
      .where(and(
        eq(schoolInvitationsTable.tokenHash, tokenHash),
        isNull(schoolInvitationsTable.redeemedAt),
        gt(schoolInvitationsTable.expiresAt, new Date()),
      ))
      .limit(1);
    if (!invitation) return null;

    const [marked] = await tx.update(schoolInvitationsTable)
      .set({ redeemedAt: new Date(), redeemedByClerkUserId: userId })
      .where(and(eq(schoolInvitationsTable.id, invitation.id), isNull(schoolInvitationsTable.redeemedAt)))
      .returning();
    if (!marked) return null;

    await tx.update(schoolMembersTable)
      .set({ isActive: false })
      .where(eq(schoolMembersTable.clerkUserId, userId));
    const [existing] = await tx.select().from(schoolMembersTable).where(and(
      eq(schoolMembersTable.schoolId, invitation.schoolId),
      eq(schoolMembersTable.clerkUserId, userId),
    )).limit(1);
    const [membership] = existing
      ? await tx.update(schoolMembersTable).set({
          role: invitation.role,
          isActive: true,
        }).where(eq(schoolMembersTable.id, existing.id)).returning()
      : await tx.insert(schoolMembersTable).values({
          schoolId: invitation.schoolId,
          clerkUserId: userId,
          role: invitation.role,
          isActive: true,
        }).returning();
    const [school] = await tx.select().from(schoolsTable)
      .where(eq(schoolsTable.id, invitation.schoolId)).limit(1);
    if (!membership || !school) throw new Error("Invitation membership could not be created.");
    return { membership, school };
  });
  if (!result) {
    res.status(400).json({ error: "Invitation is invalid, expired, or already redeemed." });
    return;
  }
  const payload = {
    school: schoolView(result.school),
    membership: membershipView(result.membership, result.school),
  };
  res.status(201).json(JoinSchoolResponse.parse(payload));
});

schoolRouter.get("/schools/members", async (_req, res): Promise<void> => {
  const school = activeSchool(res);
  if (school.role !== "admin") {
    res.status(403).json({ error: "Only school admins can view members." });
    return;
  }
  const rows = await db.select({
    id: schoolMembersTable.id,
    schoolId: schoolMembersTable.schoolId,
    clerkUserId: schoolMembersTable.clerkUserId,
    role: schoolMembersTable.role,
    isActive: schoolMembersTable.isActive,
    createdAt: schoolMembersTable.createdAt,
    school: schoolsTable,
  }).from(schoolMembersTable)
    .innerJoin(schoolsTable, eq(schoolsTable.id, schoolMembersTable.schoolId))
    .where(eq(schoolMembersTable.schoolId, school.id));
  res.json(ListSchoolMembersResponse.parse(rows.map(({ school: joinedSchool, ...member }) =>
    membershipView(member, joinedSchool),
  )));
});

schoolRouter.patch("/schools/members/:id", async (req, res): Promise<void> => {
  const context = activeSchool(res);
  const params = UpdateSchoolMemberRoleParams.safeParse(req.params);
  const parsed = UpdateSchoolMemberRoleBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid member role update." });
    return;
  }
  if (context.role !== "admin") {
    res.status(403).json({ error: "Only school admins can manage member roles." });
    return;
  }

  const member = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT id FROM schoolops_schools WHERE id = ${context.id} FOR UPDATE`);
    const [target] = await tx.select().from(schoolMembersTable).where(and(
      eq(schoolMembersTable.id, params.data.id),
      eq(schoolMembersTable.schoolId, context.id),
    )).limit(1);
    if (!target) return { missing: true as const };
    if (target.role === "admin" && parsed.data.role !== "admin") {
      const [adminCount] = await tx.select({ value: count() }).from(schoolMembersTable).where(and(
        eq(schoolMembersTable.schoolId, context.id),
        eq(schoolMembersTable.role, "admin"),
      ));
      if ((adminCount?.value ?? 0) <= 1) return { lastAdmin: true as const };
    }
    const [updated] = await tx.update(schoolMembersTable).set({ role: parsed.data.role })
      .where(eq(schoolMembersTable.id, target.id)).returning();
    return updated ? { member: updated } : { missing: true as const };
  });
  if ("missing" in member) {
    res.status(404).json({ error: "School member not found." });
    return;
  }
  if ("lastAdmin" in member) {
    res.status(400).json({ error: "A school must retain at least one admin." });
    return;
  }
  const payload = await membershipResult(member.member.clerkUserId, context.id);
  if (!payload) {
    res.status(500).json({ error: "Updated member could not be loaded." });
    return;
  }
  const response = membershipView(payload, payload.school);
  res.json(UpdateSchoolMemberRoleResponse.parse(response));
});

schoolRouter.post("/schools/invitations", async (req, res): Promise<void> => {
  const context = activeSchool(res);
  const parsed = CreateSchoolInvitationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid school invitation." });
    return;
  }
  if (context.role !== "admin") {
    res.status(403).json({ error: "Only school admins can invite members." });
    return;
  }
  const days = Math.min(Math.max(parsed.data.expiresInDays ?? 7, 1), 30);
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const [invitation] = await db.insert(schoolInvitationsTable).values({
    schoolId: context.id,
    invitedByClerkUserId: localUserId(res),
    tokenHash: createHash("sha256").update(token).digest("hex"),
    role: parsed.data.role,
    expiresAt,
  }).returning();
  if (!invitation) {
    res.status(500).json({ error: "Invitation could not be created." });
    return;
  }
  res.status(201).json(CreateSchoolInvitationResponse.parse({
    id: invitation.id,
    schoolId: invitation.schoolId,
    role: invitation.role,
    token,
    expiresAt: invitation.expiresAt,
  }));
});

schoolRouter.patch("/schools/current", async (req, res): Promise<void> => {
  const context = activeSchool(res);
  const parsed = UpdateCurrentSchoolBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid school update." });
    return;
  }
  if (context.role !== "admin") {
    res.status(403).json({ error: "Only school admins can update school settings." });
    return;
  }
  const update: { name?: string; settings?: Record<string, unknown>; updatedAt: Date } = {
    updatedAt: new Date(),
  };
  if (parsed.data.name !== undefined) update.name = parsed.data.name.trim();
  if (parsed.data.settings !== undefined) update.settings = parsed.data.settings;
  const [school] = await db.update(schoolsTable).set(update)
    .where(eq(schoolsTable.id, context.id)).returning();
  if (!school) {
    res.status(404).json({ error: "Active school not found." });
    return;
  }
  res.json(UpdateCurrentSchoolResponse.parse(schoolView(school)));
});

schoolRouter.get("/operations", async (_req, res): Promise<void> => {
  const context = activeSchool(res);
  const [school] = await db.select({
    operationsData: schoolsTable.operationsData,
  }).from(schoolsTable).where(eq(schoolsTable.id, context.id)).limit(1);
  if (!school) {
    res.status(404).json({ error: "Active school not found." });
    return;
  }
  const operations = school.operationsData as unknown as Record<string, unknown>;
  const source = operations.source as Record<string, unknown> | undefined;
  const payload = {
    ...operations,
    source: {
      ...source,
      generatedAt: new Date().toISOString(),
    },
  };
  res.json(GetSchoolOperationsResponse.parse(payload));
});

export { schoolRouter };