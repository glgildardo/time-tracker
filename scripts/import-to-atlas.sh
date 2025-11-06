#!/bin/bash

# MongoDB Import Script
# Imports data from local dump to MongoDB Atlas

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration - UPDATE THIS WITH YOUR ATLAS CONNECTION STRING
ATLAS_URI="${ATLAS_URI:-}"
DB_NAME="time-tracker"
DUMP_DIR="./mongodb-dump"
LATEST_DUMP="${DUMP_DIR}/latest"

echo -e "${GREEN}=== MongoDB Atlas Import Script ===${NC}\n"

# Check if mongorestore is installed
if ! command -v mongorestore &> /dev/null; then
    echo -e "${RED}Error: mongorestore is not installed${NC}"
    echo "Please install MongoDB Database Tools:"
    echo "  macOS: brew install mongodb-database-tools"
    echo "  Linux: Download from https://www.mongodb.com/try/download/database-tools"
    exit 1
fi

# Check if ATLAS_URI is provided
if [ -z "$ATLAS_URI" ]; then
    echo -e "${YELLOW}ATLAS_URI environment variable not set${NC}"
    echo "Please provide your Atlas connection string:"
    echo ""
    echo "Format: mongodb+srv://username:password@cluster.mongodb.net/database"
    echo ""
    read -p "Enter your Atlas connection string: " ATLAS_URI
    
    if [ -z "$ATLAS_URI" ]; then
        echo -e "${RED}Error: Atlas connection string is required${NC}"
        exit 1
    fi
fi

# Validate connection string format
if [[ ! "$ATLAS_URI" =~ ^mongodb\+srv:// ]]; then
    echo -e "${RED}Error: Invalid Atlas connection string format${NC}"
    echo "Expected format: mongodb+srv://username:password@cluster.mongodb.net/database"
    exit 1
fi

# Check if dump directory exists
if [ ! -d "$LATEST_DUMP" ] && [ ! -d "$DUMP_DIR" ]; then
    echo -e "${RED}Error: No dump directory found${NC}"
    echo "Please run ./scripts/export-local-mongodb.sh first"
    exit 1
fi

# Determine which dump to use
if [ -d "$LATEST_DUMP" ]; then
    DUMP_PATH="$LATEST_DUMP/$DB_NAME"
    echo -e "${GREEN}✓ Using latest dump: $LATEST_DUMP${NC}"
else
    # Find the most recent dump
    LATEST_TIMESTAMP=$(ls -t "$DUMP_DIR" | head -n 1)
    DUMP_PATH="$DUMP_DIR/$LATEST_TIMESTAMP/$DB_NAME"
    echo -e "${GREEN}✓ Using dump: $DUMP_PATH${NC}"
fi

if [ ! -d "$DUMP_PATH" ]; then
    echo -e "${RED}Error: Dump directory not found: $DUMP_PATH${NC}"
    echo "Please run ./scripts/export-local-mongodb.sh first"
    exit 1
fi

# Confirm before proceeding
echo -e "\n${YELLOW}Warning: This will import data to MongoDB Atlas${NC}"
echo "Atlas URI: ${ATLAS_URI%%@*}@***"  # Hide password
echo "Database: $DB_NAME"
echo "Source: $DUMP_PATH"
echo ""
read -p "Do you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Import cancelled${NC}"
    exit 0
fi

# Test connection first
echo -e "\n${YELLOW}Testing Atlas connection...${NC}"
if mongosh "$ATLAS_URI" --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Connection successful${NC}"
else
    echo -e "${RED}✗ Connection failed${NC}"
    echo "Please verify:"
    echo "  1. Your IP address is whitelisted in Atlas Network Access"
    echo "  2. Username and password are correct"
    echo "  3. Connection string format is correct"
    exit 1
fi

# Import database
echo -e "\n${YELLOW}Importing data to Atlas...${NC}"

mongorestore \
    --uri="$ATLAS_URI" \
    --db="$DB_NAME" \
    --gzip \
    --drop \
    "$DUMP_PATH"

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✓ Import completed successfully${NC}"
    
    # Verify import
    echo -e "\n${YELLOW}Verifying imported collections...${NC}"
    COLLECTIONS=$(mongosh "$ATLAS_URI" --quiet --eval "db.getCollectionNames()" | grep -o '"[^"]*"' | tr -d '"')
    
    if [ -n "$COLLECTIONS" ]; then
        echo -e "${GREEN}Imported collections:${NC}"
        echo "$COLLECTIONS" | while read -r collection; do
            COUNT=$(mongosh "$ATLAS_URI/$DB_NAME" --quiet --eval "db.$collection.countDocuments()")
            echo "  - $collection: $COUNT documents"
        done
    fi
    
    echo -e "\n${GREEN}=== Import Summary ===${NC}"
    echo "Atlas URI: ${ATLAS_URI%%@*}@***"
    echo "Database: $DB_NAME"
    echo "Source: $DUMP_PATH"
    echo -e "\n${GREEN}Next step: Update MONGODB_URI in your .env files${NC}"
else
    echo -e "${RED}✗ Import failed${NC}"
    exit 1
fi

