import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const failures = pgTable("failures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  runId: varchar("runId").notNull(),
  repo: text("repo").notNull(),
  branch: text("branch").notNull(),
  commit: text("commit").notNull(),
  suite: text("suite").notNull(),
  test: text("test").notNull(),
  specPath: text("specPath").notNull(),
  browser: text("browser").notNull(),
  viewport: text("viewport").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  screenshotPath: text("screenshotPath"),
  screenshotGridfsId: text("screenshotGridfsId"),
  domHtml: text("domHtml").notNull(),
  consoleLogs: jsonb("consoleLogs").default([]),
  networkLogs: jsonb("networkLogs").default([]),
  currentSelector: text("currentSelector").notNull(),
  selectorContext: jsonb("selectorContext").notNull(),
  errorMessage: text("errorMessage"),
  status: text("status").default("new").notNull(), // new, suggested, approved, rejected
});

export const suggestions = pgTable("suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  failureId: varchar("failureId").notNull(),
  candidates: jsonb("candidates").notNull(), // Array of {selector, type, rationale, confidence, source}
  topChoice: text("topChoice"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const approvals = pgTable("approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  suggestionId: varchar("suggestionId").notNull(),
  approvedBy: text("approvedBy").notNull(),
  decision: text("decision").notNull(), // approve, reject
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const selectors = pgTable("selectors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  page: text("page").notNull(),
  name: text("name").notNull(),
  current: text("current").notNull(),
  history: jsonb("history").default([]), // Array of {selector, commit, approvedAt}
});

export const runs = pgTable("runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repo: text("repo").notNull(),
  branch: text("branch").notNull(),
  commit: text("commit").notNull(),
  ciRunId: text("ciRunId"),
  status: text("status").notNull(), // running, completed, failed
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertFailureSchema = createInsertSchema(failures).omit({
  id: true,
  timestamp: true,
  status: true,
});

export const insertSuggestionSchema = createInsertSchema(suggestions).omit({
  id: true,
  createdAt: true,
});

export const insertApprovalSchema = createInsertSchema(approvals).omit({
  id: true,
  createdAt: true,
});

export const insertSelectorSchema = createInsertSchema(selectors).omit({
  id: true,
});

export const insertRunSchema = createInsertSchema(runs).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFailure = z.infer<typeof insertFailureSchema>;
export type Failure = typeof failures.$inferSelect;

export type InsertSuggestion = z.infer<typeof insertSuggestionSchema>;
export type Suggestion = typeof suggestions.$inferSelect;

export type InsertApproval = z.infer<typeof insertApprovalSchema>;
export type Approval = typeof approvals.$inferSelect;

export type InsertSelector = z.infer<typeof insertSelectorSchema>;
export type Selector = typeof selectors.$inferSelect;

export type InsertRun = z.infer<typeof insertRunSchema>;
export type Run = typeof runs.$inferSelect;
