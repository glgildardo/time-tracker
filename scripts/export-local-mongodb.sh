#!/bin/bash

# MongoDB Export Script
# Exports data from local Docker MongoDB container to Atlas

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
CONTAINER_NAME="time-tracker-mongodb-dev"
DB_NAME="time-tracker"
DB_USER="admin"
DB_PASSWORD="password"
DUMP_DIR="./mongodb-dump"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${DUMP_DIR}/${TIMESTAMP}"

echo -e "${GREEN}=== MongoDB Local Export Script ===${NC}\n"

# Check if mongodump is installed
if ! command -v mongodump &> /dev/null; then
    echo -e "${RED}Error: mongodump is not installed${NC}"
    echo "Please install MongoDB Database Tools:"
    echo "  macOS: brew install mongodb-database-tools"
    echo "  Linux: Download from https://www.mongodb.com/try/download/database-tools"
    exit 1
fi

# Check if Docker container is running
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${YELLOW}Warning: Container '$CONTAINER_NAME' is not running${NC}"
    echo "Attempting to start container..."
    
    # Try to start the container
    cd "$(dirname "$0")/../docker" || exit 1
    docker-compose up -d mongodb
    sleep 5
    
    if ! docker ps | grep -q "$CONTAINER_NAME"; then
        echo -e "${RED}Error: Could not start MongoDB container${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ MongoDB container is running${NC}"

# Create dump directory
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}✓ Created backup directory: $BACKUP_DIR${NC}"

# Export database
echo -e "\n${YELLOW}Exporting database '$DB_NAME'...${NC}"

mongodump \
    --host=localhost:27017 \
    --username="$DB_USER" \
    --password="$DB_PASSWORD" \
    --authenticationDatabase=admin \
    --db="$DB_NAME" \
    --out="$BACKUP_DIR" \
    --gzip

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Export completed successfully${NC}"
    
    # List exported collections
    echo -e "\n${GREEN}Exported collections:${NC}"
    if [ -d "$BACKUP_DIR/$DB_NAME" ]; then
        ls -lh "$BACKUP_DIR/$DB_NAME" | grep -E '\.bson\.gz$' | awk '{print "  - " $9}'
    fi
    
    # Create a symlink to latest dump
    LATEST_LINK="${DUMP_DIR}/latest"
    rm -f "$LATEST_LINK"
    ln -s "$TIMESTAMP" "$LATEST_LINK"
    echo -e "\n${GREEN}✓ Latest dump linked to: $LATEST_LINK${NC}"
    
    echo -e "\n${GREEN}=== Export Summary ===${NC}"
    echo "Backup location: $BACKUP_DIR"
    echo "Database: $DB_NAME"
    echo "Timestamp: $TIMESTAMP"
    echo -e "\n${GREEN}Next step: Run ./scripts/import-to-atlas.sh to import to Atlas${NC}"
else
    echo -e "${RED}✗ Export failed${NC}"
    exit 1
fi

