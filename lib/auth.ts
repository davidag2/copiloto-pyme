import { pbkdf2Sync, randomBytes, timingSafeEqual, createHash } from "crypto";

const iterations = 120_000;
const keyLength = 64;
const digest = "sha512";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, iterations, keyLength, digest).toString("hex");
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string | null | undefined) {
  if (!storedHash) return false;
  const [scheme, iterationValue, salt, originalHash] = storedHash.split("$");
  if (scheme !== "pbkdf2" || !iterationValue || !salt || !originalHash) return false;
  const nextHash = pbkdf2Sync(password, salt, Number(iterationValue), keyLength, digest);
  const originalBuffer = Buffer.from(originalHash, "hex");
  return originalBuffer.length === nextHash.length && timingSafeEqual(originalBuffer, nextHash);
}

export function createPlainToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function requirePassword(value: unknown) {
  if (typeof value !== "string" || value.length < 8) {
    throw new Error("La contrasena debe tener minimo 8 caracteres.");
  }
  return value;
}
