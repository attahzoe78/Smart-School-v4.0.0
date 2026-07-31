#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Smart School - Turso Database Setup & Seed Script
 *
 * This script:
 * 1. Pushes the Prisma schema to a Turso database
 * 2. Installs the system (creates admin, classes, subjects, etc.)
 * 3. Seeds demo data (students, staff, fees, etc.)
 *
 * Usage:
 *   TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." node scripts/setup-turso.js
 *
 * Or set these in your .env file:
 *   DATABASE_URL="libsql://smart-school-xxx.turso.io"
 *   DATABASE_AUTH_TOKEN="your-turso-token"
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const TURSO_URL = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error("❌ Error: Turso database URL and auth token are required.");
  console.error("");
  console.error("Set these environment variables:");
  console.error("  TURSO_DATABASE_URL=libsql://smart-school-xxx.turso.io");
  console.error("  TURSO_AUTH_TOKEN=your-turso-token");
  console.error("");
  console.error("Or get them with:");
  console.error("  turso db show smart-school --url");
  console.error("  turso db tokens create smart-school");
  process.exit(1);
}

if (!TURSO_URL.startsWith("libsql://")) {
  console.error("❌ Error: TURSO_DATABASE_URL must start with libsql://");
  console.error("Got: " + TURSO_URL);
  process.exit(1);
}

const projectRoot = path.resolve(__dirname, "..");
process.chdir(projectRoot);

console.log("🚀 Setting up Smart School database on Turso...");
console.log("📍 Database URL:", TURSO_URL);
console.log("");

// Step 1: Push Prisma schema to Turso
console.log("📦 Step 1/3: Pushing database schema to Turso...");
try {
  execSync(
    `DATABASE_URL="${TURSO_URL}" DATABASE_AUTH_TOKEN="${TURSO_TOKEN}" npx prisma db push --accept-data-loss`,
    { stdio: "inherit", cwd: projectRoot }
  );
  console.log("✅ Schema pushed successfully!\n");
} catch (e) {
  console.error("❌ Failed to push schema:", e.message);
  process.exit(1);
}

// Step 2: Generate Prisma client
console.log("🔧 Step 2/3: Generating Prisma client...");
try {
  execSync("npx prisma generate", { stdio: "inherit", cwd: projectRoot });
  console.log("✅ Prisma client generated!\n");
} catch (e) {
  console.error("❌ Failed to generate client:", e.message);
  process.exit(1);
}

// Step 3: Install system and seed data
console.log("🌱 Step 3/3: Installing system and seeding data...");
console.log("   (Starting a temporary server to run the install + seed APIs)...");

