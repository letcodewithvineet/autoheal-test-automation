import { 
  users, 
  failures, 
  suggestions, 
  approvals, 
  selectors, 
  runs,
  type User, 
  type InsertUser,
  type Failure,
  type InsertFailure,
  type Suggestion,
  type InsertSuggestion,
  type Approval,
  type InsertApproval,
  type Selector,
  type InsertSelector,
  type Run,
  type InsertRun
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Failures
  getFailures(filters?: { repo?: string; status?: string; since?: Date }): Promise<Failure[]>;
  getFailure(id: string): Promise<Failure | undefined>;
  createFailure(failure: InsertFailure): Promise<Failure>;
  updateFailureStatus(id: string, status: string): Promise<void>;
  
  // Suggestions
  getSuggestionsByFailureId(failureId: string): Promise<Suggestion[]>;
  createSuggestion(suggestion: InsertSuggestion): Promise<Suggestion>;
  getSuggestion(id: string): Promise<Suggestion | undefined>;
  
  // Approvals
  createApproval(approval: InsertApproval): Promise<Approval>;
  getApprovalsBySuggestionId(suggestionId: string): Promise<Approval[]>;
  
  // Selectors
  getSelector(page: string, name: string): Promise<Selector | undefined>;
  createSelector(selector: InsertSelector): Promise<Selector>;
  updateSelector(page: string, name: string, current: string, historyEntry: any): Promise<void>;
  
  // Runs
  createRun(run: InsertRun): Promise<Run>;
  updateRunStatus(id: string, status: string, completedAt?: Date): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getFailures(filters?: { repo?: string; status?: string; since?: Date }): Promise<Failure[]> {
    const conditions = [];
    
    if (filters?.repo) conditions.push(eq(failures.repo, filters.repo));
    if (filters?.status) conditions.push(eq(failures.status, filters.status));
    if (filters?.since) conditions.push(sql`${failures.timestamp} >= ${filters.since}`);
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    return await db.select().from(failures)
      .where(whereClause)
      .orderBy(desc(failures.timestamp));
  }

  async getFailure(id: string): Promise<Failure | undefined> {
    const [failure] = await db.select().from(failures).where(eq(failures.id, id));
    return failure || undefined;
  }

  async createFailure(failure: InsertFailure): Promise<Failure> {
    const [result] = await db.insert(failures).values(failure).returning();
    return result;
  }

  async updateFailureStatus(id: string, status: string): Promise<void> {
    await db.update(failures).set({ status }).where(eq(failures.id, id));
  }

  async getSuggestionsByFailureId(failureId: string): Promise<Suggestion[]> {
    return db.select().from(suggestions).where(eq(suggestions.failureId, failureId))
      .orderBy(desc(suggestions.createdAt));
  }

  async createSuggestion(suggestion: InsertSuggestion): Promise<Suggestion> {
    const [result] = await db.insert(suggestions).values(suggestion).returning();
    return result;
  }

  async getSuggestion(id: string): Promise<Suggestion | undefined> {
    const [suggestion] = await db.select().from(suggestions).where(eq(suggestions.id, id));
    return suggestion || undefined;
  }

  async createApproval(approval: InsertApproval): Promise<Approval> {
    const [result] = await db.insert(approvals).values(approval).returning();
    return result;
  }

  async getApprovalsBySuggestionId(suggestionId: string): Promise<Approval[]> {
    return db.select().from(approvals).where(eq(approvals.suggestionId, suggestionId))
      .orderBy(desc(approvals.createdAt));
  }

  async getSelector(page: string, name: string): Promise<Selector | undefined> {
    const [selector] = await db.select().from(selectors)
      .where(and(eq(selectors.page, page), eq(selectors.name, name)));
    return selector || undefined;
  }

  async createSelector(selector: InsertSelector): Promise<Selector> {
    const [result] = await db.insert(selectors).values(selector).returning();
    return result;
  }

  async updateSelector(page: string, name: string, current: string, historyEntry: any): Promise<void> {
    const existing = await this.getSelector(page, name);
    if (existing) {
      const newHistory = [...(existing.history as any[]), historyEntry];
      await db.update(selectors)
        .set({ current, history: newHistory })
        .where(and(eq(selectors.page, page), eq(selectors.name, name)));
    }
  }

  async createRun(run: InsertRun): Promise<Run> {
    const [result] = await db.insert(runs).values(run).returning();
    return result;
  }

  async updateRunStatus(id: string, status: string, completedAt?: Date): Promise<void> {
    const updateData: any = { status };
    if (completedAt) updateData.completedAt = completedAt;
    
    await db.update(runs).set(updateData).where(eq(runs.id, id));
  }
}

export const storage = new DatabaseStorage();
