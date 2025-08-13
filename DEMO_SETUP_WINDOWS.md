# AutoHeal Demo Setup - Windows PowerShell

## 🚨 Fix for Your Docker Error

The error you encountered happens because:
1. Environment variables (OPENAI_API_KEY) weren't set
2. Docker tried to use wrong project name "promptforge"
3. Deprecated docker-compose version field

## ✅ BETTER SOLUTION: Local Development Setup

For team demos, local setup is actually better than Docker because:
- **Faster startup** (no container building time)
- **Easier debugging** and log viewing
- **Better performance** for presentations
- **Direct file access** for showing code

---

## 📋 Step-by-Step Windows Setup

### Step 1: Prerequisites Check
```powershell
# Check if Node.js is installed
node --version
# Should show v18.x.x or higher

# If not installed, download from: https://nodejs.org/
```

### Step 2: Extract and Navigate
```powershell
# Extract autoheal-deployment.zip
# Open PowerShell in that folder
cd "D:\AI-Contest\My_Project\autoheal-deployment"
```

### Step 3: Install Dependencies
```powershell
# Install all packages (takes ~2 minutes)
npm install
```

### Step 4: Environment Configuration
```powershell
# Copy environment template
Copy-Item .env.example .env

# Edit .env file and add your OpenAI API key
notepad .env
```

**Add this to your .env file:**
```env
# Database Configuration (uses in-memory for demo)
DATABASE_URL=postgresql://user:password@localhost:5432/autoheal
PGHOST=localhost
PGPORT=5432
PGUSER=autoheal_user
PGPASSWORD=password
PGDATABASE=autoheal

# OpenAI Configuration - REQUIRED
OPENAI_API_KEY=sk-your-actual-key-here

# Application Configuration  
NODE_ENV=development
PORT=5000
```

### Step 5: Setup Database
```powershell
# Push database schema (creates sample data)
npm run db:push
```

### Step 6: Start Demo
```powershell
# Start the development server
npm run dev
```

**You should see:**
```
> rest-express@1.0.0 dev
> NODE_ENV=development tsx server/index.ts
6:00:00 PM [express] serving on port 5000
```

### Step 7: Verify Demo
1. Open browser: `http://localhost:5000`
2. You should see **3 test failures** displayed
3. Click on any failure to see AI suggestions

---

## 🎯 Demo Verification Checklist

Before your team presentation, verify:

- [ ] Dashboard loads at http://localhost:5000
- [ ] Shows "Recent Failures" with 3 items
- [ ] Each failure has status badges (New/Suggested/Analyzing)
- [ ] Clicking failure opens right panel with details
- [ ] AI suggestions show with confidence scores
- [ ] Approval workflow opens modal when clicking "Approve"

---

## 🚀 Quick Demo Commands

**For live demonstration during presentation:**

```powershell
# Show API is working
curl http://localhost:5000/api/failures

# Show specific failure details
curl "http://localhost:5000/api/failures/f273418c-55fb-4477-a0c5-5370a7de8500"

# Generate new AI suggestions (if OpenAI key works)
curl -X POST "http://localhost:5000/api/failures/6cb69ba6-17d8-4fa0-8a56-572611a1e55f/suggest"
```

---

## 🔧 Troubleshooting

### If Dashboard Shows "Failed to Load Failures"
```powershell
# Check if database is initialized
npm run db:push
# Restart server
```

### If AI Suggestions Don't Work
- Verify OpenAI API key is correct in .env
- Check you have available quota at platform.openai.com
- System will fall back to heuristic-only suggestions

### If Port 5000 is Busy
```powershell
# Kill any process using port 5000
netstat -ano | findstr :5000
# Note the PID and kill it
taskkill /PID [PID_NUMBER] /F
```

---

## 📊 Expected Demo Results

After successful setup, your demo will show:

- **Dashboard**: 3 test failures from different repositories
- **AI Analysis**: Ranked selector suggestions with 65-95% confidence
- **Approval Workflow**: Complete audit trail with user notes
- **Real-time Updates**: Live failure monitoring and status changes

**Key Demo Points:**
- Login test failure → data-testid suggestion (95% confidence)
- E-commerce selector → semantic class alternatives  
- API dashboard → accessibility-focused suggestions

This setup gives you a fully functional AutoHeal system for your team presentation without Docker complexity!

---

## 💡 Demo Tips

1. **Start with problem**: Show how flaky selectors waste developer time
2. **Live interaction**: Click through actual failures and suggestions
3. **Show confidence scores**: Highlight AI accuracy with 95% data-testid recommendations
4. **Approval workflow**: Demonstrate enterprise audit requirements
5. **Technical depth**: Show API responses and database structure if audience is technical

Your team will see a complete, working system that demonstrates the value of AI-powered test automation!