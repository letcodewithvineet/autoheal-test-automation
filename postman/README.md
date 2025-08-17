# AutoHeal API Testing with Postman

## What You Get
Complete Postman setup for testing the AutoHeal Test Automation System API, including:

- ✅ **Complete API Collection** - All endpoints with examples
- ✅ **Environment Configuration** - Pre-configured variables  
- ✅ **Detailed Setup Guide** - Step-by-step instructions
- ✅ **Sample Test Data** - Ready-to-use request examples
- ✅ **Quick Reference** - Cheat sheet for common tasks

## Files Included

| File | Purpose |
|------|---------|
| `AutoHeal_API_Collection.json` | Main Postman collection with all API endpoints |
| `AutoHeal_Local_Environment.json` | Environment variables for local development |
| `Postman_Setup_Guide.md` | Complete setup instructions from scratch |
| `Quick_Reference.md` | Quick reference for common tasks |
| `sample_test_data.json` | Example request payloads |

## Quick Start (2 Minutes)

1. **Install Postman** - Download from [postman.com](https://www.postman.com/downloads/)

2. **Import Collection** 
   - Open Postman → Click **Import**
   - Select `AutoHeal_API_Collection.json`

3. **Import Environment**
   - Click **Import** again  
   - Select `AutoHeal_Local_Environment.json`
   - Choose environment from dropdown (top right)

4. **Start Server**
   ```bash
   npm run dev
   ```

5. **Test Connection**
   - Open **Health Check** → **Health Status**
   - Click **Send** → Should get 200 response

## API Endpoints Overview

### Core Testing Flow
```
1. GET /api/failures          → View all test failures
2. GET /api/failures/:id      → Get specific failure details  
3. POST /api/failures         → Report new test failure
4. POST /api/approvals        → Approve/reject AI suggestions
5. POST /api/git/pr/:id/retry → Create pull request
```

### Complete Endpoint List
- **Health**: `/health` - Server status
- **Failures**: `/api/failures` - Test failure management
- **Suggestions**: `/api/suggestions` - AI-generated fixes
- **Approvals**: `/api/approvals` - Approval workflow
- **Selectors**: `/api/selectors` - Selector management
- **Git**: `/api/git/pr` - GitHub integration
- **Screenshots**: `/api/screenshots` - File uploads

## Testing Scenarios

### Basic API Testing
1. Health check
2. Get existing failures
3. View failure details with suggestions

### Full Workflow Testing
1. Report new test failure
2. Review AI-generated suggestions
3. Approve suggestion
4. Verify pull request creation

### Advanced Features
1. File upload with screenshots
2. Filtering and pagination
3. Error handling validation
4. Rate limiting tests

## Environment Variables

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `base_url` | `http://localhost:5000` | API server URL |
| `failure_id` | `1007` | Sample failure ID |
| `suggestion_id` | _(auto-populated)_ | From API responses |
| `repo_name` | `acme-corp/web-app` | Sample repository |
| `approver_email` | `developer@company.com` | For approvals |

## Need Help?

### Common Issues
- **Connection failed**: Ensure server is running (`npm run dev`)
- **404 errors**: Check endpoint URLs in collection
- **400 errors**: Verify JSON request format

### Detailed Guide
See `Postman_Setup_Guide.md` for comprehensive instructions including:
- Complete Postman installation
- Advanced testing scenarios  
- Error troubleshooting
- Team collaboration setup

### Sample Data
Check `sample_test_data.json` for example request payloads you can copy into Postman.

---

**Ready to test?** Import the collection and start exploring the AutoHeal API!