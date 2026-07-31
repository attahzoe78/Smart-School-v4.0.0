import { PrismaClient } from '@prisma/client'

// Provide a fallback DATABASE_URL so the app doesn't crash if .env is missing.
// This is especially useful when someone clones the repo and hasn't set up .env yet.
// The setup script (scripts/setup.js) should create .env automatically,
// but this fallback ensures robustness.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./db/custom.db'
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
