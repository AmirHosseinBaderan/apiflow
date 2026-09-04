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
      if (!raw) return null;
      const collection = raw as Record<string, unknown>;
      const requests = (collection.requests as Array<{ id?: string; name?: string; method?: string; url?: string }> || []).map(
        (r) => ({
          id: r.id,
          name: r.name,
          method: r.method,
          url: r.url,
        }),
      );
      const { workflows, ...rest } = collection;
      return { ...rest, requests, workflows };
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
  const collection = raw as Record<string, unknown>;
  const summaries = (collection.requests as Array<{ id?: string; name?: string; method?: string; url?: string }> || []).map(
    (r) => ({
      id: r.id,
      name: r.name,
      method: r.method,
      url: r.url,
    }),
  );
  const { requests: _r, workflows, ...rest } = collection;
  res.json({ ...rest, requests: summaries, workflows });
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

collectionsRouter.put('/:id/variables', (req: Request, res: Response) => {
  const id = req.params.id;
  const raw = loadCollection(id);
  if (!raw) {
    res.status(404).json({ error: 'Collection not found' });
    return;
  }
  const updated = { ...(raw as Record<string, unknown>), variables: req.body, updatedAt: new Date().toISOString() };
  saveCollection(id, updated);
  res.json(updated.variables);
});

collectionsRouter.put('/:id/workflows', (req: Request, res: Response) => {
  const id = req.params.id;
  const raw = loadCollection(id);
  if (!raw) {
    res.status(404).json({ error: 'Collection not found' });
    return;
  }
  const updated = { ...(raw as Record<string, unknown>), workflows: req.body, updatedAt: new Date().toISOString() };
  saveCollection(id, updated);
  res.json(updated.workflows);
});

collectionsRouter.put('/:id/folders/:folderId', (req: Request, res: Response) => {
  const id = req.params.id;
  const raw = loadCollection(id);
  if (!raw) {
    res.status(404).json({ error: 'Collection not found' });
    return;
  }
  const { name } = req.body as { name?: string };
  if (!name) {
    res.status(400).json({ error: 'Folder name is required' });
    return;
  }
  const collection = raw as Record<string, unknown>;
  const folders = (collection.folders as Array<{ id?: string; name?: string; parentId?: string | null; requestIds?: string[]; childFolderIds?: string[] }> || []).map((f) =>
    f.id === req.params.folderId ? { ...f, name } : f,
  );
  const updated = { ...collection, folders, updatedAt: new Date().toISOString() };
  saveCollection(id, updated);
  res.json(folders.find((f) => f.id === req.params.folderId));
});

collectionsRouter.delete('/:id/folders/:folderId', (req: Request, res: Response) => {
  const id = req.params.id;
  const raw = loadCollection(id);
  if (!raw) {
    res.status(404).json({ error: 'Collection not found' });
    return;
  }
  const collection = raw as Record<string, unknown>;
  const folderId = req.params.folderId;
  const folders = (collection.folders as Array<{ id?: string; name?: string; parentId?: string | null; requestIds?: string[]; childFolderIds?: string[] }> || []).filter(
    (f) => f.id !== folderId,
  );
  const requests = (collection.requests as Array<{ id?: string; name?: string; method?: string; url?: string }> || []).filter(
    (r) => !(collection.folders as Array<{ id?: string; requestIds?: string[] }> || []).some((f) => f.requestIds?.includes(r.id || '')),
  );
  const updated = { ...collection, folders, requests, updatedAt: new Date().toISOString() };
  saveCollection(id, updated);
  res.status(204).send();
});
