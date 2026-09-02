import express, { type Request, type Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const uploads = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'api-flow-backend' });
});

app.post('/files', uploads.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'Missing file' });
    return;
  }
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  res.json({
    id,
    name: req.file.originalname,
    size: req.file.size,
    contentType: req.file.mimetype,
  });
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

const staticDir = join(__dirname, '../../dist');
app.use(express.static(staticDir));
app.get(/^(?!\/api|\/health|\/files|\/proxy).*/, (_req: Request, res: Response) => {
  res.sendFile(join(staticDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`api-flow backend listening on http://localhost:${port}`);
});
