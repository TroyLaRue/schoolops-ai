import { getAuth } from "@clerk/express";
import { and, eq } from "drizzle-orm";
import type { RequestHandler } from "express";
import { db, schoolMembersTable, schoolsTable, type SchoolRole } from "@workspace/db";

export interface ActiveSchoolContext {
  id: number;
  slug: string;
  name: string;
  role: SchoolRole;
}

export const requireSignedIn: RequestHandler = (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in is required." });
    return;
  }
  res.locals.clerkUserId = userId;
  next();
};

export const requireSchool: RequestHandler = async (_req, res, next) => {
  const clerkUserId = res.locals.clerkUserId as string | undefined;
  if (!clerkUserId) {
    res.status(401).json({ error: "Sign in is required." });
    return;
  }
  const [row] = await db.select({
    id: schoolsTable.id,
    slug: schoolsTable.slug,
    name: schoolsTable.name,
    role: schoolMembersTable.role,
  }).from(schoolMembersTable)
    .innerJoin(schoolsTable, eq(schoolsTable.id, schoolMembersTable.schoolId))
    .where(and(
      eq(schoolMembersTable.clerkUserId, clerkUserId),
      eq(schoolMembersTable.isActive, true),
    ))
    .limit(1);

  if (!row) {
    res.status(403).json({ error: "An active school membership is required." });
    return;
  }
  res.locals.school = row satisfies ActiveSchoolContext;
  next();
};