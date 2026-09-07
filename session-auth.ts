import crypto from 'node:crypto';

const SECRET = process.env.SESSION_SIGNING_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'local-development-session-secret');

function encode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function sign(payload: string) {
  if (!SECRET) throw new Error('SESSION_SIGNING_SECRET is required in production.');
  return crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
}

export function issueSession(clientId: string) {
  const safeId = clientId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 96);
  const payload = `${encode(safeId)}.${encode(String(Date.now()))}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySession(token: string) {
  if (!SECRET) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [payload, timestamp, signature] = parts;
  const expected = sign(`${payload}.${timestamp}`);
  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const issuedAt = Number(Buffer.from(timestamp, 'base64url').toString('utf8'));
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > 1000 * 60 * 60 * 24 * 90) return null;
  return Buffer.from(payload, 'base64url').toString('utf8') || null;
}
