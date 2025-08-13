import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { failurePayloadSchema } from '../schemas/failurePayload';
import { FailureModel } from '../models/Failure';
import { SuggestionModel } from '../models/Suggestion';
import { SelectorAdvisor } from '../services/ai/advisor';
import { logger } from '../utils/logger';
import { saveFileToGridFS } from '../services/storage/gridfs';

const router = Router();
const upload = multer({ dest: 'uploads/' });
const advisor = new SelectorAdvisor();

// Get failures with optional filtering
router.get('/', async (req, res) => {
  try {
    const querySchema = z.object({
      repo: z.string().optional(),
      status: z.string().optional(),
      since: z.string().optional(),
      limit: z.string().transform(Number).optional(),
      offset: z.string().transform(Number).optional()
    });

    const { repo, status, since, limit = 50, offset = 0 } = querySchema.parse(req.query);
    
    const filters: any = {};
    if (repo) filters.repo = repo;
    if (status) filters.status = status;
    if (since) filters.timestamp = { $gte: new Date(since) };

    const failures = await FailureModel.find(filters)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    // Add suggestion counts
    const failuresWithCounts = await Promise.all(
      failures.map(async (failure) => {
        const suggestionCount = await SuggestionModel.countDocuments({ failureId: failure._id });
        return {
          ...failure,
          id: failure._id.toString(),
          suggestionCount
        };
      })
    );

    res.json(failuresWithCounts);
  } catch (error) {
    logger.error('Error fetching failures:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid query parameters', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to fetch failures' });
  }
});

// Get specific failure with suggestions
router.get('/:id', async (req, res) => {
  try {
    const failure = await FailureModel.findById(req.params.id).lean();
    if (!failure) {
      return res.status(404).json({ message: 'Failure not found' });
    }

    const suggestions = await SuggestionModel.find({ failureId: failure._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      ...failure,
      id: failure._id.toString(),
      suggestions: suggestions.map(s => ({ ...s, id: s._id.toString() }))
    });
  } catch (error) {
    logger.error('Error fetching failure:', error);
    res.status(500).json({ message: 'Failed to fetch failure details' });
  }
});

// Create new failure report
router.post('/', upload.single('screenshot'), async (req, res) => {
  try {
    const validatedData = failurePayloadSchema.parse(req.body);
    
    let screenshotGridfsId: string | undefined;
    
    // Handle screenshot upload
    if (req.file) {
      try {
        screenshotGridfsId = await saveFileToGridFS(req.file.path, req.file.originalname, req.file.mimetype);
        logger.info(`Saved screenshot to GridFS: ${screenshotGridfsId}`);
      } catch (uploadError) {
        logger.error('Failed to save screenshot:', uploadError);
        // Continue without screenshot
      }
    }

    // Create failure record
    const failure = new FailureModel({
      ...validatedData,
      screenshotGridfsId,
      status: 'new'
    });

    await failure.save();
    logger.info(`Created failure record: ${failure._id}`);

    // Trigger suggestion generation asynchronously
    generateSuggestionsAsync(failure._id.toString(), validatedData);

    res.status(201).json({ failureId: failure._id.toString() });
  } catch (error) {
    logger.error('Error creating failure:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to create failure' });
  }
});

// Manually trigger suggestion regeneration
router.post('/:id/suggest', async (req, res) => {
  try {
    const failure = await FailureModel.findById(req.params.id);
    if (!failure) {
      return res.status(404).json({ message: 'Failure not found' });
    }

    // Delete existing suggestions
    await SuggestionModel.deleteMany({ failureId: failure._id });

    // Generate new suggestions
    await generateSuggestionsAsync(failure._id.toString(), failure.toObject());

    res.json({ message: 'Suggestion regeneration triggered' });
  } catch (error) {
    logger.error('Error regenerating suggestions:', error);
    res.status(500).json({ message: 'Failed to regenerate suggestions' });
  }
});

async function generateSuggestionsAsync(failureId: string, failureData: any) {
  try {
    logger.info(`Generating suggestions for failure ${failureId}`);
    
    // Update status to analyzing
    await FailureModel.findByIdAndUpdate(failureId, { status: 'analyzing' });

    const suggestions = await advisor.generateSuggestions(
      failureData.domHtml,
      failureData.currentSelector,
      failureData.selectorContext,
      'click' // Default action
    );

    // Save suggestions
    const suggestion = new SuggestionModel({
      failureId,
      candidates: suggestions.candidates,
      topChoice: suggestions.topChoice,
      explanationOfFailure: suggestions.explanationOfFailure
    });

    await suggestion.save();

    // Update failure status
    await FailureModel.findByIdAndUpdate(failureId, { status: 'suggested' });

    logger.info(`Generated ${suggestions.candidates.length} suggestions for failure ${failureId}`);
  } catch (error) {
    logger.error(`Failed to generate suggestions for failure ${failureId}:`, error);
    await FailureModel.findByIdAndUpdate(failureId, { status: 'failed' });
  }
}

export default router;
