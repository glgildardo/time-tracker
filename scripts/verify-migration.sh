#!/bin/bash

# MongoDB Migration Verification Script
# Compares local and Atlas databases to verify migration success

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
LOCAL_URI="mongodb://admin:password@localhost:27017/time-tracker?authSource=admin"
ATLAS_URI="${ATLAS_URI:-}"
DB_NAME="time-tracker"

echo -e "${GREEN}=== MongoDB Migration Verification Script ===${NC}\n"

# Check if mongosh is installed
if ! command -v mongosh &> /dev/null; then
    echo -e "${YELLOW}Warning: mongosh is not installed, using mongo command instead${NC}"
    USE_MONGO=true
else
    USE_MONGO=false
fi

# Check if ATLAS_URI is provided
if [ -z "$ATLAS_URI" ]; then
    echo -e "${YELLOW}ATLAS_URI environment variable not set${NC}"
    read -p "Enter your Atlas connection string: " ATLAS_URI
    
    if [ -z "$ATLAS_URI" ]; then
        echo -e "${RED}Error: Atlas connection string is required${NC}"
        exit 1
    fi
fi

# Function to get collection count
get_collection_count() {
    local uri=$1
    local collection=$2
    
    if [ "$USE_MONGO" = true ]; then
        mongo "$uri" --quiet --eval "db.$collection.countDocuments()" 2>/dev/null | tail -n 1
    else
        mongosh "$uri" --quiet --eval "db.$collection.countDocuments()" 2>/dev/null | tail -n 1
    fi
}

# Function to get all collections
get_collections() {
    local uri=$1
    
    if [ "$USE_MONGO" = true ]; then
        mongo "$uri" --quiet --eval "db.getCollectionNames()" 2>/dev/null | grep -o '"[^"]*"' | tr -d '"'
    else
        mongosh "$uri" --quiet --eval "db.getCollectionNames()" 2>/dev/null | grep -o '"[^"]*"' | tr -d '"'
    fi
}

# Test local connection
echo -e "${YELLOW}Testing local MongoDB connection...${NC}"
if docker ps | grep -q "time-tracker-mongodb-dev"; then
    echo -e "${GREEN}✓ Local MongoDB container is running${NC}"
else
    echo -e "${RED}✗ Local MongoDB container is not running${NC}"
    echo "Please start it with: docker-compose up -d mongodb"
    exit 1
fi

# Test Atlas connection
echo -e "${YELLOW}Testing Atlas connection...${NC}"
if [ "$USE_MONGO" = true ]; then
    if mongo "$ATLAS_URI" --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Atlas connection successful${NC}"
    else
        echo -e "${RED}✗ Atlas connection failed${NC}"
        exit 1
    fi
else
    if mongosh "$ATLAS_URI" --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Atlas connection successful${NC}"
    else
        echo -e "${RED}✗ Atlas connection failed${NC}"
        exit 1
    fi
fi

# Get collections from both databases
echo -e "\n${YELLOW}Fetching collections...${NC}"
LOCAL_COLLECTIONS=$(get_collections "$LOCAL_URI")
ATLAS_COLLECTIONS=$(get_collections "$ATLAS_URI")

if [ -z "$LOCAL_COLLECTIONS" ]; then
    echo -e "${RED}Error: Could not fetch collections from local database${NC}"
    exit 1
fi

if [ -z "$ATLAS_COLLECTIONS" ]; then
    echo -e "${RED}Error: Could not fetch collections from Atlas${NC}"
    exit 1
fi

# Compare collections
echo -e "\n${GREEN}=== Collection Comparison ===${NC}\n"

ALL_MATCH=true

for collection in $LOCAL_COLLECTIONS; do
    LOCAL_COUNT=$(get_collection_count "$LOCAL_URI" "$collection")
    ATLAS_COUNT=$(get_collection_count "$ATLAS_URI" "$collection")
    
    if [ "$LOCAL_COUNT" = "$ATLAS_COUNT" ]; then
        echo -e "${GREEN}✓ $collection: $LOCAL_COUNT documents (match)${NC}"
    else
        echo -e "${RED}✗ $collection: Local=$LOCAL_COUNT, Atlas=$ATLAS_COUNT (mismatch)${NC}"
        ALL_MATCH=false
    fi
done

# Check for collections in Atlas that don't exist locally
for collection in $ATLAS_COLLECTIONS; do
    if ! echo "$LOCAL_COLLECTIONS" | grep -q "^$collection$"; then
        ATLAS_COUNT=$(get_collection_count "$ATLAS_URI" "$collection")
        echo -e "${YELLOW}⚠ $collection: $ATLAS_COUNT documents (exists only in Atlas)${NC}"
    fi
done

# Summary
echo -e "\n${GREEN}=== Verification Summary ===${NC}"
if [ "$ALL_MATCH" = true ]; then
    echo -e "${GREEN}✓ All collections match successfully!${NC}"
    echo -e "${GREEN}Migration verification passed${NC}"
    exit 0
else
    echo -e "${RED}✗ Some collections do not match${NC}"
    echo -e "${YELLOW}Please review the differences above${NC}"
    exit 1
fi

