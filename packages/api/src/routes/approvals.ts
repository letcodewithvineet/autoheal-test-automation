import { Router } from 'express';
import { z } from 'zod';
import { ApprovalModel } from '../models/Approval';
import { SuggestionModel } from '../models/Suggestion';
import { FailureModel } from '../models/Failure';
import { PRService } from '../services/git/prService';
import { logger } from '../utils/logger';

const router = Router();
const prService = new PRService();

// Create approval/rejection
router.post('/', async (req, res) => {
  try {
    const approvalSchema = z.object({
      suggestionId: z.string(),
      decision: z.enum(['approve', 'reject']),
      notes: z.string().optional(),
      approvedBy: z.string()
    });

    const validatedData = approvalSchema.parse(req.body);

    // Verify suggestion exists
    const suggestion = await SuggestionModel.findById(validatedData.suggestionId);
    if (!suggestion) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }

    // Create approval record
    const approval = new ApprovalModel(validatedData);
    await approval.save();

    // Update failure status
    const newStatus = validatedData.decision === 'approve' ? 'approved' : 'rejected';
    await FailureModel.findByIdAndUpdate(suggestion.failureId, { status: newStatus });

    // If approved, trigger PR creation
    if (validatedData.decision === 'approve') {
      try {
        const failure = await FailureModel.findById(suggestion.failureId);
        if (failure) {
          await prService.createPRForApprovedSuggestion({
            approvalId: approval._id.toString(),
            suggestionId: suggestion._id.toString(),
            failureId: failure._id.toString(),
            oldSelector: failure.currentSelector,
            newSelector: suggestion.topChoice,
            testName: failure.test,
            specPath: failure.specPath,
            commit: failure.commit,
            approvedBy: validatedData.approvedBy,
            notes: validatedData.notes
          });
          
          logger.info(`PR creation triggered for approval ${approval._id}`);
        }
      } catch (prError) {
        logger.error('Failed to create PR:', prError);
        // Don't fail the approval, just log the error
      }
    }

    res.status(201).json({
      ...approval.toObject(),
      id: approval._id.toString()
    });
  } catch (error) {
    logger.error('Error creating approval:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to create approval' });
  }
});

// Get approvals for a suggestion
router.get('/suggestion/:suggestionId', async (req, res) => {
  try {
    const approvals = await ApprovalModel.find({ suggestionId: req.params.suggestionId })
      .sort({ createdAt: -1 })
      .lean();

    const formattedApprovals = approvals.map(approval => ({
      ...approval,
      id: approval._id.toString()
    }));

    res.json(formattedApprovals);
  } catch (error) {
    logger.error('Error fetching approvals:', error);
    res.status(500).json({ message: 'Failed to fetch approvals' });
  }
});

export default router;
