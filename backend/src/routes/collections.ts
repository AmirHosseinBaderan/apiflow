import { Router, type Request, type Response } from 'express';
import { loadCollection, saveCollection, listCollections, deleteCollectionFile } from '../config.js';
import { authMiddleware } from '../auth.js';

export const collectionsRouter = Router();

collectionsRouter.use(authMiddleware);

collectionsRouter.get('/', (_req: Request, res: Response) => {
  const files = listCollections();
  const collections = files
    .map((f) => {
      const raw = loadCollection(f.replace('.json', ''));
      return raw;
    })
    .filter(Boolean);
  res.json(collections);
});

collectionsRouter.get('/:id', (req: Request, res: Response) => {
  const raw = loadCollection(req.params.id);
  if (!raw) {
    res.status(404).json({ error: 'Collection not found' });
    return;
  }
  res.json(raw);
});

collectionsRouter.post('/', (req: { body: Record<string, unknown> }, res: Response) => {
  const data = req.body;
  const id = (data.id as string) || `col_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const withId = { ...data, id };
  saveCollection(id, withId);
  res.status(201).json(withId);
});

collectionsRouter.put('/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const raw = loadCollection(id);
  if (!raw) {
    res.status(404).json({ error: 'Collection not found' });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const updated = { ...(raw as Record<string, unknown>), ...body, id };
  saveCollection(id, updated);
  res.json(updated);
});

collectionsRouter.delete('/:id', (_req: Request, res: Response) => {
  deleteCollectionFile(_req.params.id);
  res.status(204).send();
});
