import { Router } from 'express';
import { SelectorModel } from '../models/Selector';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

const router = Router();

// Get selector map for a page
router.get('/:page', async (req, res) => {
  try {
    const selectors = await SelectorModel.find({ page: req.params.page }).lean();
    
    const selectorMap: Record<string, string> = {};
    selectors.forEach(selector => {
      selectorMap[`${selector.page}.${selector.name}`] = selector.current;
    });

    res.json(selectorMap);
  } catch (error) {
    logger.error('Error fetching selectors:', error);
    res.status(500).json({ message: 'Failed to fetch selectors' });
  }
});

// Get full selector map
router.get('/', async (req, res) => {
  try {
    // Try to read from the shared selectors file first
    const selectorsMapPath = path.join(process.cwd(), '../../shared/selectors/selectors.map.json');
    
    if (fs.existsSync(selectorsMapPath)) {
      const selectorMap = JSON.parse(fs.readFileSync(selectorsMapPath, 'utf8'));
      return res.json(selectorMap);
    }

    // Fallback to database
    const selectors = await SelectorModel.find().lean();
    
    const selectorMap: Record<string, string> = {};
    selectors.forEach(selector => {
      selectorMap[`${selector.page}.${selector.name}`] = selector.current;
    });

    res.json(selectorMap);
  } catch (error) {
    logger.error('Error fetching selector map:', error);
    res.status(500).json({ message: 'Failed to fetch selector map' });
  }
});

// Update selector
router.put('/:page/:name', async (req, res) => {
  try {
    const { page, name } = req.params;
    const { selector, commit, approvedBy } = req.body;

    const historyEntry = {
      selector,
      commit,
      approvedAt: new Date(),
      approvedBy
    };

    const result = await SelectorModel.findOneAndUpdate(
      { page, name },
      {
        current: selector,
        $push: { history: historyEntry }
      },
      { upsert: true, new: true }
    );

    logger.info(`Updated selector ${page}.${name} to: ${selector}`);

    res.json({
      ...result.toObject(),
      id: result._id.toString()
    });
  } catch (error) {
    logger.error('Error updating selector:', error);
    res.status(500).json({ message: 'Failed to update selector' });
  }
});

export default router;
