import bcrypt from 'bcryptjs';
import { Router, type Request, type Response } from 'express';
import {
  loadSettings,
  saveSettings,
  loadUser,
  saveUser,
} from '../config.js';
import {generateToken, getAuth, authMiddleware} from '../auth.js';

export const authRouter = Router();

authRouter.post('/setup', async (req: { body: Record<string, unknown> }, res: Response) => {
  try {
    const settings = loadSettings();
    if (settings.setupComplete) {
      res.status(400).json({ error: 'Setup already completed' });
      return;
    }

    const { username, password, multiUser, forceLogin } = req.body as {
      username?: string;
      password?: string;
      multiUser?: boolean;
      forceLogin?: boolean;
    };

    const isMultiUser = Boolean(multiUser);
    if (isMultiUser && (!username || !password)) {
      res.status(400).json({ error: 'Username and password are required for multi-user mode' });
      return;
    }

    const finalUsername: string = isMultiUser ? username! : (username || 'admin');
    const finalPassword: string = isMultiUser ? password! : (password || 'admin');

    const passwordHash = await bcrypt.hash(finalPassword, 10);
    const user = {
      id: crypto.randomUUID(),
      username: finalUsername,
      passwordHash,
      role: 'admin' as const,
      createdAt: new Date().toISOString(),
    };
    saveUser(user);

    settings.setupComplete = true;
    settings.multiUser = isMultiUser;
    settings.forceLogin = Boolean(forceLogin);
    saveSettings(settings);

    const token = generateToken({ username: finalUsername, role: 'admin' });
    res.json({ token, user: { username: finalUsername, role: 'admin' } });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

authRouter.post('/login', async (req: { body: Record<string, unknown> }, res: Response) => {
  try {
    const { username, password } = req.body as {
      username?: string;
      password?: string;
    };
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    const user = loadUser(username);
    if (!user) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const token = generateToken({ username: user.username, role: user.role });
    res.json({ token, user: { username: user.username, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

authRouter.get('/check', (_req: Request, res: Response) => {
  const settings = loadSettings();
  res.json({
    setupComplete: settings.setupComplete,
    multiUser: settings.multiUser,
    forceLogin: settings.forceLogin,
    appName: settings.appName,
  });
});

authRouter.put('/profile', authMiddleware, async (req: Request, res: Response) => {
  const auth = getAuth(req);
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const user = loadUser(auth.username);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const { username, password, currentPassword } = req.body as {
    username?: string;
    password?: string;
    currentPassword?: string;
  };

  if (password) {
    if (!currentPassword) {
      res.status(400).json({ error: 'Current password is required to change password' });
      return;
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid current password' });
      return;
    }
  }

  const updated = { ...user };
  if (username && username !== user.username) {
    const existing = loadUser(username);
    if (existing) {
      res.status(409).json({ error: 'Username already taken' });
      return;
    }
    updated.username = username;
  }
  if (password) {
    updated.passwordHash = await bcrypt.hash(password, 10);
  }
  saveUser(updated);
  const { passwordHash: _, ...rest } = updated;
  res.json(rest);
});
