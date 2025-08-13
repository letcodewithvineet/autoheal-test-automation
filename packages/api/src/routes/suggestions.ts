import { Router } from 'express';
import { SuggestionModel } from '../models/Suggestion';
import { logger } from '../utils/logger';

const router = Router();

// Get suggestions for a specific failure
router.get('/:failureId', async (req, res) => {
  try {
    const suggestions = await SuggestionModel.find({ failureId: req.params.failureId })
      .sort({ createdAt: -1 })
      .lean();

    const formattedSuggestions = suggestions.map(suggestion => ({
      ...suggestion,
      id: suggestion._id.toString()
    }));

    res.json(formattedSuggestions);
  } catch (error) {
    logger.error('Error fetching suggestions:', error);
    res.status(500).json({ message: 'Failed to fetch suggestions' });
  }
});

// Get specific suggestion
router.get('/suggestion/:id', async (req, res) => {
  try {
    const suggestion = await SuggestionModel.findById(req.params.id).lean();
    if (!suggestion) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }

    res.json({
      ...suggestion,
      id: suggestion._id.toString()
    });
  } catch (error) {
    logger.error('Error fetching suggestion:', error);
    res.status(500).json({ message: 'Failed to fetch suggestion' });
  }
});

export default router;
