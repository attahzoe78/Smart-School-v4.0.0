#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Auto-setup script for Smart School
 * Creates .env file from .env.example if it doesn't exist
 * Ensures the database directory exists
 * This runs automatically before dev/build/db commands
 */
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const envPath = path.join(projectRoot, ".env");
const envExamplePath = path.join(projectRoot, ".env.example");
const dbDir = path.join(projectRoot, "db");

// Ensure db directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log("✓ Created db/ directory");
}

// Create .env from .env.example if it doesn't exist
if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log("✓ Created .env file from .env.example");
    console.log("  DATABASE_URL is set to: file:./db/custom.db (relative path)");
  } else {
    // Fallback: create .env with default value
    fs.writeFileSync(envPath, 'DATABASE_URL="file:./db/custom.db"\n');
    console.log("✓ Created .env file with default DATABASE_URL");
  }
} else {
  // .env exists, verify it has DATABASE_URL
  const envContent = fs.readFileSync(envPath, "utf8");
  if (!envContent.includes("DATABASE_URL")) {
    fs.appendFileSync(envPath, '\nDATABASE_URL="file:./db/custom.db"\n');
    console.log("✓ Added DATABASE_URL to existing .env file");
  }
}

console.log("✓ Setup complete. Ready to run Smart School.\n");
