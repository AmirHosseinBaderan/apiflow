export type JsonTokenType = 'key' | 'string' | 'number' | 'boolean' | 'null' | 'punct';

export interface JsonToken {
  type: JsonTokenType;
  text: string;
}

function isWs(c: string): boolean {
  return c === ' ' || c === '\t' || c === '\n' || c === '\r';
}

export function tokenizeJson(src: string): JsonToken[] {
  const out: JsonToken[] = [];
  let i = 0;
  const n = src.length;

  while (i < n) {
    const c = src[i]!;

    if (isWs(c)) {
      let s = '';
      while (i < n && isWs(src[i]!)) {
        s += src[i]!;
        i++;
      }
      out.push({ type: 'punct', text: s });
      continue;
    }

    if ('{}[]:,'.includes(c)) {
      out.push({ type: 'punct', text: c });
      i++;
      continue;
    }

    if (c === '"' || c === "'") {
      const quote = c === '"' ? '"' : "'";
      let s = c;
      i++;
      while (i < n) {
        const ch = src[i]!;
        if (ch === '\\' && i + 1 < n) {
          s += ch;
          s += src[i + 1]!;
          i += 2;
          continue;
        }
        s += ch;
        i++;
        if (ch === quote) break;
      }
      const isKey = src[i] === ':';
      out.push({ type: isKey ? 'key' : 'string', text: s });
      continue;
    }

    let s = '';
    while (i < n && !isWs(src[i]!) && !'{}[]:,'.includes(src[i]!)) {
      s += src[i]!;
      i++;
    }
    if (s === 'true' || s === 'false') out.push({ type: 'boolean', text: s });
    else if (s === 'null') out.push({ type: 'null', text: s });
    else if (/^-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?$/.test(s))
      out.push({ type: 'number', text: s });
    else out.push({ type: 'string', text: s });
  }
  return out;
}
