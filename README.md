# AutoHeal - Self-Healing Test Automation

AutoHeal is a comprehensive self-healing test automation system that automatically fixes flaky test selectors using AI-powered analysis. Built with MERN stack, Cypress, and AI integration.

## 🌟 Features

- **Automatic Failure Detection**: Cypress plugin captures test failures with full context
- **AI-Powered Suggestions**: Generates stable selector alternatives using heuristics + LLM
- **Visual Dashboard**: React-based UI for reviewing failures and managing suggestions  
- **Git Integration**: Automatically creates PRs with approved selector changes
- **Artifact Storage**: Screenshots, DOM snapshots, and logs stored in MongoDB
- **Docker Orchestration**: One-command setup with Docker Compose

## 🏗️ Architecture

```mermaid
flowchart TD
  A[Cypress Runner\n(test fails)] --> B[AutoHeal Cypress Plugin]
  B -->|POST /failures| C[AutoHeal API (Node/Express)]
  B -->|Artifacts: DOM HTML, logs, screenshot| C

  C --> D[Preprocessor\n(HTML parser, heuristics)]
  D --> E[AI Selector Advisor\n(LLM + rules)]
  E --> F[(MongoDB)]
  D --> F

  F --> G[AutoHeal UI (React)]
  G -->|Approve/Reject| H[PR Service\n(GitHub App/Bot)]
  H --> I[Repo\n(Page Objects / selectors map)]
  I --> J[CI Rerun]
  J --> A
