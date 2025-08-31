import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertFailureSchema, insertUserSchema } from "@shared/schemas-mongo";
import { aiAdvisor } from "./services/aiAdvisor";
import { githubService } from "./services/github";
import { ScreenshotService } from "./screenshotService";
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
          // Check if this suggestion has been approved or rejected
          const approvals = await storage.getApprovalsBySuggestionId(suggestion.id);
          const isApproved = approvals.some(a => a.decision === 'approve');
          const isRejected = approvals.some(a => a.decision === 'reject');
          
          // Only show pending suggestions on the suggestions page
          if (!isApproved && !isRejected) {
            allSuggestions.push({
              ...suggestion,
              test: failure.test,
              repo: failure.repo,
              status: 'pending'
            });
          }
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
  app.get("/api/approvals", requireAuth, async (req, res) => {
    try {
      // Get all approvals with enriched data
      const failures = await storage.getFailures({});
      const allApprovals: any[] = [];
      
      for (const failure of failures) {
        const suggestions = await storage.getSuggestionsByFailureId(failure.id);
        
        for (const suggestion of suggestions) {
          const approvals = await storage.getApprovalsBySuggestionId(suggestion.id);
          
          for (const approval of approvals) {
            // Find the top candidate from the suggestion
            const topCandidate = suggestion.candidates.find(c => c.selector === suggestion.topChoice) || suggestion.candidates[0];
            
            allApprovals.push({
              id: approval.id,
              suggestionId: suggestion.id,
              test: failure.test,
              originalSelector: failure.currentSelector,
              suggestedSelector: suggestion.topChoice,
              confidence: topCandidate ? topCandidate.confidence : 0.8,
              rationale: topCandidate ? topCandidate.rationale : 'AI-generated suggestion',
              status: approval.decision === 'approve' ? 'approved' : approval.decision === 'reject' ? 'rejected' : 'pending',
              approvedAt: approval.createdAt,
              approvedBy: approval.approvedBy,
              notes: approval.notes
            });
          }
        }
      }
      
      // Sort by creation date (newest first)
      allApprovals.sort((a, b) => new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime());
      
      res.json(allApprovals);
    } catch (error) {
      console.error('Error fetching approvals:', error);
      res.status(500).json({ message: "Failed to fetch approvals" });
    }
  });
  
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
      
      // Get only real PRs that have been created in GitHub (have prNumber and prUrl)
      const allPullRequests = await storage.getPullRequests(cleanFilters);
      const realPullRequests = allPullRequests
        .filter(pr => pr.prNumber && pr.prUrl && pr.status === 'open')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Latest first
      
      console.log(`Fetched ${allPullRequests.length} total PRs, ${realPullRequests.length} are real/active`);
      
      res.json(realPullRequests);
    } catch (error) {
      console.error('Error fetching pull requests:', error);
      res.status(500).json({ message: "Failed to fetch pull requests" });
    }
  });

  // Screenshot upload route for real test failures
  app.post("/api/screenshots/upload", requireAuth, async (req, res) => {
    try {
      const { failureId, screenshotData, filename } = req.body;
      
      if (!failureId || !screenshotData || !filename) {
        return res.status(400).json({ 
          message: "Missing required fields: failureId, screenshotData, or filename" 
        });
      }

      // In a real implementation, you would save the file to disk or cloud storage
      // For demo, we'll just update the failure with the screenshot path
      const screenshotPath = `/cypress/screenshots/${filename}`;
      
      // Here you would typically:
      // 1. Decode base64 screenshotData
      // 2. Save to filesystem or cloud storage
      // 3. Update failure record with screenshot path
      
      console.log(`Screenshot uploaded for failure ${failureId}: ${filename}`);
      
      res.json({ 
        success: true, 
        screenshotPath,
        message: "Screenshot uploaded successfully" 
      });
    } catch (error) {
      console.error('Error uploading screenshot:', error);
      res.status(500).json({ message: "Failed to upload screenshot" });
    }
  });

  // Capture real website screenshot
  app.post("/api/capture-website-screenshot", async (req, res) => {
    try {
      const { url, selector, errorMessage } = req.body;
      
      if (!url) {
        return res.status(400).json({ message: 'URL is required' });
      }

      const screenshotService = ScreenshotService.getInstance();
      const screenshotPath = await screenshotService.captureWebsiteScreenshot(url, {
        viewport: '1280x720',
        waitFor: 2000,
        errorOverlay: selector && errorMessage ? {
          message: errorMessage,
          selector: selector
        } : undefined
      });

      res.json({ screenshotPath });
    } catch (error) {
      console.error('Error capturing website screenshot:', error);
      res.status(500).json({ message: 'Failed to capture screenshot' });
    }
  });

  // Retry screenshot generation route
  app.post("/api/screenshots/:failureId/retry", async (req, res) => {
    try {
      const { failureId } = req.params;
      
      // Get failure to update it with new screenshot
      const failure = await storage.getFailure(failureId);
      
      if (!failure) {
        return res.status(404).json({ message: "Failure not found" });
      }

      // Generate real screenshot using screenshot service
      const screenshotService = ScreenshotService.getInstance();
      
      const newScreenshotPath = await screenshotService.generateFailureScreenshot({
        test: failure.test,
        errorMessage: failure.errorMessage || 'Test failed due to selector issue',
        domHtml: failure.domHtml || '<div>No DOM context available</div>',
        browser: failure.browser || 'chrome',
        viewport: failure.viewport || '1366x768',
        currentSelector: failure.currentSelector || '',
        selectorContext: failure.selectorContext
      });

      // Update failure with new screenshot path in the database
      await storage.updateFailureScreenshot(failureId, newScreenshotPath);
      console.log(`Generated real screenshot for failure ${failureId}: ${newScreenshotPath}`);

      res.json({
        success: true,
        screenshotPath: newScreenshotPath,
        filename: newFilename,
        message: "Screenshot generated successfully"
      });
    } catch (error) {
      console.error('Error retrying screenshot:', error);
      res.status(500).json({ message: "Failed to generate screenshot" });
    }
  });

  // Get screenshot metadata route
  app.get("/api/screenshots/:failureId", async (req, res) => {
    try {
      const { failureId } = req.params;
      
      // Get failure to check if it has a screenshot
      const failure = await storage.getFailure(failureId);
      
      if (!failure) {
        return res.status(404).json({ message: "Failure not found" });
      }

      if (!failure.screenshotPath) {
        return res.status(404).json({ message: "No screenshot available for this failure" });
      }

      // Return screenshot metadata
      const screenshotInfo = {
        path: failure.screenshotPath,
        filename: failure.screenshotPath.split('/').pop(),
        browser: failure.browser,
        viewport: failure.viewport,
        timestamp: failure.createdAt,
        testInfo: {
          suite: failure.suite,
          test: failure.test,
          repo: failure.repo,
          branch: failure.branch
        }
      };

      res.json(screenshotInfo);
    } catch (error) {
      console.error('Error fetching screenshot metadata:', error);
      res.status(500).json({ message: "Failed to fetch screenshot metadata" });
    }
  });

  // Screenshot serving route
  app.get("/api/cypress/screenshots/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      
      // Generate realistic screenshot based on filename
      let svgContent;
      
      if (filename.includes('legacytouch_login_failure')) {
        // LegacyTouch.com login failure screenshot
        svgContent = `
          <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
            <!-- Background -->
            <rect width="100%" height="100%" fill="#f5f5f5"/>
            
            <!-- Header -->
            <rect x="0" y="0" width="800" height="80" fill="#2c3e50"/>
            <text x="40" y="35" font-family="Arial, sans-serif" font-size="20" fill="#ffffff" font-weight="bold">LegacyTouch</text>
            <text x="40" y="55" font-family="Arial, sans-serif" font-size="12" fill="#ecf0f1">Premium Touch Solutions</text>
            <rect x="650" y="20" width="120" height="40" fill="#34495e" rx="20"/>
            <text x="710" y="45" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#ffffff">My Account</text>
            
            <!-- Login Form Container -->
            <rect x="250" y="150" width="300" height="300" fill="#ffffff" stroke="#ddd" stroke-width="1" rx="8"/>
            
            <!-- Form Title -->
            <text x="400" y="185" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#2c3e50" font-weight="bold">Sign In</text>
            
            <!-- Email Field -->
            <text x="270" y="220" font-family="Arial, sans-serif" font-size="14" fill="#34495e">Email</text>
            <rect x="270" y="225" width="260" height="35" fill="#ffffff" stroke="#bdc3c7" stroke-width="1" rx="4"/>
            <text x="280" y="246" font-family="Arial, sans-serif" font-size="12" fill="#7f8c8d">invalid@test.com</text>
            
            <!-- Password Field -->
            <text x="270" y="280" font-family="Arial, sans-serif" font-size="14" fill="#34495e">Password</text>
            <rect x="270" y="285" width="260" height="35" fill="#ffffff" stroke="#bdc3c7" stroke-width="1" rx="4"/>
            <text x="280" y="306" font-family="Arial, sans-serif" font-size="12" fill="#7f8c8d">••••••••</text>
            
            <!-- Sign In Button (Failed Element) -->
            <rect x="270" y="340" width="260" height="40" fill="#e74c3c" stroke="#c0392b" stroke-width="2" rx="6"/>
            <text x="400" y="363" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#ffffff" font-weight="bold">Sign In</text>
            
            <!-- Error Message -->
            <rect x="270" y="390" width="260" height="30" fill="#f8d7da" stroke="#f1556c" stroke-width="1" rx="4"/>
            <text x="400" y="408" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#721c24">Incorrect email or password.</text>
            
            <!-- Failure Indicator -->
            <circle cx="550" cy="360" r="12" fill="#e74c3c" opacity="0.8"/>
            <text x="550" y="366" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#ffffff" font-weight="bold">✗</text>
            
            <!-- Test Info -->
            <rect x="20" y="500" width="760" height="80" fill="#ffffff" stroke="#e0e0e0" stroke-width="1" rx="4"/>
            <text x="30" y="520" font-family="Arial, sans-serif" font-size="12" fill="#666" font-weight="bold">Test Failure Details:</text>
            <text x="30" y="535" font-family="Arial, sans-serif" font-size="10" fill="#888">Selector: [data-gtm-target-element="my-account"] | Expected: Navigation to account dashboard</text>
            <text x="30" y="548" font-family="Arial, sans-serif" font-size="10" fill="#888">Actual: Remained on login page with error message displayed</text>
            <text x="30" y="561" font-family="Arial, sans-serif" font-size="10" fill="#888">Browser: Chrome 1920x1080 | Time: ${new Date().toLocaleString()}</text>
            
            <!-- Cypress indicator -->
            <circle cx="750" cy="550" r="20" fill="#17202C"/>
            <text x="750" y="555" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#ffffff" font-weight="bold">cy</text>
          </svg>
        `;
      } else {
        // Generic test failure screenshot
        svgContent = `
          <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f8fafc"/>
            <rect x="20" y="20" width="360" height="200" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="8"/>
            <text x="200" y="80" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#64748b">Test Failure Screenshot</text>
            <text x="200" y="110" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#94a3b8">${filename}</text>
            <circle cx="100" cy="150" r="8" fill="#ef4444"/>
            <text x="120" y="155" font-family="Arial, sans-serif" font-size="12" fill="#ef4444">Failed Element</text>
            <rect x="80" y="170" width="120" height="30" fill="#fee2e2" stroke="#ef4444" stroke-width="1" rx="4"/>
            <text x="140" y="188" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#ef4444">Element</text>
          </svg>
        `;
      }
      
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
