# AutoHeal - Self-Healing Test Automation System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)](https://www.mongodb.com/atlas)

AutoHeal is a comprehensive self-healing test automation platform that automatically detects failing Cypress test selectors, analyzes them using AI-powered intelligence, and creates automated GitHub pull requests to fix selector issues through an intuitive web dashboard.

## 🚀 Key Features

### 🤖 AI-Powered Selector Analysis
- **OpenAI GPT-4o Integration** for intelligent selector recommendations
- **95% confidence** data-testid suggestions with detailed rationale
- **Context-aware analysis** of DOM structure, error patterns, and test behavior
- **Heuristic fallback engine** prioritizing accessibility and stability

### 🎯 Intelligent Suggestion Engine
- **Multi-strategy approach** combining AI analysis with rule-based heuristics
- **Priority ranking** (data-testid → aria-label → role → semantic classes → stable IDs)
- **Confidence scoring** with detailed explanations for each suggestion
- **Anti-pattern detection** avoiding auto-generated and brittle selectors

### 🔄 Complete E2E Workflow
1. **Cypress Plugin** captures test failures with full context
2. **AI Analysis** generates ranked selector alternatives
3. **Dashboard Review** allows team approval/rejection of suggestions
4. **Automated PRs** create GitHub pull requests for approved fixes
5. **Audit Trail** maintains complete history of changes and approvals

### 🎨 Modern Full-Stack Architecture
- **React + TypeScript** frontend with shadcn/ui component library
- **Express.js REST API** with comprehensive error handling and logging
- **MongoDB Atlas** with Mongoose ODM for flexible data modeling
- **GitHub Integration** via Octokit for automated repository management

## 🏗️ System Architecture

```mermaid
graph TB
    A[Cypress Test Runner] -->|Failure Detection| B[AutoHeal Platform]
    B -->|AI Analysis| C[OpenAI GPT-4o]
    B -->|Store Data| D[MongoDB Atlas]
    B -->|Create PR| E[GitHub Repository]
    
    F[React Dashboard] -->|API Calls| B
    B -->|Real-time Updates| F
    
    G[User Authentication] -->|Session Management| B
    H[Approval Workflow] -->|Audit Trail| D
    
    subgraph "AutoHeal Core Platform"
        B1[Express.js API Server]
        B2[AI Advisor Service]
        B3[GitHub Service]
        B4[Storage Layer]
        B1 --> B2
        B1 --> B3
        B1 --> B4
    end
    
    B --> B1
```

## 🎯 E2E AutoHeal Dashboard Workflow

### 1. Failure Capture & Analysis
```
Test Failure → DOM Context → AI Analysis → Ranked Suggestions
```
- Cypress plugin captures failing selector with complete context
- DOM structure, console logs, network requests, and screenshots collected
- AI analyzes failure patterns and generates confidence-scored alternatives

### 2. Review & Approval Process
```
Dashboard View → Team Review → Approval Decision → PR Generation
```
- Interactive dashboard displays failures with suggestion details
- Team members review AI rationale and confidence scores
- Approval workflow with comments and audit trail
- Automated GitHub branch creation and pull request submission

### 3. Code Integration
```
PR Creation → Code Review → Merge → Selector Update
```
- Automated pull requests update test files and selector maps
- Integration with existing code review processes
- CODEOWNERS integration for approval workflows
- Rollback capability through version control

## 📊 Demo Environment

AutoHeal includes **12 realistic test failures** across different scenarios:

### Production-Ready Examples
1. **Login Authentication** - Missing data-testid on submit button (95% AI confidence)
2. **E-commerce Product Search** - Brittle class-based selectors with timeout issues
3. **Dashboard Navigation** - Role-based accessibility improvements for charts
4. **Shopping Cart** - Dynamic content selectors needing stability improvements
5. **User Profile** - Form validation with better semantic targeting
6. **API Integration** - Network failure scenarios with robust selector strategies

### Approval States
- ✅ **Approved & Merged** - Successful AI suggestions implemented
- ⏳ **Pending Review** - Awaiting team approval with confidence scores
- 🔄 **In Progress** - Pull requests created and under review
- ❌ **Rejected** - Suggestions declined with team feedback

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- MongoDB Atlas account (or local MongoDB)
- OpenAI API key (optional - intelligent fallback available)
- GitHub personal access token (for PR automation)

### Installation

```bash
# Clone the repository
git clone https://github.com/letcodewithvineet/autoheal-test-automation.git
cd autoheal-test-automation

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Configure your API keys and database connection

# Start development server
npm run dev
```

