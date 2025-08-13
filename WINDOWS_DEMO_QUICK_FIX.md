# Quick Windows Demo Fix

## DATABASE_URL Error Solution

The error occurs because the .env file isn't being loaded properly in Windows. Here are two solutions:

### Solution 1: Set Environment Variable Directly (Recommended for Demo)

```powershell
# Set the database URL for demo
$env:DATABASE_URL = "postgresql://demo:demo@localhost:5432/autoheal_demo"
$env:NODE_ENV = "development"
npx tsx server/index.ts
```

### Solution 2: Use In-Memory Demo Mode

Create this simple startup script:

```powershell
# demo-start.ps1
Write-Host "Starting AutoHeal Demo..." -ForegroundColor Green

# Set demo environment
$env:DATABASE_URL = "postgresql://demo:demo@localhost:5432/autoheal_demo"
$env:NODE_ENV = "development" 
$env:DEMO_MODE = "true"

# Start the application
npx tsx server/index.ts
```

Run with: `.\demo-start.ps1`

### Solution 3: Manual .env Setup

1. Ensure .env file exists in your project root
2. Add these lines to .env:

```env
DATABASE_URL=postgresql://demo:demo@localhost:5432/autoheal_demo
NODE_ENV=development
OPENAI_API_KEY=your_key_here
```

3. Then run:
```powershell
npx tsx server/index.ts
```

## Expected Demo Behavior

Once started, you should see:
- Server starts on port 5000
- Dashboard loads with sample data
- 3 test failures displayed
- AI suggestions available

This setup uses demo data and doesn't require a real PostgreSQL installation.