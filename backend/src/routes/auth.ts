import bcrypt from 'bcryptjs';
import { Router, type Request, type Response } from 'express';
import {
  loadSettings,
  saveSettings,
  loadUser,
  saveUser,
} from '../config.js';
import { generateToken } from '../auth.js';

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
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: crypto.randomUUID(),
      username,
      passwordHash,
      role: 'admin' as const,
      createdAt: new Date().toISOString(),
    };
    saveUser(user);

    settings.setupComplete = true;
    settings.multiUser = Boolean(multiUser);
    settings.forceLogin = Boolean(forceLogin);
    saveSettings(settings);

    const token = generateToken({ username, role: 'admin' });
    res.json({ token, user: { username, role: 'admin' } });
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
