import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

export function getAdminSecretKey(): string {
  const key = process.env.SESSION_SECRET || process.env.ADMIN_SECRET_KEY;
  if (key && key.trim().length > 0) {
    return key.trim();
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: ADMIN_SECRET_KEY (or SESSION_SECRET) must be set in production environment variables. Hardcoded defaults are rejected in production.');
  }
  return 'qevorin_neon_admin_secret_key_2026_morocco';
}

export function getAdminPassword(): string {
  const pwd = process.env.ADMIN_PASSWORD;
  if (pwd && pwd.trim().length > 0) {
    return pwd.trim();
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: ADMIN_PASSWORD must be set in production environment variables. Default passwords are rejected in production.');
  }
  return 'qevorin2026';
}

export function verifyAdminPassword(password: string): boolean {
  if (!password) return false;
  const cleanInput = password.trim();

  // Primary check: Constant-time comparison against configured ADMIN_PASSWORD
  const cleanExpected = getAdminPassword();
  const bufA = Buffer.from(cleanInput);
  const bufB = Buffer.from(cleanExpected);
  if (bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)) {
    return true;
  }

  // Development convenience: Also accept 'qevorin2026' in non-production mode
  if (process.env.NODE_ENV !== 'production') {
    const bufDev = Buffer.from('qevorin2026');
    if (bufA.length === bufDev.length && crypto.timingSafeEqual(bufA, bufDev)) {
      return true;
    }
  }

  return false;
}

export function generateAdminToken(): { token: string; expiresAt: number } {
  const timestamp = Date.now();
  const expiresAt = timestamp + 24 * 60 * 60 * 1000; // 24 hours
  const payload = `qevorin_admin:${timestamp}:${expiresAt}`;
  const secret = getAdminSecretKey();
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const token = Buffer.from(`${payload}:${hmac}`).toString('base64');
  return { token, expiresAt };
}

export function verifyAdminToken(token: string): boolean {
  try {
    if (!token) return false;
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 4) return false;

    const [prefix, timestampStr, expiresAtStr, receivedHmac] = parts;
    if (prefix !== 'qevorin_admin') return false;

    const expiresAt = parseInt(expiresAtStr, 10);
    if (Date.now() > expiresAt) return false;

    const payload = `${prefix}:${timestampStr}:${expiresAtStr}`;
    const secret = getAdminSecretKey();
    const expectedHmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    const bufReceived = Buffer.from(receivedHmac);
    const bufExpected = Buffer.from(expectedHmac);
    if (bufReceived.length !== bufExpected.length) return false;

    return crypto.timingSafeEqual(bufReceived, bufExpected);
  } catch {
    return false;
  }
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const adminTokenHeader = req.headers['x-admin-token'] as string | undefined;

  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (adminTokenHeader) {
    token = adminTokenHeader.trim();
  }

  if (!token || !verifyAdminToken(token)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Administrative access required.',
    });
  }

  next();
}

// ============================================================================
// AES-256-GCM ENCRYPTION AT REST (NEON DATABASE STORAGE)
function getCipherKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY || getAdminSecretKey();
  return crypto.createHash('sha256').update(raw).digest(); // 32 bytes
}

export function encryptAtRest(plainText: string): string {
  if (!plainText) return '';
  const iv = crypto.randomBytes(12); // 96-bit IV
  const cipher = crypto.createCipheriv('aes-256-gcm', getCipherKey(), iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `enc:v1:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptAtRest(cipherText: string): string {
  if (!cipherText) return '';
  if (!cipherText.startsWith('enc:v1:')) {
    // Return as-is if unencrypted or legacy
    return cipherText;
  }
  try {
    const parts = cipherText.split(':');
    if (parts.length !== 5) return '';
    const iv = Buffer.from(parts[2], 'hex');
    const authTag = Buffer.from(parts[3], 'hex');
    const encrypted = parts[4];
    const decipher = crypto.createDecipheriv('aes-256-gcm', getCipherKey(), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption at rest failed:', err);
    return '';
  }
}

