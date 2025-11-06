# MongoDB Atlas Migration Guide

## Prerequisites

Before starting the migration, ensure you have:

1. **MongoDB Atlas Account**: Sign up at https://www.mongodb.com/cloud/atlas
2. **MongoDB Tools**: Install MongoDB Database Tools on your local machine
   - macOS: `brew install mongodb-database-tools`
   - Linux: Download from https://www.mongodb.com/try/download/database-tools
   - Windows: Download installer from MongoDB website
3. **Docker**: Ensure your local MongoDB container is running

## Step 1: Set Up MongoDB Atlas Cluster

### 1.1 Create a Cluster
1. Log in to MongoDB Atlas (https://cloud.mongodb.com)
2. Click "Build a Database"
3. Choose a free M0 cluster (or paid tier for production)
4. Select your preferred cloud provider and region
5. Click "Create"

### 1.2 Configure Database Access
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create a username and strong password (save these!)
5. Set user privileges to "Atlas admin" or "Read and write to any database"
6. Click "Add User"

### 1.3 Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - **Note**: For production, add only specific IP addresses
4. Click "Confirm"

### 1.4 Get Connection String
1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" and version "5.5 or later"
5. Copy the connection string
6. Replace `<password>` with your database user password
7. Replace `<database>` with `timeTracker` (or your preferred database name)

Example format:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/time-tracker?retryWrites=true&w=majority
```

## Step 2: Export Data from Local MongoDB

Run the export script:

```bash
./scripts/export-local-mongodb.sh
```

This will:
- Export all collections from the local Docker MongoDB
- Save the dump to `./mongodb-dump/` directory
- Preserve indexes and data structure

## Step 3: Import Data to Atlas

1. Update the connection string in `scripts/import-to-atlas.sh`:
   ```bash
   # Edit the file and set your Atlas connection string
   ATLAS_URI="mongodb+srv://glgildardo_db_user:<PASSWORD>@cluster0.ynwvuul.mongodb.net/timeTracker?appName=Cluster0"
   ```

2. Run the import script:
   ```bash
   ./scripts/import-to-atlas.sh
   ```

## Step 4: Update Application Configuration

1. Create a `.env` file in the `backend/` directory:
   ```bash
   cp backend/env.example backend/.env
   ```

2. Update `MONGODB_URI` in `backend/.env` with your Atlas connection string

3. If using Docker, update environment variables in docker-compose files or create a `.env` file in the `docker/` directory

## Step 5: Verify Migration

Run the verification script:

```bash
./scripts/verify-migration.sh
```

This will:
- Connect to both local and Atlas databases
- Compare collection counts
- Verify data integrity

## Step 6: Test Application

1. Start your backend application
2. Verify it connects to Atlas successfully
3. Test CRUD operations
4. Verify all data is accessible

## Troubleshooting

### Connection Issues
- Verify your IP is whitelisted in Atlas Network Access
- Check username/password are correct
- Ensure connection string format is correct (use `mongodb+srv://` for Atlas)

### Import Errors
- Ensure you have sufficient permissions on Atlas
- Check database name matches in connection string
- Verify dump files exist in `./mongodb-dump/` directory

### Data Verification Failures
- Compare collection names manually
- Check for any data type mismatches
- Verify indexes were created correctly

## Rollback Plan

If you need to rollback:
1. Keep the local MongoDB container running
2. Revert `MONGODB_URI` in `.env` files to local connection string
3. Restart your application
4. The local database remains unchanged

## Next Steps

After successful migration:
- Consider removing local MongoDB from docker-compose if not needed for development
- Set up automated backups in Atlas
- Configure monitoring and alerts in Atlas dashboard
- Update team documentation with new connection details