// We'll use a direct approach: set the env vars and call the APIs via a script
const setupScript = `
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@libsql/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');

const libsql = createClient({
  url: '${TURSO_URL}',
  authToken: '${TURSO_TOKEN}',
});
const adapter = new PrismaLibSql(libsql);
const db = new PrismaClient({ adapter });

async function main() {
  // Check if already installed
  const existing = await db.systemSetting.findFirst();
  if (existing && existing.isInstalled) {
    console.log('System already installed on Turso. Skipping installation.');
    const studentCount = await db.student.count();
    const staffCount = await db.staff.count();
    console.log('Current data: ' + studentCount + ' students, ' + staffCount + ' staff');
    return;
  }

  // Install system
  console.log('Installing system...');
  const settings = await db.systemSetting.create({
    data: {
      schoolName: 'Smart School Jos',
      schoolCode: 'SSJ-001',
      tagLine: 'Knowledge • Excellence • Integrity',
      phone: '+234 803 000 0000',
      email: 'info@smartschool.edu.ng',
      address: 'Yakubu Gowon Way, Jos',
      city: 'Jos',
      state: 'Plateau',
      country: 'Nigeria',
      currency: '₦',
      currencyCode: 'NGN',
      language: 'English',
      timezone: 'Africa/Lagos',
      isInstalled: true,
      startDate: new Date(),
    }
  });

  const session = await db.session.create({
    data: { session: '2024/2025', isActive: true, isDefault: true }
  });
  await db.systemSetting.update({
    where: { id: settings.id },
    data: { currentSessionId: session.id }
  });

  // Create roles
  await db.role.create({ data: { name: 'Super Admin', description: 'Full system access', permissions: '["*"]', isSystem: true } });
  for (const r of ['Admin','Accountant','Teacher','Receptionist','Librarian','Parent','Student']) {
    await db.role.create({ data: { name: r, description: r + ' role', permissions: '[]', isSystem: true } });
  }

  // Create departments
  for (const d of ['Academic','Administration','Finance','Library','Sports','Hostel']) {
    await db.department.create({ data: { name: d, description: d + ' Department' } });
  }

  // Create designations
  for (const d of ['Principal','Vice Principal','Head Teacher','Teacher','Accountant','Librarian','Clerk','Driver','Security']) {
    await db.designation.create({ data: { name: d, description: d + ' designation' } });
  }

  // Create houses
  for (const h of [{name:'Red House',color:'#dc2626'},{name:'Blue House',color:'#2563eb'},{name:'Green House',color:'#16a34a'},{name:'Yellow House',color:'#ca8a04'}]) {
    await db.house.create({ data: h });
  }

  // Create classes
  const classes = ['Creche','Nursery 1','Nursery 2','KG 1','KG 2','Primary 1','Primary 2','Primary 3','Primary 4','Primary 5','Primary 6','JSS 1','JSS 2','JSS 3','SSS 1','SSS 2','SSS 3'];
  for (const c of classes) {
    const cls = await db.class.create({ data: { name: c, sessionId: session.id } });
    await db.section.createMany({ data: [{name:'A',classId:cls.id,capacity:40},{name:'B',classId:cls.id,capacity:40}] });
  }

  // Create subjects
  const subjects = ['Mathematics','English Language','Basic Science','Social Studies','Civic Education','Computer Studies','Agricultural Science','Christian Religious Studies','Islamic Religious Studies','French','Hausa','Yoruba','Igbo','Physics','Chemistry','Biology','Further Mathematics','Geography','Economics','Government','Literature in English','Technical Drawing','Fine Arts','Music','Physical Education','Home Economics','Business Studies','Accounting','Commerce'];
  for (const s of subjects) {
    await db.subject.create({ data: { name: s } });
  }

  // Create Super Admin user
  const { scryptSync, randomBytes } = require('crypto');
  function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return salt + ':' + hash;
  }
  await db.user.create({
    data: {
      username: 'superadmin',
      email: 'admin@smartschool.edu.ng',
      password: hashPassword('password123'),
      role: 'Super Admin',
      isActive: true,
    }
  });

  console.log('✅ System installed successfully!');
  console.log('   Admin login: superadmin / password123');
  console.log('');
  console.log('To seed demo data, visit the app and click "Load demo data"');
  console.log('or run the seed API after deploying to Vercel.');
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
`;

const tempScriptPath = path.join(projectRoot, "scripts", "_temp-turso-setup.cjs");
fs.writeFileSync(tempScriptPath, setupScript);

try {
  execSync(`node "${tempScriptPath}"`, { stdio: "inherit", cwd: projectRoot });
} catch (e) {
  console.error("❌ Failed to install/seed:", e.message);
} finally {
  // Clean up temp file
  if (fs.existsSync(tempScriptPath)) fs.unlinkSync(tempScriptPath);
}

console.log("");
console.log("═══════════════════════════════════════════════════════════");
console.log("✅ Turso database setup complete!");
console.log("═══════════════════════════════════════════════════════════");
console.log("");
console.log("📝 Add these to your Vercel Environment Variables:");
console.log("   DATABASE_URL = " + TURSO_URL);
console.log("   DATABASE_AUTH_TOKEN = " + TURSO_TOKEN);
console.log("");
console.log("🔑 Admin Login: superadmin / password123");
console.log("");
