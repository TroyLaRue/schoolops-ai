import { createInsertSchema } from "drizzle-zod";
import { integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const agentRunsTable = pgTable("schoolops_agent_runs", {
  id: serial("id").primaryKey(),
  status: text("status").notNull().default("running"),
  activityLog: jsonb("activity_log").$type<string[]>().notNull().default([]),
  summary: text("summary"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const agentIssuesTable = pgTable("schoolops_agent_issues", {
  id: serial("id").primaryKey(),
  runId: integer("run_id").notNull().references(() => agentRunsTable.id, { onDelete: "cascade" }),
  sourceId: text("source_id").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  severity: text("severity").notNull(),
  evidence: text("evidence").notNull(),
  impact: text("impact").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const agentActionsTable = pgTable("schoolops_agent_actions", {
  id: serial("id").primaryKey(),
  runId: integer("run_id").references(() => agentRunsTable.id, { onDelete: "cascade" }),
  issueId: integer("issue_id").references(() => agentIssuesTable.id, { onDelete: "set null" }),
  sourceId: text("source_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content"),
  recipient: text("recipient"),
  subject: text("subject"),
  channel: text("channel"),
  reason: text("reason"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const insertAgentRunSchema = createInsertSchema(agentRunsTable).omit({
  id: true,
  createdAt: true,
});
export const insertAgentIssueSchema = createInsertSchema(agentIssuesTable).omit({
  id: true,
  createdAt: true,
});
export const insertAgentActionSchema = createInsertSchema(agentActionsTable).omit({
  id: true,
  createdAt: true,
});

export type AgentRun = typeof agentRunsTable.$inferSelect;
export type AgentIssue = typeof agentIssuesTable.$inferSelect;
export type AgentAction = typeof agentActionsTable.$inferSelect;
export type InsertAgentRun = z.infer<typeof insertAgentRunSchema>;
export type InsertAgentIssue = z.infer<typeof insertAgentIssueSchema>;
export type InsertAgentAction = z.infer<typeof insertAgentActionSchema>;