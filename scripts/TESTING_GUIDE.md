# Testing MongoDB Atlas Connection

This document provides instructions for testing your MongoDB Atlas connection after migration.

## Prerequisites

- MongoDB Atlas cluster is set up
- Data has been migrated to Atlas
- Connection string is configured in your `.env` files

## Testing Steps

### 1. Test Backend Connection

#### Option A: Using Docker

1. Ensure your `docker/.env` file has the Atlas connection string:
   ```bash
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/time-tracker
   ```

2. Start the backend service:
   ```bash
   cd docker
   docker-compose up backend
   ```

3. Check the logs for connection success:
   ```
   ✅ Connected to MongoDB successfully
   ```

#### Option B: Using Standalone Backend

1. Ensure your `backend/.env` file has the Atlas connection string:
   ```bash
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/time-tracker
   ```

2. Start the backend:
   ```bash
   cd backend
   npm run dev
   ```

3. Check the console for connection success:
   ```
   ✅ Connected to MongoDB successfully
   ```

### 2. Verify Data Integrity

Run the verification script:

```bash
cd scripts
ATLAS_URI="mongodb+srv://username:password@cluster.mongodb.net/time-tracker" ./verify-migration.sh
```

This will compare collection counts between local and Atlas databases.

### 3. Test API Endpoints

Once the backend is running, test your API endpoints:

```bash
# Health check
curl http://localhost:3001/health

# Test authentication (if you have users)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}'

# Test protected endpoints (with auth token)
curl http://localhost:3001/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Check MongoDB Atlas Dashboard

1. Log in to MongoDB Atlas: https://cloud.mongodb.com
2. Navigate to your cluster → Collections
3. Verify all collections are present:
   - users
   - projects
   - tasks
   - tasksessions
   - timeentries
4. Check document counts match your local database

### 5. Monitor Connection

Watch for any connection errors in:
- Backend logs
- MongoDB Atlas → Monitoring → Real-Time Performance Panel
- Atlas → Alerts (if configured)

## Common Issues

### Connection Timeout

**Problem**: Backend can't connect to Atlas

**Solutions**:
- Verify IP address is whitelisted in Atlas Network Access
- Check connection string format (should start with `mongodb+srv://`)
- Verify username and password are correct
- Check if your network allows outbound connections to MongoDB

### Authentication Failed

**Problem**: Authentication error when connecting

**Solutions**:
- Verify database user exists in Atlas
- Check username and password in connection string
- Ensure user has read/write permissions
- Verify database name in connection string matches Atlas database

### Data Missing

**Problem**: Collections or documents are missing

**Solutions**:
- Re-run import script: `./scripts/import-to-atlas.sh`
- Check import logs for errors
- Verify dump files exist in `mongodb-dump/` directory
- Compare collection counts using verification script

### SSL/TLS Errors

**Problem**: SSL connection errors

**Solutions**:
- Ensure connection string uses `mongodb+srv://` (not `mongodb://`)
- Check if your network allows SSL connections
- Verify Atlas cluster is accessible from your network

## Success Criteria

✅ Backend connects to Atlas without errors  
✅ All collections are present in Atlas  
✅ Document counts match between local and Atlas  
✅ API endpoints respond correctly  
✅ CRUD operations work as expected  
✅ No connection errors in logs  

## Next Steps

After successful testing:

1. **Update production configuration** with Atlas connection string
2. **Set up Atlas backups** (if not already configured)
3. **Configure monitoring and alerts** in Atlas dashboard
4. **Update team documentation** with new connection details
5. **Consider removing local MongoDB** from docker-compose if not needed for development

