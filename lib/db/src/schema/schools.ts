import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export type SchoolRole = "admin" | "principal" | "staff";

export const schoolsTable = pgTable("schoolops_schools", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  settings: jsonb("settings").$type<Record<string, unknown>>().notNull().default({}),
  operationsData: jsonb("operations_data").$type<Record<string, unknown>>().notNull().default({}),
  syntheticOnly: boolean("synthetic_only").notNull().default(true),
  isDemo: boolean("is_demo").notNull().default(false),
  isClaimed: boolean("is_claimed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const schoolMembersTable = pgTable("schoolops_school_members", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schoolsTable.id, { onDelete: "cascade" }),
  clerkUserId: text("clerk_user_id").notNull(),
  role: text("role").$type<SchoolRole>().notNull(),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("schoolops_school_member_unique").on(table.schoolId, table.clerkUserId),
  index("schoolops_school_member_user_idx").on(table.clerkUserId),
  uniqueIndex("schoolops_school_member_active_user_unique")
    .on(table.clerkUserId)
    .where(sql`${table.isActive} = true`),
]);

export const schoolInvitationsTable = pgTable("schoolops_school_invitations", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schoolsTable.id, { onDelete: "cascade" }),
  invitedByClerkUserId: text("invited_by_clerk_user_id").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  role: text("role").$type<SchoolRole>().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
  redeemedByClerkUserId: text("redeemed_by_clerk_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("schoolops_school_invitation_school_idx").on(table.schoolId),
]);

export const insertSchoolSchema = createInsertSchema(schoolsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertSchoolMemberSchema = createInsertSchema(schoolMembersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertSchoolInvitationSchema = createInsertSchema(schoolInvitationsTable).omit({
  id: true,
  createdAt: true,
});

export type School = typeof schoolsTable.$inferSelect;
export type SchoolMember = typeof schoolMembersTable.$inferSelect;
export type SchoolInvitation = typeof schoolInvitationsTable.$inferSelect;
export type InsertSchool = z.infer<typeof insertSchoolSchema>;
export type InsertSchoolMember = z.infer<typeof insertSchoolMemberSchema>;
export type InsertSchoolInvitation = z.infer<typeof insertSchoolInvitationSchema>;