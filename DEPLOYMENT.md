# AutoHeal Production Deployment Guide

## 🌟 Overview

This guide covers deploying AutoHeal to production environments. The system is designed to run on modern cloud platforms with PostgreSQL database support.

## 🚀 Platform-Specific Deployments

### Replit Deployment (Recommended for Demos)

1. **Import Repository**
   ```
   - Go to Replit.com
   - Click "Import from GitHub"
   - Enter: https://github.com/letcodewithvineet/autoheal-test-automation
   - Replit auto-detects Node.js project
   ```

2. **Configure Environment**
   ```
   - Open Secrets tab in Replit
   - Add DATABASE_URL (Replit provides PostgreSQL)
   - Add OPENAI_API_KEY (optional)
   - Add GITHUB_TOKEN (for PR automation)
   ```

3. **Deploy**
   ```
   - Click "Deploy" button
   - Choose "Autoscale" deployment
   - Your app will be live at yourapp.replit.app
   ```

### Railway Deployment

1. **Connect Repository**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and connect
   railway login
   railway link
   ```

2. **Configure Services**
   ```bash
   # Add PostgreSQL database
   railway add postgresql
   
   # Set environment variables
   railway variables set OPENAI_API_KEY=sk-your-key
   railway variables set GITHUB_TOKEN=ghp-your-token
   
   # Deploy
   railway up
   ```

3. **Custom Domain (Optional)**
   ```bash
   railway domain add your-domain.com
   ```

### Vercel Deployment

1. **Import to Vercel**
   ```
   - Connect GitHub repository to Vercel
   - Vercel auto-detects Next.js-like structure
   - Configure build settings for full-stack app
   ```

2. **Database Setup**
   ```bash
   # Add Vercel Postgres
   vercel postgres create
   
   # Get connection string
   vercel env pull
   ```

3. **Environment Configuration**
   ```env
   # In Vercel dashboard
   DATABASE_URL=postgres://...
   OPENAI_API_KEY=sk-...
   GITHUB_TOKEN=ghp-...
   NODE_ENV=production
   ```

### DigitalOcean App Platform

1. **Create App**
   ```yaml
   # app.yaml
   name: autoheal
   services:
   - name: api
     source_dir: /
     github:
       repo: letcodewithvineet/autoheal-test-automation
       branch: main
     run_command: npm start
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: DATABASE_URL
       scope: RUN_AND_BUILD_TIME
       type: SECRET
     - key: OPENAI_API_KEY
       scope: RUN_TIME
       type: SECRET
   databases:
   - name: autoheal-db
     engine: PG
     num_nodes: 1
     size: db-s-dev-database
   ```

2. **Deploy**
   ```bash
   doctl apps create --spec app.yaml
   ```

### Docker Production Deployment

1. **Multi-stage Dockerfile**
   ```dockerfile
   # Production optimized Dockerfile
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   
   FROM node:18-alpine AS production
   WORKDIR /app
   COPY --from=builder /app/node_modules ./node_modules
   COPY . .
   RUN npm run build
   
   EXPOSE 5000
   CMD ["npm", "start"]
   ```

2. **Docker Compose Production**
   ```yaml
   version: '3.8'
   services:
     autoheal:
       build: .
       ports:
         - "5000:5000"
       environment:
         - DATABASE_URL=postgresql://user:pass@db:5432/autoheal
         - OPENAI_API_KEY=${OPENAI_API_KEY}
         - NODE_ENV=production
       depends_on:
         - db
         
     db:
       image: postgres:15
       environment:
         - POSTGRES_DB=autoheal
         - POSTGRES_USER=user
         - POSTGRES_PASSWORD=password
       volumes:
         - postgres_data:/var/lib/postgresql/data
         
   volumes:
     postgres_data:
   ```

## 🔧 Environment Configuration

### Required Variables

```env
# Database (Required)
DATABASE_URL=postgresql://user:pass@host:5432/autoheal

