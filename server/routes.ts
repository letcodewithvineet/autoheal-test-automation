import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertFailureSchema, insertUserSchema } from "@shared/schemas-mongo";
import { aiAdvisor } from "./services/aiAdvisor";
import { githubService } from "./services/github";
import bcrypt from "bcrypt";
import session from "express-session";
import MemoryStore from "memorystore";


// Authentication middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration with in-memory store for MongoDB
  const MemStore = MemoryStore(session);
  app.use(session({
    store: new MemStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    secret: process.env.SESSION_SECRET || 'autoheal-session-secret-dev',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));
  // CORS headers for web package integration
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    
    next();
  });

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        username: validatedData.username,
        password: hashedPassword,
      });
      
      // Don't automatically log in after registration
      // User should manually log in with their credentials
      
      res.status(201).json({ 
        user: { id: user.id, username: user.username },
        message: "Account created successfully! Please log in with your credentials." 
      });
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set session
      req.session.userId = user.id;
      
      res.json({ 
        user: { id: user.id, username: user.username },
        message: "Login successful" 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ user: { id: user.id, username: user.username } });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Failures routes (protected)
  app.get("/api/failures", requireAuth, async (req, res) => {
    try {
      const filters: any = {};
      if (req.query.repo) filters.repo = req.query.repo as string;
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.since) filters.since = new Date(req.query.since as string);
      
      const failures = await storage.getFailures(filters);
      
      // Add suggestion counts
      const failuresWithCounts = await Promise.all(
        failures.map(async (failure) => {
          const suggestions = await storage.getSuggestionsByFailureId(failure.id);
          return {
            ...failure,
            suggestionCount: suggestions.length
          };
        })
      );
      
      res.json(failuresWithCounts);
    } catch (error) {
      console.error('Error fetching failures:', error);
      res.status(500).json({ message: "Failed to fetch failures" });
    }
  });

  app.get("/api/failures/:id", requireAuth, async (req, res) => {
    try {
      const failure = await storage.getFailure(req.params.id);
      if (!failure) {
        return res.status(404).json({ message: "Failure not found" });
      }
      
      const suggestions = await storage.getSuggestionsByFailureId(failure.id);
      res.json({ ...failure, suggestions });
    } catch (error) {
      console.error('Error fetching failure:', error);
      res.status(500).json({ message: "Failed to fetch failure details" });
    }
  });

  app.post("/api/failures", requireAuth, async (req, res) => {
    try {
      const validatedData = insertFailureSchema.parse(req.body);
      
      
      const failure = await storage.createFailure(validatedData);
      
      // Generate suggestions using AI advisor
      try {
        const suggestions = await aiAdvisor.generateSuggestions(failure);
        await storage.createSuggestion({
          failureId: failure.id,
          candidates: suggestions.candidates,
          topChoice: suggestions.topChoice
        });
      } catch (error) {
        console.error('Failed to generate suggestions for failure:', failure.id, error);
        // Continue without suggestions - they can be generated later
      }
      
      res.status(201).json({ failureId: failure.id });
    } catch (error) {
      console.error('Error creating failure:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create failure" });
    }
  });

  app.post("/api/failures/:id/suggest", requireAuth, async (req, res) => {
    try {
      const failure = await storage.getFailure(req.params.id);
      if (!failure) {
        return res.status(404).json({ message: "Failure not found" });
      }

      const suggestions = await aiAdvisor.generateSuggestions(failure);
      const suggestion = await storage.createSuggestion({
        failureId: failure.id,
        candidates: suggestions.candidates,
        topChoice: suggestions.topChoice
      });

      res.json({ suggestionId: suggestion.id, candidates: suggestions.candidates });
    } catch (error) {
      console.error('Error regenerating suggestions:', error);
      res.status(500).json({ message: "Failed to regenerate suggestions" });
    }
  });

  // Suggestions routes (protected)
  app.get("/api/suggestions", requireAuth, async (req, res) => {
    try {
      // Get all suggestions across all failures
      const failures = await storage.getFailures({});
      const allSuggestions: any[] = [];
      
      for (const failure of failures) {
        const suggestions = await storage.getSuggestionsByFailureId(failure.id);
        for (const suggestion of suggestions) {
          // Enrich suggestion with failure context
          allSuggestions.push({
            ...suggestion,
            test: failure.test,
            repo: failure.repo,
            status: failure.status === 'approved' ? 'approved' : 
                   failure.status === 'rejected' ? 'rejected' : 'pending'
          });
        }
      }
      
      // Sort by creation date (newest first)
      allSuggestions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json(allSuggestions);
    } catch (error) {
      console.error('Error fetching all suggestions:', error);
      res.status(500).json({ message: "Failed to fetch suggestions" });
    }
  });
  
  app.get("/api/suggestions/:failureId", requireAuth, async (req, res) => {
    try {
      const suggestions = await storage.getSuggestionsByFailureId(req.params.failureId);
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suggestions" });
    }
  });

  // Approvals routes (protected)
  app.post("/api/approvals", requireAuth, async (req, res) => {
    try {
      const approvalSchema = z.object({
        suggestionId: z.string(),
        decision: z.enum(["approve", "reject"]),
        notes: z.string().optional(),
        approvedBy: z.string(),
      });
      
      const validatedData = approvalSchema.parse(req.body);
      const approval = await storage.createApproval(validatedData);
      
      if (validatedData.decision === "approve") {
        try {
          // Get suggestion and failure details for PR creation
          const suggestion = await storage.getSuggestion(validatedData.suggestionId);
          if (suggestion) {
            const failure = await storage.getFailure(suggestion.failureId);
            if (failure) {
              // Create GitHub PR with approved changes
              const prResult = await githubService.createSelectorUpdatePR(approval, suggestion, failure);
              
              if (prResult.success) {
                console.log(`Created PR for approved suggestion: ${prResult.prUrl}`);
                
                // Store the PR in our system
                const candidates = suggestion.candidates as any[];
                const topChoice = suggestion.topChoice || candidates[0]?.selector;
                
                await storage.createPullRequest({
                  failureId: failure.id,
                  suggestionId: suggestion.id,
                  approvalId: approval.id,
                  prNumber: prResult.prNumber || 0,
                  prUrl: prResult.prUrl || '',
                  title: `AutoHeal: Fix failing selector in ${failure.suite}`,
                  description: `Fixed selector from '${failure.currentSelector}' to '${topChoice}' in ${failure.test}`,
                  repo: failure.repo,
                  branch: failure.branch,
                  status: 'open'
                });
                
                // Update failure status to indicate PR was created
                await storage.updateFailureStatus(failure.id, 'pr-created');
              } else {
                console.error(`Failed to create PR for suggestion ${validatedData.suggestionId}:`, prResult.error);
              }
            }
          }
        } catch (error) {
          console.error('Error creating PR for approved suggestion:', error);
          // Continue without failing the approval - PR can be created manually
        }
      }
      
      res.status(201).json(approval);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create approval" });
    }
  });

  // Helper function to detect selector type
  function detectSelectorType(selector: string): string {
    if (selector.includes('data-testid')) return 'data-testid';
    if (selector.includes('aria-label') || selector.includes('[role=') || selector.includes('aria-')) return 'aria';
    if (selector.startsWith('#')) return 'id';
    if (selector.startsWith('.') || selector.includes('.')) return 'class';
    if (selector.includes('//') || selector.includes('xpath')) return 'xpath';
    return 'css';
  }

  // Selectors routes
  app.get("/api/selectors", requireAuth, async (req, res) => {
    try {
      // Generate selector library data from failures and suggestions
      const failures = await storage.getFailures({});
      const selectorMap = new Map<string, any>();
      
      // Process failures to extract selector data
      for (const failure of failures) {
        const suggestions = await storage.getSuggestionsByFailureId(failure.id);
        
        // Add original failing selector
        if (failure.currentSelector && !selectorMap.has(failure.currentSelector)) {
          selectorMap.set(failure.currentSelector, {
            id: `original-${failure.id}`,
            selector: failure.currentSelector,
            type: detectSelectorType(failure.currentSelector),
            usage: 1,
            successRate: 0.0, // Failing selector
            lastUsed: failure.timestamp,
            repo: failure.repo,
            status: 'broken'
          });
        } else if (failure.currentSelector && selectorMap.has(failure.currentSelector)) {
          const existing = selectorMap.get(failure.currentSelector);
          existing.usage += 1;
        }
        
        // Add suggested selectors
        for (const suggestion of suggestions) {
          for (const candidate of suggestion.candidates) {
            if (!selectorMap.has(candidate.selector)) {
              selectorMap.set(candidate.selector, {
                id: `suggested-${suggestion.id}-${candidate.selector.replace(/[^a-zA-Z0-9]/g, '')}`,
                selector: candidate.selector,
                type: detectSelectorType(candidate.selector),
                usage: 1,
                successRate: candidate.confidence,
                lastUsed: suggestion.createdAt,
                repo: failure.repo,
                status: 'active'
              });
            }
          }
        }
      }
      
      const selectors = Array.from(selectorMap.values())
        .sort((a, b) => b.usage - a.usage); // Sort by usage
      
      res.json(selectors);
    } catch (error) {
      console.error('Error fetching selectors:', error);
      res.status(500).json({ message: "Failed to fetch selectors" });
    }
  });
  
  app.get("/api/selectors/:page", async (req, res) => {
    try {
      // TODO: Return selector map for page
      res.json({ message: "Selector map endpoint" });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch selectors" });
    }
  });

  // Pull Requests routes (protected)
  app.get("/api/pull-requests", requireAuth, async (req, res) => {
    try {
      const filters = {
        repo: req.query.repo as string,
        status: req.query.status as string
      };
      
      // Remove undefined values
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined)
      );
      
      const pullRequests = await storage.getPullRequests(cleanFilters);
      res.json(pullRequests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pull requests" });
    }
  });

  // Screenshot serving route
  app.get("/api/cypress/screenshots/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      
      // For demo purposes, generate a placeholder SVG image
      const svgContent = `
        <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#f8fafc"/>
          <rect x="20" y="20" width="360" height="200" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="8"/>
          <text x="200" y="80" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#64748b">Test Failure Screenshot</text>
          <text x="200" y="110" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#94a3b8">${filename}</text>
          <circle cx="100" cy="150" r="8" fill="#ef4444"/>
          <text x="120" y="155" font-family="Arial, sans-serif" font-size="12" fill="#ef4444">Failed Element</text>
          <rect x="80" y="170" width="120" height="30" fill="#fee2e2" stroke="#ef4444" stroke-width="1" rx="4"/>
          <text x="140" y="188" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#ef4444">Login Button</text>
        </svg>
      `;
      
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(svgContent);
    } catch (error) {
      console.error('Error serving screenshot:', error);
      res.status(404).json({ message: "Screenshot not found" });
    }
  });

  // Git/PR routes
  app.post("/api/git/pr/:suggestionId/retry", async (req, res) => {
    try {
      // TODO: Recreate/update PR
      res.json({ message: "PR retry triggered" });
    } catch (error) {
      res.status(500).json({ message: "Failed to retry PR" });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}
