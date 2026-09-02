export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

export class ResponseExtractor {
  extract(bodyText: string, path: string): string | undefined {
    if (!path || path === '$' || path === '' || path === '.') {
      return bodyText;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(bodyText);
    } catch {
      return undefined;
    }
    const value = this.resolvePath(parsed, path);
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return JSON.stringify(value);
  }

  resolvePath(root: unknown, path: string): unknown {
    const tokens = tokenize(path);
    let current: unknown = root;
    for (const token of tokens) {
      if (current === null || current === undefined) return undefined;
      if (token.kind === 'key') {
        if (typeof current !== 'object' || Array.isArray(current)) return undefined;
        current = (current as Record<string, unknown>)[token.value];
      } else if (token.kind === 'index') {
        if (!Array.isArray(current)) return undefined;
        current = current[token.value];
      }
    }
    return current;
  }
}

type Token =
  | { readonly kind: 'key'; readonly value: string }
  | { readonly kind: 'index'; readonly value: number };

function tokenize(path: string): Token[] {
  const tokens: Token[] = [];
  const normalized = path.replace(/^\$\.?/, '').replace(/^\./, '');
  if (!normalized) return tokens;
  const parts = normalized.split('.');
  for (const part of parts) {
    const arrayMatches = part.match(/^([a-zA-Z_][\w-]*)?(\[(\d+)\])+$/);
    if (arrayMatches) {
      const [, baseName, , ] = arrayMatches;
      if (baseName) tokens.push({ kind: 'key', value: baseName });
      const indices = part.match(/\[(\d+)\]/g) ?? [];
      for (const idx of indices) {
        tokens.push({ kind: 'index', value: Number(idx.slice(1, -1)) });
      }
    } else if (/^\d+$/.test(part)) {
      tokens.push({ kind: 'index', value: Number(part) });
    } else {
      tokens.push({ kind: 'key', value: part });
    }
  }
  return tokens;
}

export const responseExtractor = new ResponseExtractor();