# Application (Required)
NODE_ENV=production
PORT=5000
```

### Optional Variables

```env
# AI Integration (Recommended)
OPENAI_API_KEY=sk-your-openai-key-here

# GitHub Integration (For PR automation)
GITHUB_TOKEN=ghp_your-github-token-here

# Additional Configuration
GITHUB_OWNER=your-github-username
GITHUB_REPO=your-repo-name
```

## 📊 Database Setup

### PostgreSQL Schema

```sql
-- Auto-created by Drizzle migrations
-- No manual setup required

-- Core tables:
-- - failures: Test failure records
-- - suggestions: AI/heuristic suggestions  
-- - approvals: Suggestion approval workflow
-- - users: User authentication
-- - selectors: Selector management
```

### Migration Commands

```bash
# Generate migrations
npm run db:generate

# Push to database
npm run db:push

# View database with Drizzle Studio
npm run db:studio
```

## 🔍 Health Checks

### Health Endpoint

```bash
# Check application health
curl https://your-domain.com/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00Z",
  "database": "connected",
  "openai": "available" | "unavailable"
}
```

### Database Connection

```bash
# Test database connectivity
curl https://your-domain.com/api/failures

# Should return array of failures or empty array
```

## 📈 Performance Optimization

### Database Indexing

```sql
-- Automatic indexes created by Drizzle schema
-- Key indexes on:
-- - failures.id (primary)
-- - failures.created_at (timeline queries)
-- - suggestions.failure_id (relationships)
-- - approvals.suggestion_id (workflow)
```

### Caching Strategy

```javascript
// API responses cached for:
// - failures list: 30 seconds
// - individual failures: 5 minutes
// - suggestions: until approval status changes
```

### Rate Limiting

```javascript
// API rate limits:
// - General endpoints: 100 requests/minute
// - AI suggestion generation: 10 requests/minute
// - GitHub PR creation: 5 requests/hour
```

## 🔒 Security Configuration

### Environment Security

```env
# Use secure environment variable management:
# - Railway: Built-in encrypted variables
# - Vercel: Environment variables dashboard
# - Replit: Secrets tab
# - Docker: Use secrets management
```

### CORS Configuration

```javascript
// Automatically configured for production:
// - API endpoints accessible from dashboard domain
// - Secure cookie settings
// - HTTPS enforcement
```

## 📊 Monitoring & Logging

### Application Logs

```javascript
// Structured logging with timestamps:
// - API requests/responses
// - AI suggestion generation
// - Database operations
// - Error tracking
```

### Metrics Dashboard

```javascript
// Key metrics to monitor:
// - Test failure rates
// - AI suggestion accuracy
// - Approval workflow efficiency  
// - Database performance
// - API response times
```

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check DATABASE_URL format
   # postgresql://user:password@host:port/database
   ```

2. **OpenAI API Errors**
   ```bash
   # Verify API key is valid
   # Check quota limits at platform.openai.com
   # System will fallback to heuristics if needed
   ```

3. **GitHub Integration Issues**
   ```bash
   # Ensure GITHUB_TOKEN has repo access
   # Verify repository permissions
   # Check branch protection rules
   ```

### Debug Commands

```bash
# Check environment variables
npm run env:check

# Test database connection
npm run db:test

# Validate AI service
npm run ai:test

# Generate sample data
npm run seed:demo
```

## 🚀 Scaling Considerations

### Horizontal Scaling

- **Stateless API design** allows multiple instances
- **Database connection pooling** for concurrent requests
- **Async AI processing** prevents blocking operations
- **GitHub rate limit handling** with queuing

### Vertical Scaling

- **Memory**: 512MB minimum, 1GB recommended
- **CPU**: 1 core sufficient, 2+ cores for AI processing
- **Storage**: Minimal (database handles persistence)
- **Network**: Standard bandwidth requirements

Your AutoHeal system is production-ready and will scale with your testing infrastructure needs!