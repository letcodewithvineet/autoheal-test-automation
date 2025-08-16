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

// Memory storage implementation as fallback
export class MemoryStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private failures: Map<string, Failure> = new Map();
  private suggestions: Map<string, Suggestion> = new Map();
  private approvals: Map<string, Approval> = new Map();
  private selectors: Map<string, Selector> = new Map();
  private runs: Map<string, Run> = new Map();
  private idCounter = 1000;

  private generateId(): string {
    return (++this.idCounter).toString();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const [, user] of this.users.entries()) {
      if (user.username === username) return user;
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = { id: this.generateId(), ...insertUser };
    this.users.set(user.id, user);
    return user;
  }

  async getFailures(filters?: { repo?: string; status?: string; since?: Date }): Promise<Failure[]> {
    let results = Array.from(this.failures.values());
    
    if (filters?.repo) {
      results = results.filter(f => f.repo === filters.repo);
    }
    if (filters?.status) {
      results = results.filter(f => f.status === filters.status);
    }
    if (filters?.since) {
      results = results.filter(f => f.timestamp >= filters.since!);
    }
    
    return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getFailure(id: string): Promise<Failure | undefined> {
    return this.failures.get(id);
  }

  async createFailure(failure: InsertFailure): Promise<Failure> {
    const newFailure: Failure = {
      id: this.generateId(),
      timestamp: new Date(),
      status: "new",
      screenshotPath: failure.screenshotPath || null,
      screenshotGridfsId: failure.screenshotGridfsId || null,
      errorMessage: failure.errorMessage || null,
      ...failure
    };
    this.failures.set(newFailure.id, newFailure);
    return newFailure;
  }

  async updateFailureStatus(id: string, status: string): Promise<void> {
    const failure = this.failures.get(id);
    if (failure) {
      this.failures.set(id, { ...failure, status });
    }
  }

  async getSuggestionsByFailureId(failureId: string): Promise<Suggestion[]> {
    return Array.from(this.suggestions.values())
      .filter(s => s.failureId === failureId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createSuggestion(suggestion: InsertSuggestion): Promise<Suggestion> {
    const newSuggestion: Suggestion = {
      id: this.generateId(),
      createdAt: new Date(),
      topChoice: suggestion.topChoice || null,
      ...suggestion
    };
    this.suggestions.set(newSuggestion.id, newSuggestion);
    return newSuggestion;
  }

  async getSuggestion(id: string): Promise<Suggestion | undefined> {
    return this.suggestions.get(id);
  }

  async createApproval(approval: InsertApproval): Promise<Approval> {
    const newApproval: Approval = {
      id: this.generateId(),
      createdAt: new Date(),
      notes: approval.notes || null,
      ...approval
    };
    this.approvals.set(newApproval.id, newApproval);
    return newApproval;
  }

  async getApprovalsBySuggestionId(suggestionId: string): Promise<Approval[]> {
    return Array.from(this.approvals.values())
      .filter(a => a.suggestionId === suggestionId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getSelector(page: string, name: string): Promise<Selector | undefined> {
    for (const [, selector] of this.selectors.entries()) {
      if (selector.page === page && selector.name === name) return selector;
    }
    return undefined;
  }

  async createSelector(selector: InsertSelector): Promise<Selector> {
    const newSelector: Selector = {
      id: this.generateId(),
      history: [],
      ...selector
    };
    this.selectors.set(newSelector.id, newSelector);
    return newSelector;
  }

  async updateSelector(page: string, name: string, current: string, historyEntry: any): Promise<void> {
    const existing = await this.getSelector(page, name);
    if (existing) {
      const newHistory = [...(existing.history as any[]), historyEntry];
      this.selectors.set(existing.id, { ...existing, current, history: newHistory });
    }
  }

  async createRun(run: InsertRun): Promise<Run> {
    const newRun: Run = {
      id: this.generateId(),
      startedAt: new Date(),
      completedAt: null,
      ciRunId: run.ciRunId || null,
      ...run
    };
    this.runs.set(newRun.id, newRun);
    return newRun;
  }

  async updateRunStatus(id: string, status: string, completedAt?: Date): Promise<void> {
    const run = this.runs.get(id);
    if (run) {
      this.runs.set(id, { ...run, status, completedAt: completedAt || null });
    }
  }
}

// Initialize with sample data
const memoryStorage = new MemoryStorage();

// Create sample failures for demo
const initializeSampleData = async () => {
  // Sample failure 1 - Login test
  const failure1 = await memoryStorage.createFailure({
    runId: "run-001",
    repo: "acme-corp/web-app",
    branch: "main",
    commit: "abc123",
    suite: "Authentication Tests",
    test: "should login with valid credentials",
    specPath: "cypress/e2e/auth.cy.ts",
    browser: "chrome",
    viewport: "1280x720",
    screenshotPath: "/screenshots/login-failure.png",
    screenshotGridfsId: null,
    domHtml: "<div><form class='login-form'><input name='username' type='text'/><input name='password' type='password'/><button class='submit-btn' type='submit'>Login</button></form></div>",
    consoleLogs: [{ level: "error", message: "Element not found: .login-button" }],
    networkLogs: [{ url: "/api/login", status: 200, method: "POST" }],
    currentSelector: ".login-button",
    selectorContext: {
      element: "button",
      text: "Login",
      attributes: { "class": "submit-btn", "type": "submit" },
      parent: "form.login-form"
    },
    errorMessage: "AssertionError: Timed out retrying after 4000ms: Expected to find element: .login-button, but never found it."
  });

  // Sample failure 2 - Product page
  const failure2 = await memoryStorage.createFailure({
    runId: "run-002", 
    repo: "ecommerce/shop-frontend",
    branch: "feature/new-ui",
    commit: "def456",
    suite: "Product Tests",
    test: "should add product to cart",
    specPath: "cypress/e2e/products.cy.ts",
    browser: "firefox",
    viewport: "1920x1080",
    screenshotPath: "/screenshots/product-failure.png", 
    screenshotGridfsId: null,
    domHtml: "<div class='product-card'><h3>Premium Widget</h3><p class='price'>$29.99</p><button data-testid='add-to-cart-btn' class='btn-primary'>Add to Cart</button></div>",
    consoleLogs: [],
    networkLogs: [{ url: "/api/products/123", status: 200, method: "GET" }],
    currentSelector: ".add-to-cart",
    selectorContext: {
      element: "button",
      text: "Add to Cart", 
      attributes: { "data-testid": "add-to-cart-btn", "class": "btn-primary" },
      parent: ".product-card"
    },
    errorMessage: "AssertionError: Timed out retrying after 4000ms: Expected to find element: .add-to-cart, but never found it."
  });

  // Sample failure 3 - Dashboard chart
  const failure3 = await memoryStorage.createFailure({
    runId: "run-003",
    repo: "analytics/dashboard", 
    branch: "main",
    commit: "ghi789",
    suite: "Dashboard Tests",
    test: "should display revenue chart",
    specPath: "cypress/e2e/dashboard.cy.ts", 
    browser: "chrome",
    viewport: "1440x900",
    screenshotPath: "/screenshots/dashboard-failure.png",
    screenshotGridfsId: null,
    domHtml: "<div class='dashboard'><div class='chart-container'><canvas role='img' aria-label='Revenue Chart' data-chart='revenue'></canvas></div></div>",
    consoleLogs: [{ level: "warn", message: "Chart data loading delayed" }],
    networkLogs: [{ url: "/api/analytics/revenue", status: 200, method: "GET" }],
    currentSelector: ".revenue-chart",
    selectorContext: {
      element: "canvas",
      text: "",
      attributes: { "role": "img", "aria-label": "Revenue Chart", "data-chart": "revenue" },
      parent: ".chart-container"
    },
    errorMessage: "AssertionError: Timed out retrying after 4000ms: Expected to find element: .revenue-chart, but never found it."
  });

  // Create suggestions for failures
  await memoryStorage.createSuggestion({
    failureId: failure1.id,
    candidates: [
      {
        selector: "[data-testid='submit-btn']",
        type: "data-testid",
        rationale: "Uses data-testid which is the most reliable test selector",
        confidence: 0.95,
        source: "heuristic"
      },
      {
        selector: "button[type='submit']",
        type: "attribute",
        rationale: "Targets the submit button by its type attribute",
        confidence: 0.85,
        source: "ai"
      }
    ],
    topChoice: "[data-testid='submit-btn']"
  });

  await memoryStorage.createSuggestion({
    failureId: failure2.id,
    candidates: [
      {
        selector: "[data-testid='add-to-cart-btn']",
        type: "data-testid", 
        rationale: "Element already has data-testid attribute which is ideal for testing",
        confidence: 0.98,
        source: "heuristic"
      },
      {
        selector: ".btn-primary:contains('Add to Cart')",
        type: "class+text",
        rationale: "Combines class with text content for specificity",
        confidence: 0.80,
        source: "ai"
      }
    ],
    topChoice: "[data-testid='add-to-cart-btn']"
  });

  await memoryStorage.createSuggestion({
    failureId: failure3.id,
    candidates: [
      {
        selector: "[role='img'][aria-label='Revenue Chart']",
        type: "aria",
        rationale: "Uses semantic ARIA attributes for accessibility and reliability",
        confidence: 0.92,
        source: "heuristic"
      },
      {
        selector: "[data-chart='revenue']",
        type: "data-attribute",
        rationale: "Uses specific data attribute for chart identification",
        confidence: 0.88,
        source: "ai"
      }
    ],
    topChoice: "[role='img'][aria-label='Revenue Chart']"
  });

  // Update some statuses
  await memoryStorage.updateFailureStatus(failure2.id, "suggested");
  await memoryStorage.updateFailureStatus(failure3.id, "approved");
};

// Initialize storage - prefer database if available, fallback to memory
async function initializeStorage(): Promise<IStorage> {
  if (process.env.DATABASE_URL) {
    try {
      const dbStorage = new DatabaseStorage();
      // Test the connection by trying to fetch failures
      await dbStorage.getFailures();
      console.log("Connected to PostgreSQL database");
      return dbStorage;
    } catch (error) {
      console.warn("Database connection failed, using in-memory storage:", error);
    }
  }
  
  console.log("Using in-memory storage with sample data");
  await initializeSampleData();
  return memoryStorage;
}

// Initialize storage - start with memory storage and replace with DB if available
let storage: IStorage = memoryStorage;

// Initialize sample data for memory storage
initializeSampleData().then(() => {
  console.log('Sample data initialized for memory storage');
});

// Try to initialize database storage
if (process.env.DATABASE_URL) {
  initializeStorage().then(initializedStorage => {
    storage = initializedStorage;
    console.log('Storage initialized successfully');
  }).catch(error => {
    console.warn('Database initialization failed, using memory storage:', error);
  });
}

export { storage };
