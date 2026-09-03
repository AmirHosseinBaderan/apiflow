import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { authRouter } from './routes/auth.js';
import { settingsRouter } from './routes/settings.js';
import { adminRouter } from './routes/admin.js';
import { collectionsRouter } from './routes/collections.js';
import { requestsRouter } from './routes/requests.js';
import { filesRouter } from './routes/files.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'api-flow-backend' });
});

app.get('/proxy/openapi', async (req: Request, res: Response) => {
  const url = String(req.query.url ?? '');
  if (!url) {
    res.status(400).json({ error: 'Missing url' });
    return;
  }
  try {
    const upstream = await fetch(url);
    const text = await upstream.text();
    const ct = upstream.headers.get('content-type');
    if (ct) res.setHeader('content-type', ct);
    res.status(upstream.status).send(text);
  } catch (e) {
    res.status(502).json({ error: 'Fetch failed', message: (e as Error).message });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/collections', collectionsRouter);
collectionsRouter.use('/:id', requestsRouter);
app.use('/api/files', filesRouter);

const staticDir = join(__dirname, '../../dist');
app.use(express.static(staticDir));
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(join(staticDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`api-flow backend listening on http://localhost:${port}`);
});
