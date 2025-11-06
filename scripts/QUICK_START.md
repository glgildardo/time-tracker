# MongoDB Atlas Migration - Quick Reference

## What You Need

1. **MongoDB Atlas Account**: https://www.mongodb.com/cloud/atlas
2. **MongoDB Database Tools**: Install `mongodump`, `mongorestore`, and `mongosh`
   - macOS: `brew install mongodb-database-tools mongosh`
   - Linux/Windows: Download from MongoDB website

## Migration Process (5 Steps)

### Step 1: Set Up Atlas
Follow the guide in `scripts/MIGRATION_GUIDE.md` to:
- Create cluster
- Configure database user
- Set network access
- Get connection string

### Step 2: Export Local Data
```bash
cd scripts
./export-local-mongodb.sh
```
This creates a backup in `mongodb-dump/` directory.

### Step 3: Import to Atlas
```bash
cd scripts
ATLAS_URI="mongodb+srv://username:password@cluster.mongodb.net/time-tracker" ./import-to-atlas.sh
```
Replace with your actual Atlas connection string.

### Step 4: Verify Migration
```bash
cd scripts
ATLAS_URI="mongodb+srv://username:password@cluster.mongodb.net/time-tracker" ./verify-migration.sh
```

### Step 5: Update Configuration

**For Docker:**
```bash
cd docker
cp env.example .env
# Edit .env and set MONGODB_URI to your Atlas connection string
```

**For Standalone Backend:**
```bash
cd backend
cp env.example .env
# Edit .env and set MONGODB_URI to your Atlas connection string
```

## Connection String Format

**Atlas:**
```
mongodb+srv://username:password@cluster.mongodb.net/time-tracker?retryWrites=true&w=majority
```

**Local (Docker):**
```
mongodb://admin:password@mongodb:27017/time-tracker?authSource=admin
```

**Local (Standalone):**
```
mongodb://localhost:27017/time-tracker
```

## Testing

After migration, test your connection:
```bash
# Start backend
cd docker
docker-compose up backend

# Or standalone
cd backend
npm run dev
```

Look for: `✅ Connected to MongoDB successfully`

## Files Created

- `scripts/MIGRATION_GUIDE.md` - Detailed migration instructions
- `scripts/TESTING_GUIDE.md` - Testing and troubleshooting guide
- `scripts/export-local-mongodb.sh` - Export script
- `scripts/import-to-atlas.sh` - Import script
- `scripts/verify-migration.sh` - Verification script

## Files Updated

- `docker/env.example` - Updated with Atlas connection string examples
- `backend/env.example` - Updated with Atlas connection string examples
- `docker/docker-compose.yml` - Now supports `.env` file for MONGODB_URI
- `docker/docker-compose.dev.yml` - Now supports `.env` file for MONGODB_URI

## Need Help?

- See `scripts/MIGRATION_GUIDE.md` for detailed instructions
- See `scripts/TESTING_GUIDE.md` for testing and troubleshooting
- Check MongoDB Atlas documentation: https://docs.atlas.mongodb.com/

