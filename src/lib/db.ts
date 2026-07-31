import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import { existsSync, mkdirSync } from 'fs'
import { resolve, join, isAbsolute } from 'path'
import { homedir } from 'os'

/**
 * Resolves the SQLite database path to an ABSOLUTE path.
 *
 * This function handles multiple environments:
 *
 * 1. Electron Desktop App (packaged):
 *    - Uses Electron's userData directory (set via process.env.ELECTRON_USER_DATA)
 *    - e.g., C:\Users\<user>\AppData\Roaming\Smart School\database\custom.db
 *
 * 2. Turso/libSQL (Vercel/production):
 *    - Passes through libsql:// URLs as-is
 *
 * 3. Local Development (Next.js dev):
 *    - Uses process.cwd() to resolve relative paths
 *    - Falls back to <project-root>/db/custom.db
 *
 * IMPORTANT: In Next.js with Turbopack, __dirname doesn't point to the
 * source file. We use process.cwd() which always returns project root.
 */
function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL

  // If using Turso/libSQL (production/Vercel), use as-is
  if (envUrl && (envUrl.startsWith('libsql://') || envUrl.startsWith('libsql+ws://'))) {
    return envUrl
  }

  // ========================================
  // Electron Desktop App - use userData directory
  // ========================================
  // When running inside Electron, the main process sets ELECTRON_USER_DATA
  // to the user's app data directory (e.g., AppData/Roaming/Smart School)
  const electronUserData = process.env.ELECTRON_USER_DATA
  if (electronUserData) {
    const dbDir = join(electronUserData, 'database')
    if (!existsSync(dbDir)) {
      try { mkdirSync(dbDir, { recursive: true }) } catch {}
    }
    const dbPath = resolve(join(dbDir, 'custom.db'))
    return `file:${dbPath}`
  }

  // ========================================
  // Local Development / Server - resolve to absolute path
  // ========================================
  const projectRoot = process.cwd()
  let dbPath: string

  if (envUrl && envUrl.startsWith('file:')) {
    let rawPath = envUrl.slice(5)
    if (rawPath.startsWith('./')) rawPath = rawPath.slice(2)
    rawPath = rawPath.replace(/^["']|["']$/g, '')
    if (!isAbsolute(rawPath)) {
      rawPath = join(projectRoot, rawPath)
    }
    dbPath = rawPath
  } else {
    // Fallback: default location at <project-root>/db/custom.db
    dbPath = join(projectRoot, 'db', 'custom.db')
  }

  dbPath = resolve(dbPath)

  // Ensure the parent directory exists
  const dbDir = resolve(dbPath, '..')
  if (!existsSync(dbDir)) {
    try { mkdirSync(dbDir, { recursive: true }) } catch {}
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
  if (isTurso) {
    const libsql = createClient({
      url: databaseUrl,
      authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
    })
    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter })
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
