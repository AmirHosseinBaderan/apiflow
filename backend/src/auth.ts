import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

export interface AuthPayload {
  username: string;
  role: 'admin' | 'user';
}

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const token = header.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
  (req as unknown as { auth: AuthPayload }).auth = payload;
  next();
}

export function adminOnly(req: Request, res: Response, next: NextFunction): void {
  const auth = (req as unknown as { auth: AuthPayload }).auth;
  if (!auth || auth.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: admin only' });
    return;
  }
  next();
}

export function getAuth(req: Request): AuthPayload | undefined {
  return (req as unknown as { auth?: AuthPayload }).auth;
}
