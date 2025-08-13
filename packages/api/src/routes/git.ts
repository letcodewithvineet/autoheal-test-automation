import { Router } from 'express';
import { PRService } from '../services/git/prService';
import { SuggestionModel } from '../models/Suggestion';
import { ApprovalModel } from '../models/Approval';
import { FailureModel } from '../models/Failure';
import { logger } from '../utils/logger';

const router = Router();
const prService = new PRService();

// Retry PR creation for a suggestion
router.post('/pr/:suggestionId/retry', async (req, res) => {
  try {
    const suggestion = await SuggestionModel.findById(req.params.suggestionId);
    if (!suggestion) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }

    // Find the approval for this suggestion
    const approval = await ApprovalModel.findOne({ 
      suggestionId: req.params.suggestionId,
      decision: 'approve'
    });

    if (!approval) {
      return res.status(400).json({ message: 'No approval found for this suggestion' });
    }

    const failure = await FailureModel.findById(suggestion.failureId);
    if (!failure) {
      return res.status(404).json({ message: 'Related failure not found' });
    }

    const prResult = await prService.createPRForApprovedSuggestion({
      approvalId: approval._id.toString(),
      suggestionId: suggestion._id.toString(),
      failureId: failure._id.toString(),
      oldSelector: failure.currentSelector,
      newSelector: suggestion.topChoice,
      testName: failure.test,
      specPath: failure.specPath,
      commit: failure.commit,
      approvedBy: approval.approvedBy,
      notes: approval.notes
    });

    res.json({
      message: 'PR creation retried successfully',
      prNumber: prResult.prNumber,
      prUrl: prResult.prUrl
    });
  } catch (error) {
    logger.error('Error retrying PR creation:', error);
    res.status(500).json({ message: 'Failed to retry PR creation' });
  }
});

// Get PR status for a suggestion
router.get('/pr/:suggestionId/status', async (req, res) => {
  try {
    // This would typically check the PR status from GitHub
    // For now, return a placeholder response
    res.json({
      status: 'pending',
      prNumber: null,
      prUrl: null
    });
  } catch (error) {
    logger.error('Error fetching PR status:', error);
    res.status(500).json({ message: 'Failed to fetch PR status' });
  }
});

export default router;
