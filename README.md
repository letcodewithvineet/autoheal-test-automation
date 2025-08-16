# AutoHeal - Self-Healing Test Automation System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

AutoHeal is a comprehensive self-healing test automation platform that automatically detects failing Cypress test selectors, analyzes them using AI-powered intelligence, and suggests stable alternatives through an intuitive web dashboard.

![AutoHeal Dashboard](https://via.placeholder.com/800x400/2563eb/white?text=AutoHeal+Dashboard+Demo)

## 🚀 Key Features

### AI-Powered Selector Analysis
- **OpenAI GPT-4 Integration** for intelligent selector suggestions
- **95% confidence** data-testid recommendations
- **Context-aware analysis** of DOM structure and test patterns
- **Fallback heuristic engine** for offline operation

### Intelligent Suggestion Engine
- **Priority-based ranking** (data-testid → aria-label → role → semantic classes)
- **Confidence scoring** with detailed rationale for each suggestion
- **Multi-strategy approach** combining AI and rule-based analysis
- **Stability assessment** avoiding auto-generated selectors

### Complete Workflow Management
- **Real-time dashboard** for failure monitoring and analysis
- **Approval workflow** with audit trails for team collaboration  
- **GitHub integration** for automated pull request creation
- **Enterprise-ready** with user authentication and role management

### Full-Stack Architecture
- **React + TypeScript** frontend with shadcn/ui components
- **Express.js API** with comprehensive error handling
- **PostgreSQL database** with Drizzle ORM for type safety
- **Docker support** for easy deployment and scaling

## 🎯 Demo Environment

AutoHeal includes a complete demo environment with **3 realistic test failures**:

1. **Login Form Failure** - Missing data-testid attributes (95% AI confidence)
2. **E-commerce Product Selection** - Unstable class-based selectors  
3. **Dashboard Chart Interaction** - Accessibility-focused improvements

## 📋 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (or use demo mode)
- OpenAI API key (optional - will fallback to heuristics)

### Installation

```bash
# Clone the repository
git clone https://github.com/letcodewithvineet/autoheal-test-automation.git
cd autoheal-test-automation

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Initialize database
npm run db:push

# Start development server
npm run dev
```

Open http://localhost:5000 to see the AutoHeal dashboard.

### Windows Setup

For Windows users, use the included PowerShell script:

```powershell
# Run the automated setup
.\start-windows-demo.ps1
```

See [DEMO_SETUP_WINDOWS.md](./DEMO_SETUP_WINDOWS.md) for detailed Windows instructions.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Cypress       │───▶│    AutoHeal      │───▶│    GitHub       │
│   Test Runner   │    │    Platform      │    │    PRs          │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React         │◀──▶│   Express API    │◀──▶│   PostgreSQL    │
│   Dashboard     │    │   + AI Service   │    │   Database      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Core Components

- **Cypress Plugin**: Captures test failures with full context (DOM, screenshots, logs)
- **AI Advisor Service**: Analyzes failures and generates ranked selector suggestions  
- **Web Dashboard**: Review failures, approve suggestions, manage workflow
- **GitHub Service**: Creates automated pull requests for approved changes
- **Database Layer**: Stores failures, suggestions, and approval audit trails

## 🔧 Configuration

### Environment Variables

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/autoheal

# AI Integration (Optional)
OPENAI_API_KEY=sk-your-openai-key-here

# GitHub Integration (Optional) 
GITHUB_TOKEN=ghp_your-github-token-here

# Application Settings
NODE_ENV=production
PORT=5000
```

### OpenAI Integration

AutoHeal uses OpenAI GPT-4 for advanced selector analysis. Without an API key, the system automatically falls back to intelligent heuristic-based suggestions that still provide high-quality recommendations.

## 📊 API Endpoints

### Failure Management
- `GET /api/failures` - List all test failures
- `GET /api/failures/:id` - Get specific failure details
- `POST /api/failures` - Submit new test failure

### Suggestion System  
- `POST /api/failures/:id/suggest` - Generate AI suggestions
- `GET /api/suggestions/:id` - Get suggestion details
- `POST /api/suggestions/:id/approve` - Approve suggestion
- `POST /api/suggestions/:id/reject` - Reject suggestion

### Analytics
- `GET /api/stats` - Dashboard analytics and metrics
- `GET /api/health` - System health check

## 🚀 Deployment

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Access at http://localhost:5000
```

### Cloud Platforms

AutoHeal deploys seamlessly to:
- **Replit** (recommended for demos)
- **Railway** (with automatic PostgreSQL)
- **Vercel** (with Vercel Postgres)
- **DigitalOcean App Platform**

See [GITHUB_DEPLOYMENT_STEPS.md](./GITHUB_DEPLOYMENT_STEPS.md) for detailed deployment instructions.

## 📈 Team Demo

AutoHeal includes comprehensive demo materials:

- **[TEAM_DEMO_GUIDE.md](./TEAM_DEMO_GUIDE.md)** - 20-minute presentation script
- **Live dashboard** with interactive failure analysis
- **Working AI suggestions** with confidence scoring
- **Complete approval workflow** demonstration

Perfect for showcasing to stakeholders, development teams, and potential users.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`) 
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the included markdown guides
- **Issues**: Create GitHub issues for bugs or feature requests
- **Demo Setup**: See `DEMO_SETUP_WINDOWS.md` for Windows-specific help

## 🎉 Acknowledgments

- OpenAI GPT-4 for intelligent selector analysis
- Cypress team for robust test automation platform
- shadcn/ui for beautiful React components
- Drizzle ORM for type-safe database operations

---

**Built with ❤️ for developers who want stable, maintainable test automation without the constant selector maintenance overhead.**