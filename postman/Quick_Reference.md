# AutoHeal API Quick Reference

## Import Files
1. **Collection**: `AutoHeal_API_Collection.json`
2. **Environment**: `AutoHeal_Local_Environment.json`

## Quick Start
1. Import both files into Postman
2. Select "AutoHeal Local Development" environment
3. Start server: `npm run dev`
4. Test health endpoint: `GET /health`

## Key Endpoints
- **Health**: `GET /health`
- **All Failures**: `GET /api/failures`
- **Specific Failure**: `GET /api/failures/1007`
- **Report Failure**: `POST /api/failures`
- **Approve Suggestion**: `POST /api/approvals`

## Environment Variables
- `{{base_url}}` - http://localhost:5000
- `{{failure_id}}` - 1007 (sample ID)
- `{{suggestion_id}}` - (populated from responses)

## Testing Workflow
1. Get failures → Get specific failure → Approve/reject suggestions
2. Report new failure → Check generated suggestions
3. Test file uploads with screenshot endpoint

## Common Status Codes
- 200: Success
- 201: Created
- 400: Bad Request (check JSON format)
- 404: Not Found (check IDs)
- 500: Server Error (check logs)