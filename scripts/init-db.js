/**
 * Database Initialization Script for Electron
 *
 * This script creates the SQLite database and all tables using Prisma Client.
 * It runs as a child process before the Next.js server starts.
 *
 * Usage: node init-db.js <database-path> <schema-prisma-path>
 *
 * The script:
 * 1. Sets DATABASE_URL to the given path
 * 2. Uses Prisma Client's internal $executeRawUnsafe to create tables
 * 3. Falls back to running prisma db push if available
 */
const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// Get arguments
const dbPath = process.argv[2];
const appRoot = process.argv[3] || path.dirname(__dirname);

if (!dbPath) {
  console.error("Usage: node init-db.js <database-path> [app-root]");
  process.exit(1);
}

console.log("Initializing database at:", dbPath);
console.log("App root:", appRoot);

// Ensure the directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Set the DATABASE_URL
process.env.DATABASE_URL = `file:${dbPath}`;

// Try Method 1: Use prisma db push (if prisma CLI is available)
function tryPrismaDbPush() {
  try {
    // Look for prisma CLI in several locations
    const possiblePaths = [
      path.join(appRoot, "node_modules", "prisma", "build", "index.js"),
      path.join(appRoot, "node_modules", "prisma", "index.js"),
      path.join(appRoot, "..", "node_modules", "prisma", "build", "index.js"),
      path.join(appRoot, "..", "node_modules", "prisma", "index.js"),
    ];

    // Also check in the standalone node_modules
    const standaloneDir = path.join(appRoot, ".next", "standalone");
    if (fs.existsSync(standaloneDir)) {
      possiblePaths.push(
        path.join(standaloneDir, "node_modules", "prisma", "build", "index.js"),
        path.join(standaloneDir, "node_modules", "prisma", "index.js")
      );
    }

    const schemaPath = path.join(appRoot, "prisma", "schema.prisma");
    const standaloneSchema = path.join(standaloneDir, "prisma", "schema.prisma");
    const actualSchema = fs.existsSync(schemaPath) ? schemaPath : (fs.existsSync(standaloneSchema) ? standaloneSchema : null);

    if (!actualSchema) {
      console.log("Schema file not found, skipping prisma db push");
      return false;
    }

    // Find prisma CLI
    let prismaCliPath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        prismaCliPath = p;
        break;
      }
    }

    if (!prismaCliPath) {
      console.log("Prisma CLI not found, will use direct SQL method");
      return false;
    }

    console.log("Found Prisma CLI at:", prismaCliPath);
    console.log("Schema at:", actualSchema);

    const result = spawnSync("node", [prismaCliPath, "db", "push", "--accept-data-loss", "--schema", actualSchema], {
      cwd: path.dirname(actualSchema),
      env: { ...process.env },
      stdio: "pipe",
      encoding: "utf8",
      timeout: 30000,
    });

    if (result.status === 0) {
      console.log("✓ Database schema created via prisma db push");
      return true;
    } else {
      console.error("prisma db push failed:", result.stderr || result.stdout);
      return false;
    }
  } catch (e) {
    console.error("Error running prisma db push:", e.message);
    return false;
  }
}

