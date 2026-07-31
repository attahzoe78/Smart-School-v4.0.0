#!/usr/bin/env bash
# ============================================================
# Smart School - Vercel Deployment Script
# ============================================================
# This script deploys Smart School to Vercel.
#
# Prerequisites:
#   1. A Vercel account (https://vercel.com)
#   2. A Vercel access token (https://vercel.com/account/tokens)
#   3. A Turso database for production data (https://turso.tech)
#
# Usage:
#   VERCEL_TOKEN=your_token_here bash scripts/deploy-vercel.sh
#
# Or set VERCEL_TOKEN as an environment variable first.
# ============================================================
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

# Check for token
if [ -z "$VERCEL_TOKEN" ]; then
  echo "❌ Error: VERCEL_TOKEN environment variable is required."
  echo ""
  echo "Get your token at: https://vercel.com/account/tokens"
  echo "Then run:"
  echo "  VERCEL_TOKEN=your_token bash scripts/deploy-vercel.sh"
  exit 1
fi

echo "🚀 Deploying Smart School to Vercel..."
echo ""

# Step 1: Deploy to Vercel (production)
echo "📦 Step 1: Deploying to Vercel..."
DEPLOY_URL=$(npx vercel --prod --token "$VERCEL_TOKEN" --yes 2>&1 | tail -1)

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your app is live at: $DEPLOY_URL"
echo ""
echo "============================================================"
echo "NEXT STEPS - Set up your database:"
echo "============================================================"
echo ""
echo "1. Create a free Turso database (SQLite-compatible):"
echo "   → Sign up at https://turso.tech"
echo "   → Run: turso db create smart-school"
echo "   → Get URL: turso db show smart-school --url"
echo "   → Get token: turso db tokens create smart-school"
echo ""
echo "2. Add environment variables in Vercel:"
echo "   → Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables"
echo "   → Add: DATABASE_URL = libsql://smart-school-xxx.turso.io"
echo "   → Add: DATABASE_AUTH_TOKEN = your_turso_token"
echo ""
echo "3. Push database schema to Turso:"
echo "   → Run: DATABASE_URL='libsql://...' DATABASE_AUTH_TOKEN='...' bun run db:push"
echo ""
echo "4. Redeploy or visit your app URL to complete the web installation wizard!"
echo ""
