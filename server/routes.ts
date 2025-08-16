import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertFailureSchema } from "@shared/schema";
import { aiAdvisor } from "./services/aiAdvisor";
import { githubService } from "./services/github";
import multer from "multer";
import path from "path";
import fs from "fs";

const upload = multer({ dest: 'uploads/' });

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Failures routes
  app.get("/api/failures", async (req, res) => {
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

  app.get("/api/failures/:id", async (req, res) => {
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

  app.post("/api/failures", upload.single('screenshot'), async (req, res) => {
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

  app.post("/api/failures/:id/suggest", async (req, res) => {
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

  // Suggestions routes
  app.get("/api/suggestions/:failureId", async (req, res) => {
    try {
      const suggestions = await storage.getSuggestionsByFailureId(req.params.failureId);
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suggestions" });
    }
  });

  // Approvals routes
  app.post("/api/approvals", async (req, res) => {
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
