# AutoHeal - Self-Healing Test Automation System

## Overview

AutoHeal is a comprehensive self-healing test automation platform that automatically detects and fixes failing Cypress test selectors using AI-powered analysis. The system provides a complete feedback loop where test failures are captured, analyzed by AI to generate better selector alternatives, reviewed through a web dashboard, and automatically applied via GitHub pull requests.

The platform combines traditional heuristic-based selector generation with modern LLM capabilities to provide intelligent, context-aware suggestions for improving test stability. Built as a full-stack solution with React frontend, Node.js/Express backend, PostgreSQL database, and deep Cypress integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript and Vite for fast development and building
- **UI Components**: Comprehensive component library using Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Design System**: shadcn/ui component library with consistent theming and accessibility

### Backend Architecture
- **API Server**: Express.js with TypeScript providing RESTful endpoints
- **Database Layer**: Drizzle ORM with PostgreSQL for type-safe database operations
- **File Storage**: Multer for handling screenshot and artifact uploads
- **Error Handling**: Centralized error handling with proper HTTP status codes and logging

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Drizzle ORM for structured data (failures, suggestions, approvals, users, selectors)
- **Schema Design**: Normalized tables with proper relationships between failures, suggestions, and approvals
- **File Storage**: Local filesystem storage for screenshots and DOM snapshots with GridFS integration capability
- **Session Management**: Built-in session handling for user authentication and state persistence

### Authentication and Authorization
- **User Management**: Database-backed user authentication with username/password
- **Session Handling**: Express session management with database persistence
- **Role-based Access**: Approval workflow system allowing users to approve/reject AI suggestions
- **Security**: CORS configuration and rate limiting for API protection

### External Service Integrations

#### AI and Machine Learning
- **OpenAI Integration**: LLM-powered selector analysis and suggestion generation
- **Heuristic Engine**: Rule-based selector preference system favoring data-testid, aria-label, and role attributes
- **Confidence Scoring**: AI-driven confidence ratings for selector suggestions with rationale

#### Test Automation Integration
- **Cypress Plugin**: Custom plugin for capturing test failures with full context
- **Artifact Collection**: Automated capture of DOM snapshots, console logs, network logs, and screenshots
- **Test Metadata**: Integration with CI/CD systems for commit SHA, branch, and run ID tracking

#### Version Control Integration
- **GitHub Integration**: Octokit REST API for automated pull request creation
- **Branch Management**: Automated creation of feature branches for approved selector changes
- **Code Review Workflow**: Integration with CODEOWNERS for approval workflows
- **Selector Management**: Automated updates to selector maps and page object files

#### Development and Deployment
- **Docker Support**: Container-ready configuration for easy deployment
- **Development Tools**: Hot reload, TypeScript checking, and development middleware
- **Build Pipeline**: Optimized production builds with asset bundling and minification
- **Monitoring**: Health check endpoints and structured logging for operational visibility

### Core Design Patterns
- **Event-Driven Architecture**: Failure detection triggers AI analysis pipeline
- **Repository Pattern**: Clean separation between data access and business logic
- **Factory Pattern**: Consistent creation of suggestions and approvals
- **Observer Pattern**: Real-time updates to dashboard when new failures are detected
- **Strategy Pattern**: Multiple selector generation strategies (heuristic vs AI-powered)

## Recent Implementation Status (August 2025)

### ✅ Completed Features
- **Full-Stack Application**: React frontend with Node.js/Express backend successfully deployed
- **AI Integration**: OpenAI GPT-4o integration for intelligent selector analysis and suggestions
- **Database Implementation**: PostgreSQL with Drizzle ORM handling failures, suggestions, and approvals
- **Heuristic Engine**: Rule-based selector generation prioritizing data-testid, aria-label, and semantic attributes
- **GitHub Integration**: Automated pull request creation via Octokit for approved selector changes
- **Real-time Dashboard**: Interactive interface showing failure analysis, suggestion approval workflow
- **Sample Data**: Demonstration environment with 3 test failures across different repositories and statuses

### 🔧 Core Services Operational
- **AI Advisor Service**: Multi-strategy selector generation combining heuristics and LLM analysis
- **GitHub Service**: Automated branch creation, file updates, and PR generation for approved changes
- **Storage Layer**: Complete CRUD operations for failures, suggestions, approvals, and selector management
- **API Endpoints**: RESTful interface supporting failure submission, suggestion generation, and approval workflows

### 📊 Current Demo Data
- Login test failure with data-testid suggestion (95% confidence)
- E-commerce product selector issue with semantic class alternatives
- API dashboard chart selector with role-based accessibility improvements
- All failures include realistic DOM context, error messages, and multi-candidate suggestions

### 🚀 Ready for Production
The AutoHeal system is fully operational with complete failure-to-fix pipeline including:
1. Cypress failure detection and artifact collection
2. AI-powered selector analysis and ranking
3. Human approval workflow with confidence scoring  
4. Automated GitHub integration for seamless code updates
5. Comprehensive logging and error handling throughout