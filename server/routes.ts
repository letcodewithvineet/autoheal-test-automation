import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertFailureSchema, insertUserSchema } from "@shared/schema";
import { aiAdvisor } from "./services/aiAdvisor";
import { githubService } from "./services/github";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";
import session from "express-session";
import connectPg from "connect-pg-simple";

const upload = multer({ dest: 'uploads/' });

// Authentication middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  const PgSession = connectPg(session);
  app.use(session({
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
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
  // Static file serving for screenshots
  app.use('/api/screenshots', express.static(path.join(process.cwd(), 'screenshots')));
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
      
      // Set session
      req.session.userId = user.id;
      
      res.status(201).json({ 
        user: { id: user.id, username: user.username },
        message: "User registered successfully" 
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

  app.post("/api/failures", requireAuth, upload.single('screenshot'), async (req, res) => {
    try {
      const validatedData = insertFailureSchema.parse(req.body);
      
      // Handle screenshot upload
      if (req.file) {
        const screenshotPath = `/screenshots/${req.file.filename}`;
        validatedData.screenshotPath = screenshotPath;
        
        // Ensure screenshots directory exists
        const screenshotsDir = path.join(process.cwd(), 'uploads', 'screenshots');
        if (!fs.existsSync(screenshotsDir)) {
          fs.mkdirSync(screenshotsDir, { recursive: true });
        }
        
        // Move file to screenshots directory
        const oldPath = req.file.path;
        const newPath = path.join(screenshotsDir, req.file.filename);
        fs.renameSync(oldPath, newPath);
      }
      
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

  // Selectors routes
  app.get("/api/selectors/:page", async (req, res) => {
    try {
      // TODO: Return selector map for page
      res.json({ message: "Selector map endpoint" });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch selectors" });
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

  // Serve uploaded files
  app.use('/screenshots', express.static(path.join(process.cwd(), 'uploads', 'screenshots')));

  const httpServer = createServer(app);
  return httpServer;
}
