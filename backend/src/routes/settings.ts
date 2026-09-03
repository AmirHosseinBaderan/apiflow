import { Router, type Request, type Response } from 'express';
import { loadSettings, saveSettings } from '../config.js';
import { authMiddleware, adminOnly } from '../auth.js';

export const settingsRouter = Router();

settingsRouter.get('/', authMiddleware, (_req: Request, res: Response) => {
  res.json(loadSettings());
});

settingsRouter.post('/', authMiddleware, adminOnly, (req: { body: Record<string, unknown> }, res: Response) => {
  const settings = loadSettings();
  const updated = { ...settings, ...req.body };
  saveSettings(updated);
  res.json(updated);
});
