#!/usr/bin/env bash
set -e

# Create .env from .env.example if it doesn't already exist
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo ""
  echo "✅  Created .env from .env.example"
  echo "⚠️   Add your ANTHROPIC_API_KEY to .env before running fills."
  echo ""
else
  echo "✅  .env already exists — skipping copy"
fi

# Create uploads directory
mkdir -p uploads

# Push Prisma schema → creates SQLite database
npx prisma db push --skip-generate

echo ""
echo "✅  Database ready."
echo ""
echo "Run: npm run dev"
echo ""
