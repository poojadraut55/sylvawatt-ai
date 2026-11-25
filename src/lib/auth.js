/*
 * Author: DevOps Invent Private Limited
 * Copyright 2026 DevOps Invent Private Limited. All rights reserved.
 */
'use strict';

/** Local session authentication using built-in Node crypto (scrypt + SHA-256 session tokens). */
const crypto = require('node:crypto');

const SCRYPT = Object.freeze({ N: 16384, r: 8, p: 1, keylen: 64 });
const ROLE_RANK = Object.freeze({ provider: 1, enterprise: 2, admin: 3 });

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, N, r, p, saltB64, hashB64] = parts;
  const expected = Buffer.from(hashB64, 'base64');
  try {
    const actual = crypto.scryptSync(String(password), Buffer.from(saltB64, 'base64'), expected.length, {
      N: Number(N), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024,
    });
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    try { out[key] = decodeURIComponent(val); } catch { out[key] = val; }
  }
  return out;
}

function hasRole(user, minRole) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (minRole === 'enterprise') return user.role === 'enterprise' || user.role === 'admin';
  return (ROLE_RANK[user.role] || 0) >= (ROLE_RANK[minRole] || 99);
}

class SessionStore {
  constructor({ ttlMs = 24 * 60 * 60 * 1000, now = () => Date.now() } = {}) {
    this.ttlMs = ttlMs;
    this.now = now;
    this.sessions = new Map();
  }

  static digest(token) {
    return crypto.createHash('sha256').update(String(token)).digest('hex');
  }

  create(userId) {
    const token = crypto.randomBytes(32).toString('base64url');
    this.sessions.set(SessionStore.digest(token), {
      userId,
      expires: this.now() + this.ttlMs,
    });
    return token;
  }

  get(token) {
    if (!token) return null;
    const key = SessionStore.digest(token);
    const session = this.sessions.get(key);
    if (!session) return null;
    if (this.now() > session.expires) {
      this.sessions.delete(key);
      return null;
    }
    return session;
  }

  revoke(token) {
    if (!token) return false;
    return this.sessions.delete(SessionStore.digest(token));
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  parseCookies,
  hasRole,
  SessionStore,
};
