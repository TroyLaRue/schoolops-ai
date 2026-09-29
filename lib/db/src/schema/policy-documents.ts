import { boolean, date, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const policyDocumentsTable = pgTable("schoolops_policy_documents", {
  id: serial("id").primaryKey(),
  sourceId: text("source_id").notNull().unique(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  filename: text("filename"),
  mimeType: text("mime_type").notNull(),
  content: text("content").notNull(),
  version: text("version").notNull(),
  effectiveDate: date("effective_date", { mode: "string" }),
  status: text("status").notNull().default("active"),
  sourceKind: text("source_kind").notNull().default("demo"),
  syntheticOnly: boolean("synthetic_only").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPolicyDocumentSchema = createInsertSchema(policyDocumentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type PolicyDocument = typeof policyDocumentsTable.$inferSelect;
export type InsertPolicyDocument = z.infer<typeof insertPolicyDocumentSchema>;