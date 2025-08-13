# Step-by-Step GitHub Deployment Guide

## Step 1: Download the Project Files

1. **Download the deployment package** from this Replit workspace:
   - Look for `autoheal-deployment.zip` in the file explorer
   - Click download or right-click and "Save As"

## Step 2: Create GitHub Repository

1. **Go to GitHub**: https://github.com/letcodewithvineet
2. **Click "New"** (green button) to create a new repository
3. **Repository name**: `autoheal`
4. **Description**: `Self-healing test automation system with AI-powered selector analysis`
5. **Visibility**: Choose Public or Private
6. **Do NOT** initialize with README, .gitignore, or license (we already have these)
7. **Click "Create repository"**

## Step 3: Upload Files to GitHub

### Option A: Using GitHub Web Interface (Easiest)

1. **Extract** the zip file on your computer
2. **Go to your new repository** on GitHub
3. **Click "uploading an existing file"** link
4. **Drag and drop** all files from the extracted folder
5. **Commit message**: "Initial commit: AutoHeal self-healing test automation system"
6. **Click "Commit changes"**

### Option B: Using Git Commands (If you have Git installed)

```bash
# Extract the zip file
unzip autoheal-deployment.zip
cd autoheal-deployment

# Initialize and push to GitHub
git init
git add .
git commit -m "Initial commit: AutoHeal self-healing test automation system"
git branch -M main
git remote add origin https://github.com/letcodewithvineet/autoheal.git
git push -u origin main
```

## Step 4: Set up Environment Variables

1. **In your repository**, create a `.env` file (or rename `.env.example`)
2. **Add these required variables**:

```env
# Database Configuration
DATABASE_URL=postgresql://autoheal_user:autoheal_password@db:5432/autoheal

# OpenAI Configuration (Required for AI suggestions)
OPENAI_API_KEY=your_openai_api_key_here

# GitHub Integration (Optional)  
GITHUB_TOKEN=your_github_token_here

# Application Configuration
NODE_ENV=production
PORT=5000
```

## Step 5: Get Required API Keys

### OpenAI API Key (Required)
1. **Visit**: https://platform.openai.com/api-keys
2. **Sign up or log in**
3. **Click "Create new secret key"**
4. **Copy the key** and add it to your `.env` file

### GitHub Token (Optional, for auto PR creation)
1. **Go to**: GitHub Settings → Developer settings → Personal access tokens
2. **Generate new token** with `repo` permissions
3. **Copy the token** and add it to your `.env` file

## Step 6: Deploy the Application

### Using Docker (Recommended)

```bash
# Clone your repository
git clone https://github.com/letcodewithvineet/autoheal.git
cd autoheal

# Create environment file
cp .env.example .env
# Edit .env with your actual API keys

# Start with Docker
docker-compose up -d
```

### Using Local Development

```bash
# Clone your repository
git clone https://github.com/letcodewithvineet/autoheal.git
cd autoheal

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your actual API keys

# Set up database
npm run db:push

# Start development server
npm run dev
```

## Step 7: Verify Everything Works

1. **Open**: http://localhost:5000
2. **Check dashboard** loads with sample failures
3. **Test AI suggestions** by clicking on any failure
4. **Try approving** a suggestion to test the workflow

## Step 8: Share Your Repository

Your AutoHeal system will be available at:
`https://github.com/letcodewithvineet/autoheal`

## Next Steps

1. **Integrate with your Cypress tests** using the included plugin
2. **Configure GitHub integration** for automatic PR creation
3. **Customize AI suggestion rules** based on your needs
4. **Monitor test failure patterns** through the dashboard

## Need Help?

If you run into any issues:
1. Check the `README.md` for detailed documentation
2. Review the `DEPLOYMENT.md` for troubleshooting
3. The system includes sample data to verify everything works
4. All environment variables are documented in `.env.example`