Open http://localhost:5000 to access the AutoHeal dashboard.

### Production Deployment

```bash
# Build for production
npm run build

# Start production server
npm run start
```

## 🔧 Configuration

### Environment Variables

```env
# Database Configuration
DATABASE_URL=postgresql://user:pass@host:5432/db  # Used for Replit compatibility
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/autoheal

# AI Integration
OPENAI_API_KEY=sk-your-openai-key-here

# GitHub Integration
GITHUB_TOKEN=ghp_your-github-token-here
AUTOHEALTOKEN=ghp_your-github-token-here  # Alternative token name

# Application Settings
NODE_ENV=production
PORT=5000
```

### Database Schema

The system uses MongoDB with the following collections:
- **failures** - Test failure data with context and metadata
- **suggestions** - AI-generated selector recommendations
- **approvals** - Team approval decisions and audit trail
- **users** - Authentication and user management
- **selectors** - Selector history and version tracking
- **pullrequests** - GitHub PR status and integration data

## 📡 API Endpoints

### Core Functionality
```
GET    /api/failures              # List all test failures
GET    /api/failures/:id          # Get specific failure details
POST   /api/failures              # Submit new test failure
POST   /api/failures/:id/suggest  # Generate AI suggestions
```

### Approval Workflow
```
GET    /api/suggestions/:id       # Get suggestion details
POST   /api/approvals             # Approve/reject suggestions
GET    /api/pull-requests         # List GitHub PRs
```

### Authentication & Management
```
POST   /api/auth/login           # User authentication
GET    /api/auth/me              # Current user info
POST   /api/auth/logout          # Session logout
GET    /api/stats                # Dashboard analytics
```

## 🎨 Technology Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **shadcn/ui** component library with Radix UI primitives
- **Tailwind CSS** for responsive styling
- **TanStack Query** for server state management
- **Wouter** for lightweight client-side routing

### Backend
- **Express.js** with TypeScript for REST API
- **Mongoose ODM** for MongoDB data modeling
- **OpenAI SDK** for GPT-4o integration
- **Octokit** for GitHub API interactions
- **bcrypt** for secure password hashing
- **express-session** with memory store for authentication

### Infrastructure
- **MongoDB Atlas** for cloud database hosting
- **GitHub API** for automated pull request creation
- **OpenAI GPT-4o** for intelligent selector analysis
- **Replit** deployment platform with automatic scaling

## 🔒 Security Features

- **Secure Authentication** with bcrypt password hashing
- **Session Management** with express-session
- **API Rate Limiting** to prevent abuse
- **Environment Variable Protection** for sensitive credentials
- **CORS Configuration** for secure cross-origin requests
- **GitHub Token Validation** for repository access control

## 📈 Monitoring & Analytics

### Dashboard Metrics
- **Failure Rate Trends** over time periods
- **AI Confidence Distributions** across suggestions
- **Approval Success Rates** by team members
- **Repository Activity** and PR integration status

### Logging & Debugging
- **Structured Logging** with pino for production
- **Error Tracking** with comprehensive error boundaries
- **Performance Monitoring** for API response times
- **GitHub API Status** monitoring and reporting

## 🚀 Deployment

### Replit (Recommended)
1. Fork the repository to your Replit account
2. Configure environment variables in Secrets
3. Deploy using the built-in deployment system
4. Access your application at `https://your-repl.replit.app`

### Traditional Hosting
```bash
# Production build
npm run build

# Start with PM2 (recommended)
npm install -g pm2
pm2 start dist/index.js --name "autoheal"

# Or with Docker
docker build -t autoheal .
docker run -p 5000:5000 autoheal
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper TypeScript types
4. Add tests for new functionality
5. Commit with conventional commit format
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request with detailed description

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Documentation

- **GitHub Issues** - Bug reports and feature requests
- **Live Demo** - Try the platform at the deployed URL
- **API Documentation** - Comprehensive endpoint documentation
- **Team Demo Guide** - Materials for stakeholder presentations

## 🎉 Acknowledgments

- **OpenAI** for GPT-4o model providing intelligent analysis
- **MongoDB Atlas** for reliable cloud database hosting
- **GitHub** for seamless repository integration
- **shadcn/ui** for beautiful and accessible React components
- **Replit** for simplified deployment and hosting platform

---

**AutoHeal transforms test maintenance from a constant headache into an automated, intelligent workflow. Built for development teams who want stable, maintainable test automation without the overhead of constant selector debugging.**

🔗 **Experience AutoHeal**: [Live Demo](https://autoheal-test-automation-pandeyvineetpro.replit.app/)