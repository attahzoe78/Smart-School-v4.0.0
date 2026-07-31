#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Auto-setup script for Smart School
 * Creates .env file with an ABSOLUTE database path if it doesn't exist.
 * Ensures the database directory exists.
 * This runs automatically before dev/build/db commands.
 *
 * IMPORTANT: Prisma resolves relative file: paths relative to the schema
 * file (prisma/schema.prisma), NOT the project root. This causes
 * "Unable to open database file" errors. We use an absolute path to fix this.
 */
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const envPath = path.join(projectRoot, ".env");
const dbDir = path.join(projectRoot, "db");
const dbFile = path.join(dbDir, "custom.db");

// Ensure db directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log("✓ Created db/ directory");
}

// Build the absolute DATABASE_URL
// Use forward slashes for cross-platform compatibility
const absoluteDbPath = dbFile.replace(/\\/g, "/");
const databaseUrl = `file:${absoluteDbPath}`;

// Check if .env exists and has a valid DATABASE_URL
let needToWrite = true;
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  // Check if it has a Turso/libSQL URL (production) - leave it alone
  if (envContent.includes("libsql://") || envContent.includes("libsql+ws://")) {
    needToWrite = false;
    console.log("✓ .env already configured for Turso (production mode)");
  }
  // Check if it has an absolute file: path already
  else if (envContent.includes("file:/") || envContent.includes('file:"/')) {
    needToWrite = false;
    console.log("✓ .env already has an absolute database path");
  }
}

if (needToWrite) {
  const envContent = `# Smart School - Local Development Environment
# Database URL (SQLite) - absolute path so Prisma can always find it
DATABASE_URL="${databaseUrl}"

# For Vercel/production, replace with Turso URL:
#   DATABASE_URL="libsql://your-db.turso.io"
#   DATABASE_AUTH_TOKEN="your-turso-token"
# See .env.example for full instructions.
`;
  fs.writeFileSync(envPath, envContent);
  console.log("✓ Created .env file with absolute database path:");
  console.log(`  DATABASE_URL = ${databaseUrl}`);
}

console.log("✓ Setup complete. Ready to run Smart School.\n");
