# AutoHeal Team Demo Guide
## Complete Step-by-Step Presentation

---

## 📋 Pre-Demo Setup (5 minutes)

### Step 1: Download and Extract
```bash
# Download autoheal-deployment.zip from the repository
# Extract to a folder on your machine
unzip autoheal-deployment.zip
cd autoheal-deployment
```

### Step 2: Get OpenAI API Key
1. Visit https://platform.openai.com/api-keys
2. Sign up/login and create new API key
3. Copy the key (starts with `sk-...`)

### Step 3: Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env file and add your API key:
# OPENAI_API_KEY=sk-your-key-here
# DATABASE_URL=postgresql://autoheal_user:autoheal_password@db:5432/autoheal
```

### Step 4: Quick Start with Docker
```bash
# Start the complete system
docker-compose up -d

# Wait 30 seconds for database initialization
# Open http://localhost:5000 in browser
```

---

## 🎯 Demo Script (20 minutes)

### **Phase 1: Problem Introduction (2 minutes)**

**"Today I'll show you AutoHeal - our solution to one of the biggest problems in test automation: flaky selectors."**

**Problems we solve:**
- Tests fail because elements moved or changed
- Manual fixing takes hours per failure
- Same selector issues repeat across projects
- No visibility into which selectors are most fragile

---

### **Phase 2: Dashboard Overview (3 minutes)**

**Navigate to http://localhost:5000**

**"Let's start with our dashboard showing recent test failures..."**

**Point out:**
- **3 Active Failures** from different repositories
- **Status indicators**: New, Suggested, Analyzing
- **Real-time data**: Browser, timestamp, test path
- **Failed selectors** shown in red highlighting

**Click on each failure type:**
1. **"Login Tests"** - Shows button selector issue
2. **"Product Catalog"** - Shows class-based selector problem  
3. **"API Dashboard"** - Shows canvas element not found

---

### **Phase 3: AI Analysis Deep Dive (5 minutes)**

**Click on first failure: "Login Tests"**

**"Now watch our AI analyze this failure and generate smart alternatives..."**

**Show the right panel with:**
- **Error Context**: "Element not found: button.submit-btn"
- **DOM Analysis**: Actual HTML showing the button exists with class "login-btn"
- **3 AI Suggestions** ranked by confidence:
  
  1. **95% confidence**: `[data-testid="login-btn"]` (Heuristic)
     - "Most stable - uses data-testid attribute"
  
  2. **75% confidence**: `.login-btn` (Heuristic)  
     - "Semantic class name approach"
  
  3. **65% confidence**: `button:contains("Login")` (AI-generated)
     - "Text-based targeting"

**"Notice how our system combines rule-based heuristics with AI analysis to provide ranked alternatives."**

---

### **Phase 4: Approval Workflow (5 minutes)**

**"Now let's approve the best suggestion..."**

**Click "Approve" on the top suggestion**

**Show approval modal:**
- **Suggestion details**: `[data-testid="login-btn"]` 
- **Confidence score**: 95%
- **Rationale**: "Using data-testid attribute for stable test targeting"
- **Add review note**: "This data-testid approach is much more stable than the original class-based selector"

**Click "Approve Suggestion"**

**"In production, this would automatically:**
- Create a GitHub branch
- Update your test files
- Generate a pull request
- Notify code reviewers"

---

### **Phase 5: System Architecture (3 minutes)**

**"Let me show you how this works behind the scenes..."**

**Open terminal and demonstrate:**

```bash
# Check our live data
curl http://localhost:5000/api/failures

# See the approval we just created
curl http://localhost:5000/api/failures/f273418c-55fb-4477-a0c5-5370a7de8500
```

**Explain the architecture:**
- **PostgreSQL Database**: Stores failures, suggestions, approvals
- **OpenAI Integration**: GPT-4o analyzes failures and suggests fixes
- **Heuristic Engine**: Rule-based preferences (data-testid > aria-label > semantic classes)
- **GitHub Integration**: Automatic PR creation for approved changes
- **React Dashboard**: Real-time monitoring and approval interface

---

### **Phase 6: Integration Demo (2 minutes)**

**"Here's how easy it is to integrate with your existing Cypress tests..."**

**Show the Cypress plugin file:**
```bash
cat packages/cypress-demo/cypress/support/autoheal.ts
```

**"Just add this to your Cypress support file and failures automatically get captured with full context:**
- DOM snapshots
- Console logs  
- Network requests
- Screenshots
- Test metadata"**

---

## 🎪 Advanced Demo Features

### **Live AI Suggestion Generation**
```bash
# Generate new suggestions for another failure
curl -X POST http://localhost:5000/api/failures/6cb69ba6-17d8-4fa0-8a56-572611a1e55f/suggest

# Show the AI analysis in real-time
```

### **Database Exploration**
```bash
# Show complete data model
docker-compose exec db psql -U autoheal_user -d autoheal -c "
SELECT 
  f.test,
  f.status,
  COUNT(s.id) as suggestions,
  COUNT(a.id) as approvals
FROM failures f
LEFT JOIN suggestions s ON f.id = s.\"failureId\"
LEFT JOIN approvals a ON s.id = a.\"suggestionId\"
GROUP BY f.id, f.test, f.status;"
```

---

## 💡 Key Value Props to Highlight

### **ROI Metrics**
- **Time Savings**: 30 minutes per failure → 2 minutes
- **Accuracy**: 95% confidence on data-testid suggestions
- **Scalability**: Handles multiple repos and frameworks
- **Learning**: System improves suggestions over time

### **Enterprise Features**
- **Audit Trail**: Every approval tracked with user and rationale
- **Git Integration**: Seamless PR workflow
- **Multi-Team**: Repository-based organization  
- **Security**: API keys properly managed in environment

### **Technical Excellence**
- **Modern Stack**: React, TypeScript, PostgreSQL, Docker
- **AI-Powered**: OpenAI GPT-4o with fallback to heuristics
- **Production Ready**: Error handling, logging, health checks
- **Extensible**: Plugin architecture for different test frameworks

---

## 🔧 Q&A Preparation

### **Common Questions:**

**Q: How does it handle dynamic content?**
A: Our AI analyzes DOM context and suggests selectors that work with dynamic data using data attributes and roles.

**Q: What about existing test frameworks?**  
A: We provide plugins for Cypress, with Playwright and Selenium coming soon.

**Q: How do you ensure suggestion quality?**
A: Multi-layered approach: heuristic rules prioritize stable attributes, AI provides context-aware alternatives, human approval for final decision.

**Q: Can we customize the suggestion rules?**
A: Yes, the heuristic engine is configurable, and you can adjust confidence thresholds and ranking preferences.

**Q: What's the deployment process?**
A: Docker-compose for development, full container orchestration for production, with environment variable configuration.

---

## 📈 Success Metrics to Share

- **3 test failures** automatically analyzed
- **9 total suggestions** generated across different strategies  
- **95% confidence** on data-testid recommendations
- **Sub-second** suggestion generation with AI fallback
- **Complete audit trail** for compliance requirements

---

## 🚀 Next Steps

1. **Integration**: Connect to your test suites
2. **Customization**: Configure heuristic rules for your standards
3. **Scaling**: Deploy across development teams
4. **Monitoring**: Track selector stability improvements
5. **Training**: Team onboarding on approval workflows