// Method 2: Use @prisma/client directly to create tables via SQL
async function tryDirectSQL() {
  try {
    console.log("Trying direct SQL table creation...");

    // Try to load Prisma Client from standalone
    const standaloneDir = path.join(appRoot, ".next", "standalone");
    const possibleClientPaths = [
      path.join(standaloneDir, "node_modules", "@prisma", "client"),
      path.join(appRoot, "node_modules", "@prisma", "client"),
    ];

    let clientPath = null;
    for (const p of possibleClientPaths) {
      if (fs.existsSync(p)) {
        clientPath = p;
        break;
      }
    }

    if (!clientPath) {
      console.error("Could not find @prisma/client");
      return false;
    }

    // Load PrismaClient
    const { PrismaClient } = require(clientPath);
    const prisma = new PrismaClient();

    // Create all tables using raw SQL
    // This mirrors the Prisma schema
    const statements = [
      `CREATE TABLE IF NOT EXISTS "SystemSetting" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "schoolName" TEXT NOT NULL DEFAULT 'Smart School',
        "schoolCode" TEXT,
        "tagLine" TEXT,
        "phone" TEXT,
        "email" TEXT,
        "address" TEXT,
        "city" TEXT,
        "state" TEXT,
        "country" TEXT NOT NULL DEFAULT 'Nigeria',
        "currency" TEXT NOT NULL DEFAULT '₦',
        "currencyCode" TEXT NOT NULL DEFAULT 'NGN',
        "language" TEXT NOT NULL DEFAULT 'English',
        "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
        "logo" TEXT,
        "favicon" TEXT,
        "theme" TEXT NOT NULL DEFAULT 'light',
        "isInstalled" BOOLEAN NOT NULL DEFAULT false,
        "currentSessionId" TEXT,
        "startDate" DATETIME,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "Session" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "session" TEXT NOT NULL UNIQUE,
        "isActive" BOOLEAN NOT NULL DEFAULT false,
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "username" TEXT NOT NULL UNIQUE,
        "email" TEXT NOT NULL UNIQUE,
        "password" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'Admin',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "lastLogin" DATETIME,
        "lastLogout" DATETIME,
        "image" TEXT,
        "staffId" TEXT UNIQUE,
        "studentId" TEXT UNIQUE,
        "parentId" TEXT UNIQUE,
        "roleId" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("staffId") REFERENCES "Staff"("id"),
        FOREIGN KEY ("studentId") REFERENCES "Student"("id"),
        FOREIGN KEY ("parentId") REFERENCES "Parent"("id"),
        FOREIGN KEY ("roleId") REFERENCES "Role"("id")
      )`,
      `CREATE TABLE IF NOT EXISTS "Role" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "name" TEXT NOT NULL UNIQUE,
        "description" TEXT,
        "permissions" TEXT NOT NULL DEFAULT '[]',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "isSystem" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "Class" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "name" TEXT NOT NULL UNIQUE,
        "sessionId" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("sessionId") REFERENCES "Session"("id")
      )`,
      `CREATE TABLE IF NOT EXISTS "Section" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "name" TEXT NOT NULL,
        "classId" TEXT NOT NULL,
        "capacity" INTEGER NOT NULL DEFAULT 40,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE,
        UNIQUE("classId", "name")
      )`,
      `CREATE TABLE IF NOT EXISTS "Subject" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "name" TEXT NOT NULL UNIQUE,
        "code" TEXT,
        "type" TEXT NOT NULL DEFAULT 'Theory',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "Staff" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "staffId" TEXT NOT NULL UNIQUE,
        "firstName" TEXT NOT NULL,
        "lastName" TEXT NOT NULL,
        "middleName" TEXT,
        "gender" TEXT,
        "dateOfBirth" DATETIME,
        "maritalStatus" TEXT,
        "bloodGroup" TEXT,
        "nationality" TEXT NOT NULL DEFAULT 'Nigerian',
        "stateOfOrigin" TEXT,
        "lga" TEXT,
        "religion" TEXT,
        "phone" TEXT,
        "email" TEXT,
        "address" TEXT,
        "city" TEXT,
        "state" TEXT,
        "qualification" TEXT,
        "experience" TEXT,
        "joiningDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "leavingDate" DATETIME,
        "photo" TEXT,
        "resume" TEXT,
        "joiningLetter" TEXT,
        "departmentId" TEXT,
        "designationId" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "basicSalary" REAL NOT NULL DEFAULT 0,
        "houseAllowance" REAL NOT NULL DEFAULT 0,
        "transportAllowance" REAL NOT NULL DEFAULT 0,
        "medicalAllowance" REAL NOT NULL DEFAULT 0,
        "otherAllowance" REAL NOT NULL DEFAULT 0,
        "taxDeduction" REAL NOT NULL DEFAULT 0,
        "pensionDeduction" REAL NOT NULL DEFAULT 0,
        "bankName" TEXT,
        "accountNumber" TEXT,
        "accountName" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("departmentId") REFERENCES "Department"("id"),
        FOREIGN KEY ("designationId") REFERENCES "Designation"("id")
      )`,
      `CREATE TABLE IF NOT EXISTS "Department" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "name" TEXT NOT NULL UNIQUE,
        "description" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "Designation" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "name" TEXT NOT NULL UNIQUE,
        "description" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "Parent" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "firstName" TEXT NOT NULL,
        "lastName" TEXT NOT NULL,
        "middleName" TEXT,
        "relation" TEXT NOT NULL DEFAULT 'Father',
        "occupation" TEXT,
        "phone" TEXT,
        "email" TEXT,
        "address" TEXT,
        "city" TEXT,
        "state" TEXT,
        "photo" TEXT,
        "annualIncome" REAL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "Student" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "admissionNo" TEXT NOT NULL UNIQUE,
        "firstName" TEXT NOT NULL,
        "lastName" TEXT NOT NULL,
        "middleName" TEXT,
        "gender" TEXT,
        "dateOfBirth" DATETIME,
        "ageAsOn" DATETIME,
        "bloodGroup" TEXT,
        "height" TEXT,
        "weight" TEXT,
        "nationality" TEXT NOT NULL DEFAULT 'Nigerian',
        "stateOfOrigin" TEXT,
        "lga" TEXT,
        "religion" TEXT,
        "caste" TEXT,
        "category" TEXT,
        "admissionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "admissionClass" TEXT,
        "currentClassId" TEXT,
        "sectionId" TEXT,
        "sessionId" TEXT,
        "rollNo" INTEGER,
        "houseId" TEXT,
        "hostelRoomId" TEXT,
        "transportRouteId" TEXT,
        "photo" TEXT,
        "fatherPhoto" TEXT,
        "motherPhoto" TEXT,
        "guardianPhoto" TEXT,
        "parentId" TEXT,
        "siblingId" TEXT,
        "phone" TEXT,
        "email" TEXT,
        "address" TEXT,
        "city" TEXT,
        "state" TEXT,
        "medicalHistory" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "isDisabled" BOOLEAN NOT NULL DEFAULT false,
        "leavingDate" DATETIME,
        "leavingReason" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("currentClassId") REFERENCES "Class"("id"),
        FOREIGN KEY ("sectionId") REFERENCES "Section"("id"),
        FOREIGN KEY ("sessionId") REFERENCES "Session"("id"),
        FOREIGN KEY ("houseId") REFERENCES "House"("id"),
        FOREIGN KEY ("hostelRoomId") REFERENCES "HostelRoom"("id"),
        FOREIGN KEY ("transportRouteId") REFERENCES "TransportRoute"("id"),
        FOREIGN KEY ("parentId") REFERENCES "Parent"("id")
      )`,
      `CREATE TABLE IF NOT EXISTS "House" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "name" TEXT NOT NULL UNIQUE,
        "description" TEXT,
        "color" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "Hostel" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "name" TEXT NOT NULL UNIQUE,
        "type" TEXT NOT NULL DEFAULT 'Boys',
        "address" TEXT,
        "wardenId" TEXT,
        "capacity" INTEGER NOT NULL DEFAULT 100,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "HostelRoom" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "hostelId" TEXT NOT NULL,
        "roomNo" TEXT NOT NULL,
        "roomType" TEXT NOT NULL DEFAULT 'Shared',
        "capacity" INTEGER NOT NULL DEFAULT 2,
        "fee" REAL NOT NULL DEFAULT 0,
        "description" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE CASCADE,
        UNIQUE("hostelId", "roomNo")
      )`,
      `CREATE TABLE IF NOT EXISTS "TransportRoute" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "routeName" TEXT NOT NULL UNIQUE,
        "vehicleNo" TEXT,
        "driverName" TEXT,
        "driverPhone" TEXT,
        "startPoint" TEXT,
        "endPoint" TEXT,
        "fare" REAL NOT NULL DEFAULT 0,
        "capacity" INTEGER NOT NULL DEFAULT 30,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "StudentAttendance" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "studentId" TEXT NOT NULL,
        "classId" TEXT,
        "sectionId" TEXT,
        "date" DATETIME NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'Present',
        "note" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE,
        UNIQUE("studentId", "date")
      )`,
      `CREATE TABLE IF NOT EXISTS "StaffAttendance" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "staffId" TEXT NOT NULL,
        "date" DATETIME NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'Present',
        "note" TEXT,
        "inTime" DATETIME,
        "outTime" DATETIME,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE,
        UNIQUE("staffId", "date")
      )`,
      `CREATE TABLE IF NOT EXISTS "FeeType" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "name" TEXT NOT NULL UNIQUE,
        "code" TEXT,
        "description" TEXT,
        "amount" REAL NOT NULL DEFAULT 0,
        "type" TEXT NOT NULL DEFAULT 'One Time',
        "classId" TEXT,
        "sessionId" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("classId") REFERENCES "Class"("id"),
        FOREIGN KEY ("sessionId") REFERENCES "Session"("id")
      )`,
      `CREATE TABLE IF NOT EXISTS "Invoice" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "invoiceNo" TEXT NOT NULL UNIQUE,
        "studentId" TEXT NOT NULL,
        "feeTypeId" TEXT,
        "amount" REAL NOT NULL,
        "discount" REAL NOT NULL DEFAULT 0,
        "fine" REAL NOT NULL DEFAULT 0,
        "paidAmount" REAL NOT NULL DEFAULT 0,
        "balance" REAL NOT NULL DEFAULT 0,
        "status" TEXT NOT NULL DEFAULT 'Unpaid',
        "dueDate" DATETIME,
        "carryForward" REAL NOT NULL DEFAULT 0,
        "sessionId" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE,
        FOREIGN KEY ("feeTypeId") REFERENCES "FeeType"("id")
      )`,
      `CREATE TABLE IF NOT EXISTS "FeePayment" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "paymentNo" TEXT NOT NULL UNIQUE,
        "invoiceId" TEXT,
        "studentId" TEXT NOT NULL,
        "amount" REAL NOT NULL,
        "discount" REAL NOT NULL DEFAULT 0,
        "fine" REAL NOT NULL DEFAULT 0,
        "paymentMode" TEXT NOT NULL DEFAULT 'Cash',
        "paymentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "bankName" TEXT,
        "chequeNo" TEXT,
        "transactionId" TEXT,
        "description" TEXT,
        "collectedBy" TEXT,
        "sessionId" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id"),
        FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS "Exam" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "name" TEXT NOT NULL UNIQUE,
        "description" TEXT,
        "classId" TEXT,
        "sectionId" TEXT,
        "session" TEXT,
        "startDate" DATETIME NOT NULL,
        "endDate" DATETIME,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("classId") REFERENCES "Class"("id"),
        FOREIGN KEY ("sectionId") REFERENCES "Section"("id")
      )`,
      `CREATE TABLE IF NOT EXISTS "ExamResult" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "examId" TEXT NOT NULL,
        "studentId" TEXT NOT NULL,
        "subjectName" TEXT NOT NULL,
        "marks" REAL NOT NULL,
        "totalMarks" REAL NOT NULL DEFAULT 100,
        "grade" TEXT,
        "remarks" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE,
        FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS "Homework" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "classId" TEXT NOT NULL,
        "sectionId" TEXT,
        "subjectId" TEXT,
        "homeworkDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "submissionDate" DATETIME NOT NULL,
        "createdBy" TEXT,
        "attachments" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE,
        FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE,
        FOREIGN KEY ("subjectId") REFERENCES "Subject"("id")
      )`,
      `CREATE TABLE IF NOT EXISTS "HomeworkSubmission" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "homeworkId" TEXT NOT NULL,
        "studentId" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'Pending',
        "marks" REAL,
        "remarks" TEXT,
        "submittedAt" DATETIME,
        "evaluatedAt" DATETIME,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("homeworkId") REFERENCES "Homework"("id") ON DELETE CASCADE,
        FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE,
        UNIQUE("homeworkId", "studentId")
      )`,
      `CREATE TABLE IF NOT EXISTS "Book" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "bookNo" TEXT NOT NULL UNIQUE,
        "title" TEXT NOT NULL,
        "author" TEXT,
        "publisher" TEXT,
        "category" TEXT,
        "isbn" TEXT,
        "edition" TEXT,
        "price" REAL NOT NULL DEFAULT 0,
        "quantity" INTEGER NOT NULL DEFAULT 1,
        "available" INTEGER NOT NULL DEFAULT 1,
        "rack" TEXT,
        "description" TEXT,
        "coverImage" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "BookIssue" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "bookId" TEXT NOT NULL,
        "studentId" TEXT,
        "staffId" TEXT,
        "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "dueDate" DATETIME NOT NULL,
        "returnDate" DATETIME,
        "status" TEXT NOT NULL DEFAULT 'Issued',
        "fine" REAL NOT NULL DEFAULT 0,
        "note" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("bookId") REFERENCES "Book"("id"),
        FOREIGN KEY ("studentId") REFERENCES "Student"("id")
      )`,
      `CREATE TABLE IF NOT EXISTS "AdmissionEnquiry" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "enquiryNo" TEXT NOT NULL UNIQUE,
        "firstName" TEXT NOT NULL,
        "lastName" TEXT NOT NULL,
        "middleName" TEXT,
        "phone" TEXT NOT NULL,
        "email" TEXT,
        "address" TEXT,
        "classApplied" TEXT,
        "source" TEXT,
        "noOfChild" INTEGER NOT NULL DEFAULT 1,
        "description" TEXT,
        "status" TEXT NOT NULL DEFAULT 'Active',
        "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "FollowUp" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "enquiryId" TEXT NOT NULL,
        "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "followUpDate" DATETIME NOT NULL,
        "response" TEXT,
        "status" TEXT NOT NULL DEFAULT 'Pending',
        "nextAction" TEXT,
        "createdBy" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("enquiryId") REFERENCES "AdmissionEnquiry"("id") ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS "Visitor" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "visitorName" TEXT NOT NULL,
        "phone" TEXT,
        "email" TEXT,
        "purpose" TEXT,
        "whomToMeet" TEXT,
        "idProof" TEXT,
        "idNumber" TEXT,
        "noOfPerson" INTEGER NOT NULL DEFAULT 1,
        "checkIn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "checkOut" DATETIME,
        "note" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "PhoneCallLog" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "callType" TEXT NOT NULL DEFAULT 'Incoming',
        "name" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "duration" TEXT,
        "note" TEXT,
        "followUp" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "PostalDispatch" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "refNo" TEXT,
        "fromTitle" TEXT NOT NULL,
        "fromAddress" TEXT,
        "toTitle" TEXT NOT NULL,
        "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "note" TEXT,
        "document" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "PostalReceive" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "refNo" TEXT,
        "fromTitle" TEXT NOT NULL,
        "fromAddress" TEXT,
        "toTitle" TEXT NOT NULL,
        "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "note" TEXT,
        "document" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "Complain" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "complainNo" TEXT NOT NULL UNIQUE,
        "source" TEXT,
        "name" TEXT NOT NULL,
        "phone" TEXT,
        "complainType" TEXT,
        "complain" TEXT NOT NULL,
        "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "status" TEXT NOT NULL DEFAULT 'Pending',
        "assignedTo" TEXT,
        "resolution" TEXT,
        "resolvedAt" DATETIME,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "CalendarEvent" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "type" TEXT NOT NULL DEFAULT 'Event',
        "startDate" DATETIME NOT NULL,
        "endDate" DATETIME,
        "color" TEXT NOT NULL DEFAULT '#16a34a',
        "location" TEXT,
        "createdBy" TEXT,
        "role" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "Task" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "status" TEXT NOT NULL DEFAULT 'Pending',
        "priority" TEXT NOT NULL DEFAULT 'Medium',
        "dueDate" DATETIME,
        "assignedTo" TEXT,
        "createdBy" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "Page" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "title" TEXT NOT NULL,
        "slug" TEXT NOT NULL UNIQUE,
        "content" TEXT NOT NULL,
        "excerpt" TEXT,
        "featuredImage" TEXT,
        "status" TEXT NOT NULL DEFAULT 'Published',
        "authorId" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "News" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "title" TEXT NOT NULL,
        "slug" TEXT NOT NULL UNIQUE,
        "content" TEXT NOT NULL,
        "excerpt" TEXT,
        "image" TEXT,
        "category" TEXT,
        "status" TEXT NOT NULL DEFAULT 'Published',
        "authorId" TEXT,
        "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "Event" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "startDate" DATETIME NOT NULL,
        "endDate" DATETIME,
        "location" TEXT,
        "image" TEXT,
        "status" TEXT NOT NULL DEFAULT 'Upcoming',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "Gallery" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "image" TEXT NOT NULL,
        "category" TEXT,
        "album" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "Banner" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "title" TEXT NOT NULL,
        "image" TEXT NOT NULL,
        "link" TEXT,
        "description" TEXT,
        "position" INTEGER NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "Menu" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "title" TEXT NOT NULL,
        "url" TEXT,
        "parentId" TEXT,
        "position" INTEGER NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "isExternal" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "MediaFile" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "name" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "size" INTEGER,
        "folder" TEXT NOT NULL DEFAULT 'root',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "DownloadContent" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "type" TEXT NOT NULL DEFAULT 'Assignment',
        "classId" TEXT,
        "sectionId" TEXT,
        "subjectId" TEXT,
        "fileUrl" TEXT NOT NULL,
        "uploadDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "uploadedBy" TEXT,
        "role" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "CertificateTemplate" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "name" TEXT NOT NULL UNIQUE,
        "type" TEXT NOT NULL,
        "template" TEXT NOT NULL,
        "backgroundImage" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "IdCardTemplate" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "name" TEXT NOT NULL UNIQUE,
        "type" TEXT NOT NULL DEFAULT 'Student',
        "template" TEXT NOT NULL,
        "backgroundImage" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "GeneratedCertificate" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "studentId" TEXT NOT NULL,
        "templateId" TEXT NOT NULL,
        "certificateNo" TEXT NOT NULL UNIQUE,
        "generatedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "generatedBy" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "LeaveType" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "name" TEXT NOT NULL UNIQUE,
        "code" TEXT,
        "days" INTEGER NOT NULL DEFAULT 0,
        "description" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "LeaveRequest" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "staffId" TEXT NOT NULL,
        "leaveTypeId" TEXT NOT NULL,
        "applyDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "fromDate" DATETIME NOT NULL,
        "toDate" DATETIME NOT NULL,
        "days" INTEGER NOT NULL,
        "reason" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'Pending',
        "approvedBy" TEXT,
        "approvedAt" DATETIME,
        "note" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE,
        FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id")
      )`,
      `CREATE TABLE IF NOT EXISTS "Payroll" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "staffId" TEXT NOT NULL,
        "month" INTEGER NOT NULL,
        "year" INTEGER NOT NULL,
        "basicSalary" REAL NOT NULL,
        "allowances" REAL NOT NULL,
        "deductions" REAL NOT NULL,
        "netSalary" REAL NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'Generated',
        "paymentDate" DATETIME,
        "paymentMode" TEXT,
        "transactionId" TEXT,
        "note" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE,
        UNIQUE("staffId", "month", "year")
      )`,
      `CREATE TABLE IF NOT EXISTS "StudentTimeline" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "studentId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "type" TEXT NOT NULL DEFAULT 'General',
        "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdBy" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS "ClassTeacher" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "classId" TEXT NOT NULL,
        "sectionId" TEXT NOT NULL,
        "staffId" TEXT NOT NULL,
        "isRestricted" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE,
        FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE,
        FOREIGN KEY ("staffId") REFERENCES "Staff"("id"),
        UNIQUE("classId", "sectionId", "staffId")
      )`,
      `CREATE TABLE IF NOT EXISTS "SubjectTeacher" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "subjectId" TEXT NOT NULL,
        "classId" TEXT NOT NULL,
        "sectionId" TEXT,
        "staffId" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("subjectId") REFERENCES "Subject"("id"),
        FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE,
        FOREIGN KEY ("staffId") REFERENCES "Staff"("id")
      )`,
      `CREATE TABLE IF NOT EXISTS "_ClassToSubject" (
        "A" TEXT NOT NULL,
        "B" TEXT NOT NULL,
        FOREIGN KEY ("A") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY ("B") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        UNIQUE("A", "B")
      )`,
      `CREATE TABLE IF NOT EXISTS "_ClassToFeeType" (
        "A" TEXT NOT NULL,
        "B" TEXT NOT NULL,
        FOREIGN KEY ("A") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY ("B") REFERENCES "FeeType"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        UNIQUE("A", "B")
      )`,
    ];

    let created = 0;
    for (const sql of statements) {
      try {
        await prisma.$executeRawUnsafe(sql);
        created++;
      } catch (e) {
        // Table may already exist, continue
        if (!e.message.includes("already exists")) {
          console.error("SQL error:", e.message.substring(0, 100));
        }
      }
    }

    console.log(`✓ Created ${created} tables via direct SQL`);
    await prisma.$disconnect();
    return true;
  } catch (e) {
    console.error("Direct SQL method failed:", e.message);
    return false;
  }
}

// Main execution
async function main() {
  // Check if database already has tables
  const dbExists = fs.existsSync(dbPath);
  if (dbExists && fs.statSync(dbPath).size > 1000) {
    console.log("✓ Database already exists and has data, skipping initialization");
    process.exit(0);
  }

  // Try Method 1: prisma db push
  if (tryPrismaDbPush()) {
    process.exit(0);
  }

  // Method 2: Direct SQL
  const success = await tryDirectSQL();
  if (success) {
    console.log("✓ Database initialized successfully");
    process.exit(0);
  } else {
    console.error("❌ Failed to initialize database");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
