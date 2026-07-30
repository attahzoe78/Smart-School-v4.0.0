import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuf = scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(hash, "hex");
  if (hashBuf.length !== storedBuf.length) return false;
  return timingSafeEqual(hashBuf, storedBuf);
}

export function generateId(prefix: string = ""): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(4).toString("hex").toUpperCase();
  return prefix ? `${prefix}-${ts}${rand}` : `${ts}${rand}`;
}

export function generateAdmissionNo(): string {
  const year = new Date().getFullYear();
  const rand = randomBytes(3).toString("hex").toUpperCase().slice(0, 5);
  return `ADM/${year}/${rand}`;
}

export function generateInvoiceNo(): string {
  const year = new Date().getFullYear();
  const rand = randomBytes(3).toString("hex").toUpperCase().slice(0, 6);
  return `INV/${year}/${rand}`;
}

export function generatePaymentNo(): string {
  const year = new Date().getFullYear();
  const rand = randomBytes(3).toString("hex").toUpperCase().slice(0, 6);
  return `PAY/${year}/${rand}`;
}
