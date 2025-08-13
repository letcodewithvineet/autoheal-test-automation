# AutoHeal - Self-Healing Test Automation System

AutoHeal is a comprehensive self-healing test automation platform that automatically detects and fixes failing Cypress test selectors using AI-powered analysis. The system provides a complete feedback loop where test failures are captured, analyzed by AI to generate better selector alternatives, reviewed through a web dashboard, and automatically applied via GitHub pull requests.

## 🚀 Features

- **AI-Powered Selector Analysis**: Uses OpenAI GPT-4o to analyze failing selectors and suggest improvements
- **Heuristic Engine**: Rule-based selector generation prioritizing data-testid, aria-label, and semantic attributes
- **Interactive Dashboard**: React-based interface for reviewing failures and approving suggestions
- **GitHub Integration**: Automatic PR creation for approved selector changes
- **PostgreSQL Database**: Stores failure data, suggestions, and approval history
- **Real-time Monitoring**: Live dashboard showing test health and failure trends

## 🏗️ Architecture

### Frontend
- **React** with TypeScript and Vite
- **Tailwind CSS** + shadcn/ui components
- **TanStack Query** for state management
- **Wouter** for routing

### Backend  
- **Node.js** with Express and TypeScript
- **Drizzle ORM** with PostgreSQL
- **OpenAI API** integration
- **GitHub API** (Octokit) for PR creation

### Database
- **PostgreSQL** for structured data storage
- Normalized schema for failures, suggestions, approvals, and selectors

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- OpenAI API key
- GitHub token (optional, for PR creation)

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/letcodewithvineet/autoheal.git
cd autoheal
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/autoheal
OPENAI_API_KEY=your_openai_api_key
GITHUB_TOKEN=your_github_token (optional)
```

4. **Set up the database**
```bash
npm run db:push
```

5. **Start the development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 🔧 Configuration

### Database Schema
The system uses PostgreSQL with the following main tables:
- `failures` - Test failure records with DOM context
- `suggestions` - AI-generated selector alternatives  
- `approvals` - Human approval decisions
- `selectors` - Selector version history

### OpenAI Integration
Configure your OpenAI API key to enable AI-powered selector analysis. The system uses GPT-4o for intelligent suggestions and falls back to heuristic-only mode if the API is unavailable.

### GitHub Integration
Set up a GitHub token with repo permissions to enable automatic PR creation when suggestions are approved.

## 📊 Usage

### Dashboard
1. View recent test failures in the main dashboard
2. Click on any failure to see detailed analysis
3. Review AI-generated selector suggestions with confidence scores
4. Approve suggestions to trigger automatic PR creation

### API Endpoints
- `GET /api/failures` - List all failures
- `GET /api/failures/:id` - Get failure details with suggestions
- `POST /api/failures` - Submit new failure data
- `POST /api/approvals` - Approve/reject suggestions

### Cypress Integration
The system includes a Cypress plugin for automatic failure capture:

```javascript
// cypress/support/e2e.js
import './autoheal';

// In your test files
cy.get('[data-testid="login-button"]').click();
```

## 🤖 AI Suggestion Engine

AutoHeal uses multiple strategies to generate selector alternatives:

### Heuristic Rules (Priority Order)
1. **data-testid attributes** (95% confidence)
2. **aria-label attributes** (85% confidence) 
3. **role-based selectors** (75% confidence)
4. **stable ID patterns** (70% confidence)
5. **semantic class names** (60% confidence)

### AI Analysis
- Analyzes DOM context and failure patterns
- Generates contextually appropriate selectors
- Provides detailed rationale for each suggestion
- Confidence scoring from 40% to 90%

## 📈 Demo Data

The system includes sample data demonstrating:
- Login test failure with data-testid suggestion (95% confidence)
- E-commerce product selector with semantic alternatives
- API dashboard chart selector with accessibility improvements

## 🚀 Deployment

### Docker
```bash
docker-compose up -d
```

### Manual Deployment
1. Build the application: `npm run build`
2. Set up PostgreSQL database
3. Configure environment variables
4. Start the server: `npm start`

## 🛠️ Development

### Project Structure
```
autoheal/
├── client/           # React frontend
├── server/           # Express backend  
├── shared/           # Shared types and schemas
├── uploads/          # File storage
└── docker-compose.yml
```

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Update database schema
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation in `/docs`
- Review the demo data and examples

## 🔗 Links

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Cypress Testing Framework](https://cypress.io)
- [GitHub API Documentation](https://docs.github.com/en/rest)