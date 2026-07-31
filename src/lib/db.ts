import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import { existsSync, mkdirSync } from 'fs'
import { resolve, join, isAbsolute } from 'path'

/**
 * Resolves the SQLite database path to an ABSOLUTE path.
 *
 * Prisma resolves relative `file:` paths relative to the schema file
 * location (prisma/schema.prisma), NOT the project root or CWD.
 * This causes "Unable to open database file" (error code 14) when
 * the path resolves to a non-existent directory.
 *
 * IMPORTANT: In Next.js with Turbopack, `__dirname` does NOT point to
 * the source file location — it points to a bundled location in .next/server/.
 * We use `process.cwd()` instead, which always returns the project root
 * in Next.js (both dev and production).
 *
 * Fix: Always resolve to an absolute path using process.cwd().
 */
function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL

  // If using Turso/libSQL (production/Vercel), use as-is
  if (envUrl && (envUrl.startsWith('libsql://') || envUrl.startsWith('libsql+ws://'))) {
    return envUrl
  }

  // For local SQLite, resolve to an absolute path
  // process.cwd() always returns the project root in Next.js
  const projectRoot = process.cwd()
  let dbPath: string

  if (envUrl && envUrl.startsWith('file:')) {
    // Strip the "file:" prefix
    let rawPath = envUrl.slice(5)
    // Remove leading ./ if present
    if (rawPath.startsWith('./')) rawPath = rawPath.slice(2)
    // Remove surrounding quotes if present (from .env parsing edge cases)
    rawPath = rawPath.replace(/^["']|["']$/g, '')
    // If not absolute, resolve relative to project root
    if (!isAbsolute(rawPath)) {
      rawPath = join(projectRoot, rawPath)
    }
    dbPath = rawPath
  } else {
    // Fallback: default location at <project-root>/db/custom.db
    dbPath = join(projectRoot, 'db', 'custom.db')
  }

  // Normalize the path (resolve any .. or . segments)
  dbPath = resolve(dbPath)

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

// Make the resolved URL available to Prisma (in case it was a relative path)
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
