# Windows PowerShell Setup Script
Write-Host "🚀 AutoHeal Demo Setup" -ForegroundColor Green
Write-Host "Setting up your presentation environment..." -ForegroundColor White

# Create setup script
@'
# AutoHeal Windows Demo Setup
Write-Host "Starting AutoHeal Demo Setup..." -ForegroundColor Green

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js not found. Please install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js found: $(node --version)" -ForegroundColor Green

# Setup environment
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "📝 Created .env file - please add your OpenAI API key" -ForegroundColor Yellow
    notepad .env
    Read-Host "Press Enter after saving your API key in .env"
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
npm install

# Start application
Write-Host "🎯 Starting AutoHeal Dashboard..." -ForegroundColor Blue
Write-Host "Dashboard will be available at: http://localhost:5000" -ForegroundColor Cyan
npm run dev
'@ | Out-File -FilePath "setup-demo.ps1" -Encoding utf8