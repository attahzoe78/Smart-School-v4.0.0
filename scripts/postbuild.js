#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Post-build script for Smart School
 *
 * This script runs AFTER `next build` and:
 * 1. Copies .next/static into .next/standalone/.next/static (required by standalone server)
 * 2. Removes the .env file from standalone (it has machine-specific paths that
 *    break on other machines; Electron sets DATABASE_URL at runtime instead)
 * 3. Copies the Prisma schema into standalone for db push operations
 * 4. Verifies the standalone structure is complete
 */
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const standaloneDir = path.join(projectRoot, ".next", "standalone");
const staticDir = path.join(projectRoot, ".next", "static");
const publicDir = path.join(projectRoot, "public");
const prismaDir = path.join(projectRoot, "prisma");

console.log("🔧 Running post-build setup...\n");

// ========================================
// 1. Verify standalone exists
// ========================================
if (!fs.existsSync(standaloneDir)) {
  console.error("❌ .next/standalone not found. Run 'next build' first.");
  process.exit(1);
}
console.log("✓ Standalone directory exists");

// ========================================
// 2. Copy .next/static into standalone
// ========================================
const standaloneStaticDir = path.join(standaloneDir, ".next", "static");
if (fs.existsSync(staticDir)) {
  // Remove existing static dir if present
  if (fs.existsSync(standaloneStaticDir)) {
    fs.rmSync(standaloneStaticDir, { recursive: true, force: true });
  }
  copyDirRecursive(staticDir, standaloneStaticDir);
  console.log("✓ Copied .next/static to standalone/.next/static");
} else {
  console.warn("⚠ .next/static not found - app may load without CSS/JS");
}

// ========================================
// 3. Copy public/ into standalone (if not already there)
// ========================================
const standalonePublicDir = path.join(standaloneDir, "public");
if (fs.existsSync(publicDir) && !fs.existsSync(standalonePublicDir)) {
  copyDirRecursive(publicDir, standalonePublicDir);
  console.log("✓ Copied public/ to standalone/public/");
} else if (fs.existsSync(standalonePublicDir)) {
  console.log("✓ public/ already in standalone");
}

// ========================================
// 4. Remove .env from standalone (it has machine-specific paths)
// ========================================
const standaloneEnvFile = path.join(standaloneDir, ".env");
if (fs.existsSync(standaloneEnvFile)) {
  fs.unlinkSync(standaloneEnvFile);
  console.log("✓ Removed .env from standalone (Electron sets DATABASE_URL at runtime)");
}

// Also remove any .env.local or .env.production
[".env.local", ".env.production", ".env.production.local"].forEach((f) => {
  const p = path.join(standaloneDir, f);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log(`✓ Removed ${f} from standalone`);
  }
});

// ========================================
// 5. Copy prisma schema into standalone
// ========================================
const standalonePrismaDir = path.join(standaloneDir, "prisma");
const schemaSrc = path.join(prismaDir, "schema.prisma");
const schemaDest = path.join(standalonePrismaDir, "schema.prisma");
if (fs.existsSync(schemaSrc)) {
  if (!fs.existsSync(standalonePrismaDir)) {
    fs.mkdirSync(standalonePrismaDir, { recursive: true });
  }
  fs.copyFileSync(schemaSrc, schemaDest);
  console.log("✓ Copied prisma/schema.prisma to standalone/prisma/");
}

// ========================================
// 6. Verify server.js exists
// ========================================
const serverFile = path.join(standaloneDir, "server.js");
if (fs.existsSync(serverFile)) {
  console.log("✓ server.js exists in standalone");
} else {
  console.error("❌ server.js NOT found in standalone!");
  process.exit(1);
}

// ========================================
// 7. Verify @prisma/client is in standalone node_modules
// ========================================
const prismaClientDir = path.join(standaloneDir, "node_modules", "@prisma", "client");
if (fs.existsSync(prismaClientDir)) {
  console.log("✓ @prisma/client is in standalone node_modules");
} else {
  console.warn("⚠ @prisma/client NOT in standalone node_modules - copying...");
  const srcClient = path.join(projectRoot, "node_modules", "@prisma", "client");
  const destClient = path.join(standaloneDir, "node_modules", "@prisma", "client");
  if (fs.existsSync(srcClient)) {
    copyDirRecursive(srcClient, destClient);
    console.log("✓ Copied @prisma/client to standalone");
  }
}

// ========================================
// 8. Verify .prisma (generated client) is in standalone
// ========================================
const prismaGeneratedDir = path.join(standaloneDir, "node_modules", ".prisma");
if (fs.existsSync(prismaGeneratedDir)) {
  console.log("✓ .prisma (generated client) is in standalone");
} else {
  console.warn("⚠ .prisma NOT in standalone - copying...");
  const srcGen = path.join(projectRoot, "node_modules", ".prisma");
  const destGen = path.join(standaloneDir, "node_modules", ".prisma");
  if (fs.existsSync(srcGen)) {
    copyDirRecursive(srcGen, destGen);
    console.log("✓ Copied .prisma to standalone");
  }
}

console.log("\n✅ Post-build setup complete!\n");

// ========================================
// Helper: Recursive directory copy
// ========================================
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
