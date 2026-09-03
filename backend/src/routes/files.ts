import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import {
  saveUploadedFile,
  getUploadedFilePath,
  getFileStats,
  deleteUploadedFile,
} from '../config.js';
import { authMiddleware } from '../auth.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

export const filesRouter = Router();

filesRouter.use(authMiddleware);

filesRouter.post('/upload', upload.single('file'), (req: { file?: Express.Multer.File }, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'Missing file' });
    return;
  }
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  saveUploadedFile(id, req.file.buffer, req.file.mimetype);
  res.json({
    id,
    name: req.file.originalname,
    size: req.file.size,
    contentType: req.file.mimetype,
  });
});

filesRouter.get('/:id', (req: Request, res: Response) => {
  const p = getUploadedFilePath(req.params.id);
  if (!p) {
    res.status(404).json({ error: 'File not found' });
    return;
  }
  const stats = getFileStats(req.params.id);
  if (stats) {
    res.setHeader('Content-Type', stats.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(stats.name)}"`);
  }
  res.sendFile(p);
});

filesRouter.delete('/:id', (_req: Request, res: Response) => {
  deleteUploadedFile(_req.params.id);
  res.status(204).send();
});
