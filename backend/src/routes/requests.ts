import { Router, type Request, type Response } from 'express';
import { loadCollection, saveCollection } from '../config.js';
import { authMiddleware } from '../auth.js';

interface RequestItem {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: unknown[];
  queryParams: unknown[];
  pathParams: unknown[];
  body: unknown;
  auth: unknown;
  timeoutMs: number;
  retry: unknown;
  preRequest: unknown[];
  postRequest: unknown[];
  variableExtractions: unknown[];
}

export const requestsRouter = Router();

requestsRouter.use(authMiddleware);

requestsRouter.get('/:requestId', (req: Request, res: Response) => {
  const collection = loadCollection(res.locals.collectionId as string);
  if (!collection) {
    res.status(404).json({ error: 'Collection not found' });
    return;
  }
  const requests = (collection as { requests?: RequestItem[] }).requests;
  if (!requests) {
    res.status(500).json({ error: 'Collection data is corrupted: missing requests' });
    return;
  }
  const request = requests.find((r) => r.id === req.params.requestId);
  if (!request) {
    res.status(404).json({ error: 'Request not found' });
    return;
  }
  res.json(request);
});

requestsRouter.put('/:requestId', (req: Request, res: Response) => {
  const collection = loadCollection(res.locals.collectionId as string);
  if (!collection) {
    res.status(404).json({ error: 'Collection not found' });
    return;
  }
  const requests = (collection as { requests?: RequestItem[] }).requests;
  if (!requests) {
    res.status(500).json({ error: 'Collection data is corrupted: missing requests' });
    return;
  }
  const body = req.body as Partial<RequestItem>;
  const updatedRequests = requests.map((r) => (r.id === req.params.requestId ? { ...r, ...body, id: req.params.requestId } : r));
  const updated = { ...(collection as Record<string, unknown>), requests: updatedRequests, updatedAt: new Date().toISOString() };
  saveCollection(res.locals.collectionId as string, updated);
  const updatedRequest = updatedRequests.find((r) => r.id === req.params.requestId);
  res.json(updatedRequest);
});

requestsRouter.post('/', (req: Request, res: Response) => {
  const collection = loadCollection(res.locals.collectionId as string);
  if (!collection) {
    res.status(404).json({ error: 'Collection not found' });
    return;
  }
  const requests = (collection as { requests?: RequestItem[] }).requests;
  if (!requests) {
    res.status(500).json({ error: 'Collection data is corrupted: missing requests' });
    return;
  }
  const body = req.body as Partial<RequestItem>;
  const newRequest: RequestItem = {
    id: body.id || `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: body.name || 'New Request',
    method: body.method || 'GET',
    url: body.url || '',
    headers: body.headers || [],
    queryParams: body.queryParams || [],
    pathParams: body.pathParams || [],
    body: body.body || { type: 'none' },
    auth: body.auth || { type: 'none' },
    timeoutMs: body.timeoutMs || 30000,
    retry: body.retry || { enabled: false, maxAttempts: 1, initialDelayMs: 500, backoff: 'fixed', retryOn: [], retryStatusCodes: [] },
    preRequest: body.preRequest || [],
    postRequest: body.postRequest || [],
    variableExtractions: body.variableExtractions || [],
  };
  const updatedRequests = [...requests, newRequest];
  const updated = { ...(collection as Record<string, unknown>), requests: updatedRequests, updatedAt: new Date().toISOString() };
  saveCollection(res.locals.collectionId as string, updated);
  res.status(201).json(newRequest);
});

requestsRouter.delete('/:requestId', (req: Request, res: Response) => {
  const collection = loadCollection(res.locals.collectionId as string);
  if (!collection) {
    res.status(404).json({ error: 'Collection not found' });
    return;
  }
  const requests = (collection as { requests?: RequestItem[] }).requests;
  if (!requests) {
    res.status(500).json({ error: 'Collection data is corrupted: missing requests' });
    return;
  }
  const updatedRequests = requests.filter((r) => r.id !== req.params.requestId);
  const updated = { ...(collection as Record<string, unknown>), requests: updatedRequests, updatedAt: new Date().toISOString() };
  saveCollection(res.locals.collectionId as string, updated);
  res.status(204).send();
});
