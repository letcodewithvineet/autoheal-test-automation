import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

// MongoDB Document interfaces
export interface IUser extends Document {
  _id: string;
  username: string;
  password: string;
}

export interface IFailure extends Document {
  _id: string;
  runId: string;
  repo: string;
  branch: string;
  commit: string;
  suite: string;
  test: string;
  specPath: string;
  browser: string;
  viewport: string;
  timestamp: Date;
  screenshotPath?: string;
  screenshotGridfsId?: string;
  domHtml: string;
  consoleLogs: any[];
  networkLogs: any[];
  currentSelector: string;
  selectorContext: any;
  errorMessage?: string;
  status: string;
}

export interface ISuggestion extends Document {
  _id: string;
  failureId: string;
  candidates: any[];
  topChoice?: string;
  createdAt: Date;
}

export interface IApproval extends Document {
  _id: string;
  suggestionId: string;
  approvedBy: string;
  decision: string;
  notes?: string;
  createdAt: Date;
}

export interface ISelector extends Document {
  _id: string;
  page: string;
  name: string;
  current: string;
  history: any[];
}

export interface IRun extends Document {
  _id: string;
  repo: string;
  branch: string;
  commit: string;
  ciRunId?: string;
  status: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface IPullRequest extends Document {
  _id: string;
  failureId: string;
  suggestionId: string;
  approvalId: string;
  prNumber: number;
  prUrl: string;
  title: string;
  description: string;
  status: string; // open, merged, closed
  repo: string;
  branch: string;
  createdAt: Date;
  mergedAt?: Date;
}

// MongoDB Schemas
const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const FailureSchema = new Schema<IFailure>({
  runId: { type: String, required: true },
  repo: { type: String, required: true },
  branch: { type: String, required: true },
  commit: { type: String, required: true },
  suite: { type: String, required: true },
  test: { type: String, required: true },
  specPath: { type: String, required: true },
  browser: { type: String, required: true },
  viewport: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  screenshotPath: { type: String },
  screenshotGridfsId: { type: String },
  domHtml: { type: String, required: true },
  consoleLogs: { type: Array, default: [] },
  networkLogs: { type: Array, default: [] },
  currentSelector: { type: String, required: true },
  selectorContext: { type: Schema.Types.Mixed, required: true },
  errorMessage: { type: String },
  status: { type: String, default: 'new' }
});

const SuggestionSchema = new Schema<ISuggestion>({
  failureId: { type: String, required: true },
  candidates: { type: Array, required: true },
  topChoice: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const ApprovalSchema = new Schema<IApproval>({
  suggestionId: { type: String, required: true },
  approvedBy: { type: String, required: true },
  decision: { type: String, required: true },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const SelectorSchema = new Schema<ISelector>({
  page: { type: String, required: true },
  name: { type: String, required: true },
  current: { type: String, required: true },
  history: { type: Array, default: [] }
});

const RunSchema = new Schema<IRun>({
  repo: { type: String, required: true },
  branch: { type: String, required: true },
  commit: { type: String, required: true },
  ciRunId: { type: String },
  status: { type: String, required: true },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

const PullRequestSchema = new Schema<IPullRequest>({
  failureId: { type: String, required: true },
  suggestionId: { type: String, required: true },
  approvalId: { type: String, required: true },
  prNumber: { type: Number, required: true },
  prUrl: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, default: 'open' },
  repo: { type: String, required: true },
  branch: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  mergedAt: { type: Date }
});

// Models
export const UserModel = mongoose.model<IUser>('User', UserSchema);
export const FailureModel = mongoose.model<IFailure>('Failure', FailureSchema);
export const SuggestionModel = mongoose.model<ISuggestion>('Suggestion', SuggestionSchema);
export const ApprovalModel = mongoose.model<IApproval>('Approval', ApprovalSchema);
export const SelectorModel = mongoose.model<ISelector>('Selector', SelectorSchema);
export const RunModel = mongoose.model<IRun>('Run', RunSchema);
export const PullRequestModel = mongoose.model<IPullRequest>('PullRequest', PullRequestSchema);

// Zod schemas for validation
export const insertUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6)
});

export const insertFailureSchema = z.object({
  runId: z.string(),
  repo: z.string(),
  branch: z.string(),
  commit: z.string(),
  suite: z.string(),
  test: z.string(),
  specPath: z.string(),
  browser: z.string(),
  viewport: z.string(),
  screenshotPath: z.string().optional(),
  screenshotGridfsId: z.string().optional(),
  domHtml: z.string(),
  consoleLogs: z.array(z.any()).default([]),
  networkLogs: z.array(z.any()).default([]),
  currentSelector: z.string(),
  selectorContext: z.any(),
  errorMessage: z.string().optional()
});

export const insertSuggestionSchema = z.object({
  failureId: z.string(),
  candidates: z.array(z.any()),
  topChoice: z.string().optional()
});

export const insertApprovalSchema = z.object({
  suggestionId: z.string(),
  approvedBy: z.string(),
  decision: z.enum(["approve", "reject"]),
  notes: z.string().optional()
});

export const insertSelectorSchema = z.object({
  page: z.string(),
  name: z.string(),
  current: z.string(),
  history: z.array(z.any()).default([])
});

export const insertRunSchema = z.object({
  repo: z.string(),
  branch: z.string(),
  commit: z.string(),
  ciRunId: z.string().optional(),
  status: z.string()
});

export const insertPullRequestSchema = z.object({
  failureId: z.string(),
  suggestionId: z.string(),
  approvalId: z.string(),
  prNumber: z.number(),
  prUrl: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.string().default('open'),
  repo: z.string(),
  branch: z.string()
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = {
  id: string;
  username: string;
  password: string;
};

export type InsertFailure = z.infer<typeof insertFailureSchema>;
export type Failure = {
  id: string;
  runId: string;
  repo: string;
  branch: string;
  commit: string;
  suite: string;
  test: string;
  specPath: string;
  browser: string;
  viewport: string;
  timestamp: Date;
  screenshotPath?: string | null;
  screenshotGridfsId?: string | null;
  domHtml: string;
  consoleLogs: any[];
  networkLogs: any[];
  currentSelector: string;
  selectorContext: any;
  errorMessage?: string | null;
  status: string;
};

export type InsertSuggestion = z.infer<typeof insertSuggestionSchema>;
export type Suggestion = {
  id: string;
  failureId: string;
  candidates: any[];
  topChoice?: string | null;
  createdAt: Date;
};

export type InsertApproval = z.infer<typeof insertApprovalSchema>;
export type Approval = {
  id: string;
  suggestionId: string;
  approvedBy: string;
  decision: string;
  notes?: string | null;
  createdAt: Date;
};

export type InsertSelector = z.infer<typeof insertSelectorSchema>;
export type Selector = {
  id: string;
  page: string;
  name: string;
  current: string;
  history: any[];
};

export type InsertRun = z.infer<typeof insertRunSchema>;
export type Run = {
  id: string;
  repo: string;
  branch: string;
  commit: string;
  ciRunId?: string | null;
  status: string;
  startedAt: Date;
  completedAt?: Date | null;
};

export type InsertPullRequest = z.infer<typeof insertPullRequestSchema>;
export type PullRequest = {
  id: string;
  failureId: string;
  suggestionId: string;
  approvalId: string;
  prNumber: number;
  prUrl: string;
  title: string;
  description: string;
  status: string;
  repo: string;
  branch: string;
  createdAt: Date;
  mergedAt?: Date | null;
};