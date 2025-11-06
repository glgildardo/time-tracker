# MongoDB Atlas Migration

This directory contains scripts and documentation for migrating your local MongoDB database to MongoDB Atlas.

## Quick Start

1. **Set up MongoDB Atlas** (see `MIGRATION_GUIDE.md` for detailed instructions)
2. **Export local data**: `./scripts/export-local-mongodb.sh`
3. **Import to Atlas**: `ATLAS_URI="your-connection-string" ./scripts/import-to-atlas.sh`
4. **Verify migration**: `ATLAS_URI="your-connection-string" ./scripts/verify-migration.sh`
5. **Update configuration**: Set `MONGODB_URI` in your `.env` files

## Files

- `MIGRATION_GUIDE.md` - Complete step-by-step migration guide
- `export-local-mongodb.sh` - Export script for local MongoDB
- `import-to-atlas.sh` - Import script for MongoDB Atlas
- `verify-migration.sh` - Verification script to compare local and Atlas data

## Configuration

After migration, update your connection strings:

### For Docker (docker-compose)

1. Create `docker/.env` file:
   ```bash
   cp docker/env.example docker/.env
   ```

2. Update `MONGODB_URI` in `docker/.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/time-tracker?retryWrites=true&w=majority
   ```

3. Optional: If using Atlas, you can comment out the `mongodb` service in docker-compose files and remove `depends_on: - mongodb` from the backend service.

### For Backend (standalone)

1. Create `backend/.env` file:
   ```bash
   cp backend/env.example backend/.env
   ```

2. Update `MONGODB_URI` in `backend/.env` with your Atlas connection string.

## Prerequisites

- MongoDB Database Tools installed (`mongodump`, `mongorestore`, `mongosh`)
- Docker (if using local MongoDB)
- MongoDB Atlas account and cluster

## Troubleshooting

See `MIGRATION_GUIDE.md` for troubleshooting tips.

