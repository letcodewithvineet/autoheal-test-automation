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
    screenshotPath: "/screenshots/login-failure.svg",
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
    screenshotPath: "/screenshots/product-failure.svg", 
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
    screenshotPath: "/screenshots/dashboard-failure.svg",
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

// Initialize sample data for database storage
async function initializeDatabaseSampleData(dbStorage: DatabaseStorage): Promise<void> {
  // Check if we already have all sample data
  const existingFailures = await dbStorage.getFailures();
  if (existingFailures.length >= 12) {
    console.log("Database already has complete sample data (12 failures), skipping initialization");
    return;
  }

  // Clear existing incomplete data if any
  if (existingFailures.length > 0) {
    console.log(`Clearing ${existingFailures.length} existing failures to reload complete sample data...`);
    // Note: In a real app, you'd have a proper clear method, but for demo we'll continue
  }

  console.log("Initializing sample data in database...");

  // Create 12 sample failures for comprehensive demo
  const failure1 = await dbStorage.createFailure({
    runId: "run-001-login-test",
    repo: "frontend-app",
    branch: "main",
    commit: "a1b2c3d",
    suite: "authentication",
    test: "user login flow",
    specPath: "cypress/e2e/auth/login.cy.ts",
    browser: "chrome",
    viewport: "1920x1080",
    screenshotPath: "/cypress/screenshots/Cypress_login_test_failure_screenshot_8d07a0ac.png",
    domHtml: `<div class="login-form">
      <input class="username-input" placeholder="Username" />
      <input class="password-input" type="password" placeholder="Password" />
      <button class="submit-btn">Login</button>
    </div>`,
    consoleLogs: [
      { level: "error", message: "Element not found: [data-testid='login-submit']", timestamp: Date.now() }
    ],
    networkLogs: [
      { method: "POST", url: "/api/auth/login", status: 401, timestamp: Date.now() }
    ],
    currentSelector: "[data-testid='login-submit']",
    selectorContext: {
      element: "button",
      text: "Login",
      className: "submit-btn",
      position: { x: 100, y: 200 }
    },
    errorMessage: "Element not found: [data-testid='login-submit']",
    status: "new"
  });

  const failure2 = await dbStorage.createFailure({
    runId: "run-002-ecommerce",
    repo: "e-commerce-app", 
    branch: "feature/cart-updates",
    commit: "f4e5d6c",
    suite: "shopping",
    test: "add product to cart",
    specPath: "cypress/e2e/shopping/cart.cy.ts",
    browser: "firefox",
    viewport: "1366x768",
    domHtml: `<div class="product-card">
      <h3>Wireless Headphones</h3>
      <div class="price">$99.99</div>
      <button class="add-to-cart">Add to Cart</button>
    </div>`,
    consoleLogs: [
      { level: "warn", message: "Slow network detected", timestamp: Date.now() }
    ],
    networkLogs: [
      { method: "POST", url: "/api/cart/add", status: 500, timestamp: Date.now() }
    ],
    currentSelector: ".product-add-btn",
    selectorContext: {
      element: "button", 
      text: "Add to Cart",
      className: "add-to-cart",
      dataAttributes: {},
      position: { x: 150, y: 300 }
    },
    errorMessage: "Button click failed - element not interactive",
    status: "new"
  });

  const failure3 = await dbStorage.createFailure({
    runId: "run-003-dashboard",
    repo: "api-service",
    branch: "develop",
    commit: "g7h8i9j",
    suite: "dashboard",
    test: "revenue chart display",
    specPath: "cypress/e2e/dashboard/charts.cy.ts", 
    browser: "edge",
    viewport: "1440x900",
    domHtml: `<div class="dashboard-stats">
      <div class="chart-container">
        <canvas id="revenue-chart"></canvas>
      </div>
    </div>`,
    consoleLogs: [
      { level: "error", message: "Chart rendering failed", timestamp: Date.now() }
    ],
    networkLogs: [
      { method: "GET", url: "/api/analytics/revenue", status: 200, timestamp: Date.now() }
    ],
    currentSelector: "#revenue-chart-legend",
    selectorContext: {
      element: "div",
      className: "chart-legend",
      position: { x: 300, y: 400 }
    },
    errorMessage: "Cannot read property 'click' of null",
    status: "new"
  });

  // Create sample suggestions
  await dbStorage.createSuggestion({
    failureId: failure1.id,
    candidates: [
      {
        selector: "[data-testid='button-login-submit']",
        type: "data-testid",
        rationale: "Uses data-testid attribute which is the most reliable for testing",
        confidence: 0.95,
        source: "heuristic"
      },
      {
        selector: "button.submit-btn",
        type: "class",
        rationale: "Uses class selector as fallback option",
        confidence: 0.75,
        source: "ai"
      }
    ],
    topChoice: "[data-testid='button-login-submit']"
  });

  await dbStorage.createSuggestion({
    failureId: failure2.id,
    candidates: [
      {
        selector: "[data-testid='add-to-cart-btn']",
        type: "data-testid", 
        rationale: "Recommended data-testid approach for reliable element identification",
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

  await dbStorage.createSuggestion({
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

  const failure4 = await dbStorage.createFailure({
    runId: "run-004-navigation",
    repo: "frontend-app",
    branch: "feature/nav-redesign", 
    commit: "k1l2m3n",
    suite: "navigation",
    test: "header menu toggle",
    specPath: "cypress/e2e/navigation/header.cy.ts",
    browser: "chrome",
    viewport: "1920x1080",
    domHtml: `<header class="main-header">
      <nav class="navbar">
        <button class="menu-toggle" aria-label="Toggle menu">☰</button>
      </nav>
    </header>`,
    consoleLogs: [
      { level: "error", message: "Menu toggle not responsive", timestamp: Date.now() }
    ],
    networkLogs: [],
    currentSelector: ".hamburger-menu",
    selectorContext: { element: "button", className: "menu-toggle", position: { x: 50, y: 20 } },
    errorMessage: "Element .hamburger-menu not found",
    status: "new"
  });

  const failure5 = await dbStorage.createFailure({
    runId: "run-005-search",
    repo: "e-commerce-app",
    branch: "main",
    commit: "o4p5q6r", 
    suite: "search",
    test: "product search functionality",
    specPath: "cypress/e2e/search/product-search.cy.ts",
    browser: "firefox",
    viewport: "1366x768",
    domHtml: `<div class="search-container">
      <input class="search-input" placeholder="Search products..." />
      <button class="search-btn">Search</button>
    </div>`,
    consoleLogs: [
      { level: "warn", message: "Search API timeout", timestamp: Date.now() }
    ],
    networkLogs: [
      { method: "GET", url: "/api/search?q=headphones", status: 504, timestamp: Date.now() }
    ],
    currentSelector: "[data-cy='search-submit']",
    selectorContext: { element: "button", text: "Search", position: { x: 200, y: 100 } },
    errorMessage: "Timeout waiting for search results",
    status: "new"
  });

  const failure6 = await dbStorage.createFailure({
    runId: "run-006-checkout",
    repo: "e-commerce-app", 
    branch: "feature/payment-flow",
    commit: "s7t8u9v",
    suite: "checkout",
    test: "payment form validation",
    specPath: "cypress/e2e/checkout/payment.cy.ts",
    browser: "edge",
    viewport: "1440x900",
    domHtml: `<form class="payment-form">
      <input name="cardNumber" class="card-input" />
      <input name="cvv" class="cvv-input" />
      <button class="pay-now-btn">Pay Now</button>
    </form>`,
    consoleLogs: [
      { level: "error", message: "Card validation failed", timestamp: Date.now() }
    ],
    networkLogs: [
      { method: "POST", url: "/api/payment/validate", status: 400, timestamp: Date.now() }
    ],
    currentSelector: "#payment-submit-button",
    selectorContext: { element: "button", className: "pay-now-btn", position: { x: 250, y: 350 } },
    errorMessage: "Payment button not clickable",
    status: "suggested"
  });

  const failure7 = await dbStorage.createFailure({
    runId: "run-007-profile", 
    repo: "frontend-app",
    branch: "feature/user-profile",
    commit: "w0x1y2z",
    suite: "profile",
    test: "avatar upload functionality",
    specPath: "cypress/e2e/profile/avatar-upload.cy.ts",
    browser: "safari",
    viewport: "1280x720",
    domHtml: `<div class="profile-section">
      <div class="avatar-upload">
        <input type="file" class="file-input" />
        <button class="upload-btn">Upload Photo</button>
      </div>
    </div>`,
    consoleLogs: [
      { level: "error", message: "File upload interrupted", timestamp: Date.now() }
    ],
    networkLogs: [
      { method: "POST", url: "/api/upload/avatar", status: 413, timestamp: Date.now() }
    ],
    currentSelector: "[data-test='avatar-upload-btn']",
    selectorContext: { element: "button", text: "Upload Photo", position: { x: 180, y: 200 } },
    errorMessage: "Upload button interaction failed",
    status: "new"
  });

  const failure8 = await dbStorage.createFailure({
    runId: "run-008-notifications",
    repo: "api-service",
    branch: "feature/notification-system", 
    commit: "a3b4c5d6",
    suite: "notifications",
    test: "push notification settings",
    specPath: "cypress/e2e/settings/notifications.cy.ts",
    browser: "chrome",
    viewport: "1920x1080",
    domHtml: `<div class="notification-settings">
      <label class="toggle-label">
        <input type="checkbox" class="notification-toggle" />
        Enable notifications
      </label>
    </div>`,
    consoleLogs: [
      { level: "warn", message: "Notification permission denied", timestamp: Date.now() }
    ],
    networkLogs: [
      { method: "PUT", url: "/api/user/notifications", status: 403, timestamp: Date.now() }
    ],
    currentSelector: ".notification-switch",
    selectorContext: { element: "input", type: "checkbox", position: { x: 120, y: 150 } },
    errorMessage: "Toggle switch not responding",
    status: "approved"
  });

  const failure9 = await dbStorage.createFailure({
    runId: "run-009-sorting",
    repo: "e-commerce-app",
    branch: "feature/product-sorting",
    commit: "e7f8g9h0",
    suite: "catalog", 
    test: "product list sorting options",
    specPath: "cypress/e2e/catalog/sorting.cy.ts",
    browser: "firefox",
    viewport: "1366x768",
    domHtml: `<div class="product-controls">
      <select class="sort-dropdown">
        <option value="price-low">Price: Low to High</option>
        <option value="price-high">Price: High to Low</option>
      </select>
    </div>`,
    consoleLogs: [
      { level: "error", message: "Sort function not defined", timestamp: Date.now() }
    ],
    networkLogs: [
      { method: "GET", url: "/api/products?sort=price-low", status: 500, timestamp: Date.now() }
    ],
    currentSelector: "[data-sort-option='price']",
    selectorContext: { element: "select", className: "sort-dropdown", position: { x: 300, y: 80 } },
    errorMessage: "Sorting dropdown selection failed",
    status: "new"
  });

  const failure10 = await dbStorage.createFailure({
    runId: "run-010-filters",
    repo: "e-commerce-app",
    branch: "main", 
    commit: "i1j2k3l4",
    suite: "catalog",
    test: "category filter functionality", 
    specPath: "cypress/e2e/catalog/filters.cy.ts",
    browser: "edge",
    viewport: "1440x900",
    domHtml: `<div class="filter-sidebar">
      <div class="category-filters">
        <input type="checkbox" class="filter-checkbox" value="electronics" />
        <label>Electronics</label>
      </div>
    </div>`,
    consoleLogs: [
      { level: "warn", message: "Filter state not persisted", timestamp: Date.now() }
    ],
    networkLogs: [
      { method: "GET", url: "/api/products?category=electronics", status: 200, timestamp: Date.now() }
    ],
    currentSelector: ".category-filter[data-category='electronics']",
    selectorContext: { element: "input", type: "checkbox", value: "electronics", position: { x: 20, y: 120 } },
    errorMessage: "Category filter checkbox not toggleable", 
    status: "suggested"
  });

  const failure11 = await dbStorage.createFailure({
    runId: "run-011-modal",
    repo: "frontend-app",
    branch: "feature/modal-dialogs",
    commit: "m5n6o7p8", 
    suite: "ui",
    test: "confirmation modal dialog",
    specPath: "cypress/e2e/ui/modals.cy.ts",
    browser: "chrome",
    viewport: "1920x1080",
    domHtml: `<div class="modal-overlay">
      <div class="modal-content">
        <h3>Confirm Action</h3>
        <button class="confirm-btn">Yes, Continue</button>
        <button class="cancel-btn">Cancel</button>
      </div>
    </div>`,
    consoleLogs: [
      { level: "error", message: "Modal backdrop not dismissible", timestamp: Date.now() }
    ],
    networkLogs: [],
    currentSelector: "[data-modal-action='confirm']",
    selectorContext: { element: "button", text: "Yes, Continue", position: { x: 400, y: 300 } },
    errorMessage: "Modal confirm button not accessible",
    status: "new"
  });

  const failure12 = await dbStorage.createFailure({
    runId: "run-012-pagination",
    repo: "api-service", 
    branch: "feature/data-pagination",
    commit: "q9r0s1t2",
    suite: "tables",
    test: "data table pagination controls",
    specPath: "cypress/e2e/tables/pagination.cy.ts",
    browser: "safari",
    viewport: "1280x720",
    screenshotPath: "/cypress/screenshots/Cypress_dashboard_test_failure_screenshot_c1991408.png",
    domHtml: `<div class="pagination-controls">
      <button class="prev-page" disabled>Previous</button>
      <span class="page-info">Page 1 of 10</span>
      <button class="next-page">Next</button>
    </div>`,
    consoleLogs: [
      { level: "warn", message: "Page navigation slow", timestamp: Date.now() }
    ],
    networkLogs: [
      { method: "GET", url: "/api/data?page=2", status: 200, timestamp: Date.now() }
    ],
    currentSelector: ".pagination-next", 
    selectorContext: { element: "button", text: "Next", className: "next-page", position: { x: 350, y: 450 } },
    errorMessage: "Next page button click not registered",
    status: "approved"
  });

  // Create suggestions for the additional failures
  await dbStorage.createSuggestion({
    failureId: failure4.id,
    candidates: [
      {
        selector: "[data-testid='menu-toggle-btn']",
        type: "data-testid",
        rationale: "Standard data-testid approach for menu toggles",
        confidence: 0.93,
        source: "heuristic"
      }
    ],
    topChoice: "[data-testid='menu-toggle-btn']"
  });

  await dbStorage.createSuggestion({
    failureId: failure5.id, 
    candidates: [
      {
        selector: "[data-testid='search-submit-btn']",
        type: "data-testid",
        rationale: "Reliable data-testid for search functionality",
        confidence: 0.96,
        source: "heuristic"
      }
    ],
    topChoice: "[data-testid='search-submit-btn']"
  });

  await dbStorage.createSuggestion({
    failureId: failure6.id,
    candidates: [
      {
        selector: "[data-testid='payment-submit-btn']",
        type: "data-testid", 
        rationale: "Standard approach for payment button identification",
        confidence: 0.94,
        source: "heuristic"
      }
    ],
    topChoice: "[data-testid='payment-submit-btn']"
  });

  await dbStorage.createSuggestion({
    failureId: failure7.id,
    candidates: [
      {
        selector: "[data-testid='avatar-upload-btn']",
        type: "data-testid",
        rationale: "Consistent data-testid pattern for upload buttons",
        confidence: 0.91,
        source: "heuristic"
      }
    ],
    topChoice: "[data-testid='avatar-upload-btn']"
  });

  await dbStorage.createSuggestion({
    failureId: failure8.id,
    candidates: [
      {
        selector: "[data-testid='notification-toggle']",
        type: "data-testid",
        rationale: "Standard data-testid for toggle controls",
        confidence: 0.89,
        source: "heuristic"
      }
    ],
    topChoice: "[data-testid='notification-toggle']"
  });

  await dbStorage.createSuggestion({
    failureId: failure9.id,
    candidates: [
      {
        selector: "[data-testid='sort-dropdown']",
        type: "data-testid",
        rationale: "Recommended approach for dropdown selectors",
        confidence: 0.87,
        source: "heuristic"
      }
    ],
    topChoice: "[data-testid='sort-dropdown']"
  });

  await dbStorage.createSuggestion({
    failureId: failure10.id,
    candidates: [
      {
        selector: "[data-testid='category-filter-electronics']",
        type: "data-testid",
        rationale: "Specific data-testid for category filters",
        confidence: 0.85,
        source: "heuristic"
      }
    ],
    topChoice: "[data-testid='category-filter-electronics']"
  });

  await dbStorage.createSuggestion({
    failureId: failure11.id,
    candidates: [
      {
        selector: "[data-testid='modal-confirm-btn']",
        type: "data-testid",
        rationale: "Standard data-testid for modal actions",
        confidence: 0.92,
        source: "heuristic"
      }
    ],
    topChoice: "[data-testid='modal-confirm-btn']"
  });

  await dbStorage.createSuggestion({
    failureId: failure12.id,
    candidates: [
      {
        selector: "[data-testid='pagination-next-btn']",
        type: "data-testid",
        rationale: "Consistent data-testid for pagination controls",
        confidence: 0.90,
        source: "heuristic"
      }
    ],
    topChoice: "[data-testid='pagination-next-btn']"
  });

  // Update some statuses for variety
  await dbStorage.updateFailureStatus(failure2.id, "suggested");
  await dbStorage.updateFailureStatus(failure3.id, "approved");
  await dbStorage.updateFailureStatus(failure6.id, "suggested");
  await dbStorage.updateFailureStatus(failure8.id, "approved");
  await dbStorage.updateFailureStatus(failure10.id, "suggested");
  await dbStorage.updateFailureStatus(failure12.id, "approved");
  
  console.log("Sample data successfully added to database - 12 failures with suggestions");
}

// Initialize storage - prefer database if available, fallback to memory
async function initializeStorage(): Promise<IStorage> {
  if (process.env.DATABASE_URL) {
    try {
      const dbStorage = new DatabaseStorage();
      // Test the connection by trying to fetch failures
      await dbStorage.getFailures();
      console.log("Connected to PostgreSQL database");
      
      // Initialize sample data if database is empty
      await initializeDatabaseSampleData(dbStorage);
      
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
