#!/bin/bash

# FolderTreePRO Database Setup Script
# This script initializes the PostgreSQL database for the project

set -e

echo "🔧 FolderTreePRO Database Setup"
echo "================================"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo "Set it before running this script: export DATABASE_URL=postgresql://user:password@localhost:5432/foldertree"
    exit 1
fi

echo "✅ DATABASE_URL is set"
echo ""

# Run migrations
echo "📦 Running migrations..."
psql $DATABASE_URL < migrations/001_initial.sql

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Populate seed data: npm run seed"
echo "2. Start development: npm run dev"
