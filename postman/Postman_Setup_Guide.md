# AutoHeal API Testing with Postman - Complete Setup Guide

## Overview
This guide will help you set up Postman for testing the AutoHeal Test Automation System API from scratch. The system provides intelligent test failure analysis and automated selector suggestions using AI.

## Step 1: Install Postman

### Download and Install
1. Go to [postman.com](https://www.postman.com/downloads/)
2. Download Postman for your operating system
3. Install and create a free account (optional but recommended)

### Alternative: Use Postman Web
- Visit [web.postman.co](https://web.postman.co) to use the browser version

## Step 2: Import the AutoHeal API Collection

### Method 1: Import from File
1. Open Postman
2. Click **Import** button (top left)
3. Select **Upload Files**
4. Choose the `AutoHeal_API_Collection.json` file from this directory
5. Click **Import**

### Method 2: Import from URL (if hosted)
1. Click **Import** in Postman
2. Select **Link** tab
3. Paste the URL to the collection file
4. Click **Continue** → **Import**

## Step 3: Configure Environment Variables

### Create Environment
1. Click the **Environments** tab (left sidebar)
2. Click **Create Environment**
3. Name it "AutoHeal Local Development"
4. Add these variables:

| Variable Name | Current Value | Description |
|---------------|---------------|-------------|
| `base_url` | `http://localhost:5000` | API server base URL |
| `failure_id` | `1007` | Sample failure ID for testing |
| `suggestion_id` | `` | Leave empty (populated from responses) |

5. Click **Save**
6. Select this environment from the dropdown (top right)

## Step 4: Start Your AutoHeal Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm run start
```

The server should start on `http://localhost:5000`

## Step 5: Test the API

### Basic Health Check
1. Open the **Health Check** folder
2. Click **Health Status** request
3. Click **Send**
4. Verify you get a 200 response with status "ok"

### Test Workflow

#### 1. Get Existing Failures
- **Request**: `GET /api/failures`
- **Purpose**: View all test failures in the system
- **Expected**: List of failures with suggestion counts

#### 2. Get Specific Failure Details
- **Request**: `GET /api/failures/{{failure_id}}`
- **Purpose**: Get detailed failure information including suggestions
- **Expected**: Failure details with AI-generated suggestions

#### 3. Report New Failure
- **Request**: `POST /api/failures`
- **Purpose**: Submit a new test failure for analysis
- **Body**: JSON with failure details (see example in collection)
- **Expected**: 201 response with failure ID

#### 4. Approve/Reject Suggestions
- **Request**: `POST /api/approvals`
- **Purpose**: Approve or reject AI suggestions
- **Note**: Copy suggestion ID from previous responses
- **Expected**: 201 response, triggers PR creation if approved

## Step 6: Advanced Testing Scenarios

### File Upload Testing
1. Use **Report Failure with Screenshot** request
2. In Body → form-data, add a screenshot file
3. Test multipart/form-data handling

### Filter Testing
1. Use **Get Failures with Filters** request
2. Test different query parameters:
   - `?repo=specific-repo`
   - `?status=new`
   - `?limit=5`
   - `?since=2025-08-01T00:00:00Z`

### Error Handling
1. Try invalid failure IDs (404 errors)
2. Send malformed JSON (400 errors)
3. Test missing required fields

## Step 7: Postman Features to Use

### Tests Tab
Add test scripts to validate responses:

```javascript
// Test for successful response
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Test response structure
pm.test("Response has required fields", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('id');
    pm.expect(jsonData).to.have.property('status');
});

// Save response data for next requests
pm.test("Save failure ID", function () {
    var jsonData = pm.response.json();
    pm.environment.set("failure_id", jsonData.id);
});
```

### Pre-request Scripts
Add setup logic before requests:

```javascript
// Generate timestamp for unique test data
pm.environment.set("timestamp", new Date().toISOString());

// Set dynamic values
pm.environment.set("run_id", "test-" + Date.now());
```

### Collection Runner
1. Click **Collections** → **AutoHeal Test Automation API**
2. Click **Run collection**
3. Select requests to run
4. Configure iterations and delays
5. Click **Run AutoHeal Test...**

## Step 8: Common API Patterns

### Authentication (Future)
When authentication is added, modify requests:
```javascript
// In Pre-request Script
pm.request.headers.add({
    key: 'Authorization',
    value: 'Bearer ' + pm.environment.get('auth_token')
});
```

### Pagination
Test pagination with query parameters:
- `?limit=10&offset=0` (first page)
- `?limit=10&offset=10` (second page)

### Rate Limiting
Monitor response headers for rate limit information:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Step 9: Troubleshooting

### Common Issues

#### Connection Refused
- **Problem**: Can't connect to localhost:5000
- **Solution**: Ensure AutoHeal server is running (`npm run dev`)

#### 404 Not Found
- **Problem**: Endpoint not found
- **Solution**: Check API route exists in server/routes.ts

#### 400 Bad Request
- **Problem**: Invalid request data
- **Solution**: Verify JSON structure matches schema requirements

#### 500 Internal Server Error
- **Problem**: Server error
- **Solution**: Check server logs for error details

### Debug Tips
1. Enable Postman Console (View → Show Postman Console)
2. Check request/response details in console
3. Verify environment variables are set correctly
4. Use pre-request scripts to log values

## Step 10: Extending the Collection

### Add New Requests
1. Right-click folder → **Add Request**
2. Configure method, URL, headers, body
3. Add tests and documentation

### Create Test Suites
1. Group related requests in folders
2. Use Collection Runner for regression testing
3. Export results for CI/CD integration

### Share Collections
1. **Export** collection as JSON
2. Share file with team members
3. Or publish to Postman workspace

## API Reference Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/api/failures` | GET | List failures |
| `/api/failures/:id` | GET | Get failure details |
| `/api/failures` | POST | Report new failure |
| `/api/failures/:id/suggest` | POST | Regenerate suggestions |
| `/api/suggestions/:failureId` | GET | Get suggestions |
| `/api/approvals` | POST | Approve/reject suggestion |
| `/api/selectors` | GET | Get selector map |
| `/api/selectors/:page/:name` | PUT | Update selector |
| `/api/git/pr/:suggestionId/retry` | POST | Retry PR creation |
| `/api/screenshots/:filename` | GET | Download screenshot |

## Next Steps
1. Set up automated testing with Collection Runner
2. Integrate with CI/CD pipeline using Newman (Postman CLI)
3. Create documentation using Postman's documentation feature
4. Set up monitoring with Postman Monitoring

This setup provides comprehensive API testing capabilities for the AutoHeal system, covering all endpoints and common testing scenarios.