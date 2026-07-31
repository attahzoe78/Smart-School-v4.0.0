import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

// Provide a fallback DATABASE_URL for local development.
// This makes the app work out-of-the-box when cloned.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./db/custom.db'
}

const databaseUrl = process.env.DATABASE_URL
const isTurso = databaseUrl.startsWith('libsql://') || databaseUrl.startsWith('libsql+ws://')

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  // Use Turso adapter when the URL is a libsql:// URL (for Vercel/production)
  if (isTurso) {
    const libsql = createClient({
      url: databaseUrl,
      authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
    })
    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter })
  }

  // Local SQLite development
  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
