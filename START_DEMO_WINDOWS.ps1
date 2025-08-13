# AutoHeal Demo Startup Script for Windows
Write-Host "🚀 Starting AutoHeal Demo" -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Check environment file
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating environment file..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "⚠️  Please add your OpenAI API key to .env file" -ForegroundColor Red
    notepad .env
    Read-Host "Press Enter after adding your API key"
}

# Set environment and start
Write-Host "🎯 Starting AutoHeal Dashboard..." -ForegroundColor Blue
Write-Host "Dashboard will be available at: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow

$env:NODE_ENV = "development"
tsx server/index.ts