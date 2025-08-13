import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './utils/env';
import { logger } from './utils/logger';
import { connectToMongo } from './services/storage/mongo';
import failuresRouter from './routes/failures';
import suggestionsRouter from './routes/suggestions';
import approvalsRouter from './routes/approvals';
import selectorsRouter from './routes/selectors';
import gitRouter from './routes/git';

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);

// Middleware
app.use(express.json({ limit: `${env.MAX_PAYLOAD_MB}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${env.MAX_PAYLOAD_MB}mb` }));

if (env.ALLOW_CROSS_ORIGIN === 'true') {
  app.use(cors({
    origin: true,
    credentials: true
  }));
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/failures', failuresRouter);
app.use('/api/suggestions', suggestionsRouter);
app.use('/api/approvals', approvalsRouter);
app.use('/api/selectors', selectorsRouter);
app.use('/api/git', gitRouter);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

async function startServer() {
  try {
    await connectToMongo();
    logger.info('Connected to MongoDB');
    
    const port = parseInt(env.PORT, 10);
    app.listen(port, '0.0.0.0', () => {
      logger.info(`AutoHeal API server running on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
