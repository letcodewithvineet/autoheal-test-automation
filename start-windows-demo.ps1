# AutoHeal Windows Demo Starter
Write-Host "Starting AutoHeal Demo..." -ForegroundColor Green

# Set environment variables for demo
$env:DATABASE_URL = "postgresql://demo:demo@localhost:5432/autoheal_demo"
$env:NODE_ENV = "development"
$env:OPENAI_API_KEY = "demo_key"

Write-Host "Dashboard will be available at: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow

# Start the application
npx tsx server/index.ts