import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import { existsSync, mkdirSync } from 'fs'
import { resolve, join } from 'path'

/**
 * Resolves the SQLite database path to an ABSOLUTE path.
 *
 * Prisma resolves relative `file:` paths relative to the schema file
 * location (prisma/schema.prisma), NOT the project root or CWD.
 * This causes "Unable to open database file" errors when the path
 * resolves to a non-existent directory.
 *
 * Fix: Always use an absolute path so it works regardless of where
 * the process runs from.
 */
function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL

  // If using Turso/libSQL (production/Vercel), use as-is
  if (envUrl && (envUrl.startsWith('libsql://') || envUrl.startsWith('libsql+ws://'))) {
    return envUrl
  }

  // For local SQLite, resolve to an absolute path
  let dbPath: string

  if (envUrl && envUrl.startsWith('file:')) {
    // Strip the "file:" prefix
    let rawPath = envUrl.slice(5)
    // Remove leading ./ if present
    if (rawPath.startsWith('./')) rawPath = rawPath.slice(2)
    // If not absolute, resolve relative to project root (two levels up from src/lib)
    if (!rawPath.startsWith('/')) {
      const projectRoot = resolve(__dirname, '..', '..')
      rawPath = join(projectRoot, rawPath)
    }
    dbPath = rawPath
  } else {
    // Fallback: default location at <project-root>/db/custom.db
    const projectRoot = resolve(__dirname, '..', '..')
    dbPath = join(projectRoot, 'db', 'custom.db')
  }

  // Ensure the parent directory exists
  const dbDir = resolve(dbPath, '..')
  if (!existsSync(dbDir)) {
    try {
      mkdirSync(dbDir, { recursive: true })
    } catch {
      // Directory creation may fail in read-only environments; ignore
    }
  }

  return `file:${dbPath}`
}

const databaseUrl = getDatabaseUrl()
const isTurso = databaseUrl.startsWith('libsql://') || databaseUrl.startsWith('libsql+ws://')

// Make the resolved URL available to Prisma
if (!isTurso) {
  process.env.DATABASE_URL = databaseUrl
}

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
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
