# AutoHeal Deployment Guide

## Quick Start for GitHub

1. **Create a new repository on GitHub**
   - Go to https://github.com/letcodewithvineet
   - Click "New repository"
   - Name it "autoheal"
   - Keep it public or private as preferred

2. **Upload the project files**
   - Download the project zip file
   - Extract it to a local directory
   - Initialize git and push to your repo:

```bash
git init
git add .
git commit -m "Initial commit: AutoHeal self-healing test automation system"
git branch -M main
git remote add origin https://github.com/letcodewithvineet/autoheal.git
git push -u origin main
```

## Environment Setup

### Required Environment Variables
Create a `.env` file with these variables:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/autoheal
PGHOST=localhost
PGPORT=5432
PGUSER=autoheal_user
PGPASSWORD=your_password
PGDATABASE=autoheal

# OpenAI Configuration (Required for AI suggestions)
OPENAI_API_KEY=your_openai_api_key_here

# GitHub Integration (Optional)
GITHUB_TOKEN=your_github_token_here

# Application Configuration
NODE_ENV=production
PORT=5000
```

### Getting API Keys

#### OpenAI API Key
1. Visit https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key and add it to your `.env` file

#### GitHub Token (Optional)
1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate new token with `repo` permissions
3. Copy the token and add it to your `.env` file

## Deployment Options

### Option 1: Docker Deployment (Recommended)

```bash
# Clone your repository
git clone https://github.com/letcodewithvineet/autoheal.git
cd autoheal

# Create environment file
cp .env.example .env
# Edit .env with your actual values

# Start with Docker Compose
docker-compose up -d

# The application will be available at http://localhost:5000
```

### Option 2: Local Development

```bash
# Clone your repository
git clone https://github.com/letcodewithvineet/autoheal.git
cd autoheal

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your actual values

# Set up database
npm run db:push

# Start development server
npm run dev
```

### Option 3: Production Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Database Setup

The system uses PostgreSQL. You have two options:

### Local PostgreSQL
1. Install PostgreSQL 14+
2. Create a database named `autoheal`
3. Update DATABASE_URL in your `.env` file
4. Run `npm run db:push` to create tables

### Docker PostgreSQL (Included)
The docker-compose.yml includes PostgreSQL setup automatically.

## Verifying Installation

1. **Access the Dashboard**: Navigate to http://localhost:5000
2. **Check Demo Data**: You should see 3 sample test failures
3. **Test AI Suggestions**: Click on any failure to generate suggestions
4. **Approval Workflow**: Try approving a suggestion

## Production Considerations

### Security
- Use strong database passwords
- Keep API keys secure
- Enable HTTPS in production
- Configure CORS properly

### Performance
- Use connection pooling for database
- Enable caching for static assets
- Monitor API rate limits (OpenAI)
- Set up logging and monitoring

### Scaling
- Use Redis for session storage
- Implement database read replicas
- Consider CDN for static assets
- Set up load balancing

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify DATABASE_URL is correct
   - Ensure PostgreSQL is running
   - Check firewall settings

2. **OpenAI API Errors**
   - Verify API key is correct
   - Check API quota and billing
   - System falls back to heuristic mode if needed

3. **GitHub Integration Issues**
   - Verify token has repo permissions
   - Check repository URL format
   - Ensure GITHUB_TOKEN is set

### Logs
Check application logs for detailed error information:

```bash
# Docker logs
docker-compose logs app

# Local development
npm run dev (logs appear in console)
```

## Support

For issues and questions:
- Create an issue on the GitHub repository
- Check the README.md for detailed documentation
- Review the demo data and examples

## Next Steps

1. Set up your Cypress test integration
2. Configure GitHub repository for PR creation
3. Customize AI suggestion rules
4. Monitor test failure patterns
5. Scale the system based on usage