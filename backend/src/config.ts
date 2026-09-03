import fs from 'node:fs';
import path from 'node:path';

export type Settings = {
  setupComplete: boolean;
  multiUser: boolean;
  forceLogin: boolean;
  appName: string;
  defaultTheme: 'light' | 'dark';
  defaultLocale: 'en' | 'fa';
};

export const DEFAULT_SETTINGS: Settings = {
  setupComplete: false,
  multiUser: false,
  forceLogin: false,
  appName: 'API Flow',
  defaultTheme: 'dark',
  defaultLocale: 'en',
};

export function getDataDir(): string {
  return process.env.DATA_DIR || process.env.VOLUME_PATH || './data';
}

export function getConfigPath(): string {
  return path.join(getDataDir(), 'config', 'settings.json');
}

export function getUsersDir(): string {
  return path.join(getDataDir(), 'users');
}

export function getCollectionsDir(): string {
  return path.join(getDataDir(), 'collections');
}

export function getFilesDir(): string {
  return path.join(getDataDir(), 'files');
}

export function ensureDirs(): void {
  const dirs = [
    path.dirname(getConfigPath()),
    getUsersDir(),
    getCollectionsDir(),
    getFilesDir(),
  ];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

export function loadSettings(): Settings {
  const p = getConfigPath();
  if (!fs.existsSync(p)) return { ...DEFAULT_SETTINGS };
  try {
    const raw = fs.readFileSync(p, 'utf-8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings): void {
  ensureDirs();
  fs.writeFileSync(getConfigPath(), JSON.stringify(settings, null, 2), 'utf-8');
}

export function listUserFiles(): string[] {
  const dir = getUsersDir();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
}

export function loadUser(username: string): { id: string; username: string; passwordHash: string; role: 'admin' | 'user'; createdAt: string } | null {
  const p = path.join(getUsersDir(), `${username}.json`);
  if (!fs.existsSync(p)) return null;
  try {
    const raw = fs.readFileSync(p, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveUser(user: { id: string; username: string; passwordHash: string; role: 'admin' | 'user'; createdAt: string }): void {
  ensureDirs();
  fs.writeFileSync(path.join(getUsersDir(), `${user.username}.json`), JSON.stringify(user, null, 2), 'utf-8');
}

export function deleteUserFile(username: string): void {
  const p = path.join(getUsersDir(), `${username}.json`);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

export function listCollections(): string[] {
  const dir = getCollectionsDir();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
}

export function loadCollection(id: string): unknown | null {
  const p = path.join(getCollectionsDir(), `${id}.json`);
  if (!fs.existsSync(p)) return null;
  try {
    const raw = fs.readFileSync(p, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveCollection(id: string, data: unknown): void {
  ensureDirs();
  fs.writeFileSync(path.join(getCollectionsDir(), `${id}.json`), JSON.stringify(data, null, 2), 'utf-8');
}

export function deleteCollectionFile(id: string): void {
  const p = path.join(getCollectionsDir(), `${id}.json`);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

export function saveUploadedFile(id: string, buffer: Buffer, contentType: string): string {
  ensureDirs();
  const ext = getExtension(contentType);
  const filePath = path.join(getFilesDir(), `${id}${ext}`);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

export function getUploadedFilePath(id: string): string | null {
  const dir = getFilesDir();
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) => f.startsWith(id));
  if (files.length === 0) return null;
  return path.join(dir, files[0]);
}

export function deleteUploadedFile(id: string): void {
  const p = getUploadedFilePath(id);
  if (p && fs.existsSync(p)) fs.unlinkSync(p);
}

export function getFileStats(id: string): { name: string; size: number; contentType: string } | null {
  const p = getUploadedFilePath(id);
  if (!p) return null;
  const stat = fs.statSync(p);
  const ext = path.extname(p);
  const contentType = extToContentType(ext);
  return { name: path.basename(p), size: stat.size, contentType };
}

function getExtension(contentType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
    'text/plain': '.txt',
    'application/json': '.json',
    'text/javascript': '.js',
    'text/css': '.css',
    'text/html': '.html',
    'application/zip': '.zip',
    'application/octet-stream': '.bin',
  };
  return map[contentType] || '.bin';
}

function extToContentType(ext: string): string {
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.json': 'application/json',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.zip': 'application/zip',
  };
  return map[ext] || 'application/octet-stream';
}
