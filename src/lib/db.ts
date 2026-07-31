import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import { existsSync, mkdirSync } from 'fs'
import { resolve, join, isAbsolute } from 'path'

/**
 * Resolves the SQLite database path to an ABSOLUTE path.
 *
 * Priority:
 * 1. If DATABASE_URL is a libsql:// URL → use as-is (Turso/Vercel)
 * 2. If DATABASE_URL is an absolute file: path → use as-is (set by Electron)
 * 3. If ELECTRON_USER_DATA is set → use <userData>/database/custom.db
 * 4. If DATABASE_URL is a relative file: path → resolve to absolute using process.cwd()
 * 5. Fallback → use <project-root>/db/custom.db
 */
function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL

  // 1. Turso/libSQL → use as-is
  if (envUrl && (envUrl.startsWith('libsql://') || envUrl.startsWith('libsql+ws://'))) {
    return envUrl
  }

  // 2. If DATABASE_URL is already an absolute file: path, use it directly
  //    (Electron's main.js sets this to C:\Users\...\AppData\Roaming\Smart School\database\custom.db)
  if (envUrl && envUrl.startsWith('file:')) {
    let rawPath = envUrl.slice(5)
    if (rawPath.startsWith('./')) rawPath = rawPath.slice(2)
    rawPath = rawPath.replace(/^["']|["']$/g, '')

    if (isAbsolute(rawPath)) {
      // Already an absolute path — ensure directory exists, then return
      const dbDir = resolve(rawPath, '..')
      if (!existsSync(dbDir)) {
        try { mkdirSync(dbDir, { recursive: true }) } catch {}
      }
      return `file:${resolve(rawPath)}`
    }

    // Relative path — resolve using process.cwd()
    const projectRoot = process.cwd()
    rawPath = join(projectRoot, rawPath)
    const dbDir = resolve(rawPath, '..')
    if (!existsSync(dbDir)) {
      try { mkdirSync(dbDir, { recursive: true }) } catch {}
    }
    return `file:${resolve(rawPath)}`
  }

  // 3. Electron fallback — use userData directory if ELECTRON_USER_DATA is set
  //    (only when DATABASE_URL is not set at all)
  const electronUserData = process.env.ELECTRON_USER_DATA
  if (electronUserData) {
    const dbDir = join(electronUserData, 'database')
    if (!existsSync(dbDir)) {
      try { mkdirSync(dbDir, { recursive: true }) } catch {}
    }
    const dbPath = resolve(join(dbDir, 'custom.db'))
    return `file:${dbPath}`
  }

  // 4. Fallback — default location at <project-root>/db/custom.db
  const projectRoot = process.cwd()
  const dbPath = join(projectRoot, 'db', 'custom.db')
  const dbDir = resolve(dbPath, '..')
  if (!existsSync(dbDir)) {
    try { mkdirSync(dbDir, { recursive: true }) } catch {}
  }
  return `file:${resolve(dbPath)}`
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
