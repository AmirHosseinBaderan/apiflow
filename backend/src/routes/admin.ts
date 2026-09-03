import bcrypt from 'bcryptjs';
import { Router, type Request, type Response } from 'express';
import {
  loadUser,
  saveUser,
  listUserFiles,
  deleteUserFile,
} from '../config.js';
import { authMiddleware, adminOnly, getAuth, type AuthPayload } from '../auth.js';

export const adminRouter = Router();

adminRouter.use(authMiddleware);
adminRouter.use(adminOnly);

adminRouter.get('/users', (_req: Request, res: Response) => {
  const files = listUserFiles();
  const users = files
    .map((f) => {
      const name = f.replace('.json', '');
      const u = loadUser(name);
      if (!u) return null;
      const { passwordHash: _, ...rest } = u;
      return rest;
    })
    .filter(Boolean);
  res.json(users);
});

adminRouter.post('/users', async (req: { body: Record<string, unknown> }, res: Response) => {
  const { username, password, role } = req.body as {
    username?: string;
    password?: string;
    role?: string;
  };
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const existing = loadUser(username);
  if (existing) {
    res.status(409).json({ error: 'User already exists' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: crypto.randomUUID(),
    username,
    passwordHash,
    role: (role === 'user' ? 'user' : 'admin') as 'admin' | 'user',
    createdAt: new Date().toISOString(),
  };
  saveUser(user);
  const { passwordHash: _, ...rest } = user;
  res.status(201).json(rest);
});

adminRouter.put('/users/:username', async (req: Request, res: Response) => {
  const username = req.params.username;
  const user = loadUser(username);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const { password, role } = req.body as {
    password?: string;
    role?: string;
  };
  const updated = { ...user };
  if (password) {
    updated.passwordHash = await bcrypt.hash(password, 10);
  }
  if (role) {
    updated.role = role === 'user' ? 'user' : 'admin';
  }
  saveUser(updated);
  const { passwordHash: _, ...rest } = updated;
  res.json(rest);
});

adminRouter.delete('/users/:username', (req: Request, res: Response) => {
  const username = req.params.username;
  const auth = getAuth(req) as AuthPayload;
  if (username === auth.username) {
    res.status(400).json({ error: 'Cannot delete yourself' });
    return;
  }
  deleteUserFile(username);
  res.status(204).send();
});
