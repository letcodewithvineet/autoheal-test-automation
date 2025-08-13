# AutoHeal Quick Start Checklist

## ✅ Pre-Demo Setup (5 minutes)

### Prerequisites
- [ ] Docker installed on demo machine
- [ ] OpenAI account with API access
- [ ] Downloaded `autoheal-deployment.zip`
- [ ] Browser ready (Chrome/Firefox recommended)

### Setup Commands
```bash
# 1. Extract project
unzip autoheal-deployment.zip
cd autoheal-deployment

# 2. Configure environment  
cp .env.example .env
# Edit .env and add: OPENAI_API_KEY=sk-your-key-here

# 3. Start system
docker-compose up -d

# 4. Wait 30 seconds, then verify
curl http://localhost:5000/api/failures
```

### Verification Points
- [ ] Dashboard loads at http://localhost:5000
- [ ] Shows 3 test failures
- [ ] Each failure shows status badges
- [ ] Click on failure opens detail panel

---

## 🎯 Demo Flow (20 minutes)

### **Slide 1: Problem Statement** (2 min)
**"Flaky test selectors cost development teams hours every week..."**
- [ ] Show statistics about test maintenance
- [ ] Explain selector brittleness issues
- [ ] Position AutoHeal as AI-powered solution

### **Slide 2: Dashboard Overview** (3 min)  
**Navigate to http://localhost:5000**
- [ ] Point out 3 active failures from different repos
- [ ] Show status progression: New → Suggested → Analyzing  
- [ ] Highlight real-time data: browser, time, paths
- [ ] Note failed selectors in red code blocks

### **Slide 3: AI Analysis** (5 min)
**Click first failure: "Login Tests"**
- [ ] Show error context and DOM analysis
- [ ] Highlight 3 ranked suggestions with confidence scores
- [ ] Explain heuristic vs AI-generated approaches
- [ ] Point out rationale for each suggestion

### **Slide 4: Approval Workflow** (5 min)
**Click "Approve" on top suggestion**  
- [ ] Show approval modal with suggestion details
- [ ] Add team review note about stability
- [ ] Confirm approval creates audit record
- [ ] Explain production GitHub PR creation

### **Slide 5: Technical Architecture** (3 min)
**Show terminal commands**
```bash
curl http://localhost:5000/api/failures
curl http://localhost:5000/api/failures/[ID]
```
- [ ] Explain PostgreSQL data model
- [ ] Show OpenAI integration with fallback
- [ ] Highlight GitHub PR automation
- [ ] Point out React real-time dashboard

### **Slide 6: Integration** (2 min)
**Show Cypress plugin**
```bash
cat packages/cypress-demo/cypress/support/autoheal.ts
```
- [ ] Demonstrate simple integration
- [ ] Show automatic failure capture
- [ ] Explain supported test frameworks

---

## 💡 Key Talking Points

### Value Proposition
- **Time Savings**: 30 min → 2 min per failure
- **Accuracy**: 95% confidence on stable selectors  
- **Scale**: Multi-repo, multi-team support
- **Learning**: AI improves over time

### Technical Highlights  
- **Modern Stack**: React, TypeScript, PostgreSQL
- **AI-Powered**: OpenAI GPT-4o with heuristic fallback
- **Production Ready**: Docker, environment configs
- **Extensible**: Plugin architecture

### Business Impact
- **Reduced Maintenance**: Fewer broken tests
- **Faster Delivery**: Less time fixing selectors  
- **Better Quality**: More stable test suites
- **Team Efficiency**: Automated suggestions vs manual fixes

---

## 🔧 Troubleshooting

### If Dashboard Doesn't Load
```bash
# Check if containers are running
docker-compose ps

# View logs
docker-compose logs app

# Restart if needed
docker-compose down && docker-compose up -d
```

### If No Failures Show
```bash
# Verify database
docker-compose exec db psql -U autoheal_user -d autoheal -c "SELECT COUNT(*) FROM failures;"

# Should return: 3

# Check API directly
curl http://localhost:5000/api/failures
```

### If AI Suggestions Fail
- [ ] Verify OpenAI API key in .env file
- [ ] Check OpenAI account has available quota
- [ ] System gracefully falls back to heuristic-only mode

---

## 📝 Demo Script Notes

### Opening
"Today I'll show you AutoHeal - our AI-powered solution that automatically fixes failing test selectors. Instead of spending 30 minutes manually debugging each failure, our system analyzes the issue and suggests better selectors in under 2 minutes."

### Transition Points
- **Dashboard → Detail**: "Let's see how our AI analyzes this specific failure..."
- **Analysis → Approval**: "Now watch how easy it is to approve and deploy fixes..."  
- **Workflow → Architecture**: "Behind the scenes, here's the technology powering this..."

### Closing
"AutoHeal transforms test maintenance from a manual, time-consuming process into an automated, intelligent workflow. Teams using AutoHeal report 90% reduction in selector-related test failures and significantly faster delivery cycles."

---

## 🎪 Advanced Demo Options

### Live AI Generation
```bash
# Regenerate suggestions for demo
curl -X POST http://localhost:5000/api/failures/6cb69ba6-17d8-4fa0-8a56-572611a1e55f/suggest
```

### Database Deep Dive
```bash
# Show approval audit trail
docker-compose exec db psql -U autoheal_user -d autoheal -c "
SELECT a.decision, a.\"approvedBy\", a.notes, f.test 
FROM approvals a 
JOIN suggestions s ON a.\"suggestionId\" = s.id
JOIN failures f ON s.\"failureId\" = f.id;"
```

### Export Feature
- [ ] Click "Export Data" in failure detail
- [ ] Show JSON export with full context
- [ ] Explain debugging capabilities