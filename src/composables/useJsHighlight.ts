export type JsTokenType =
  | 'keyword'
  | 'builtin'
  | 'comment'
  | 'string'
  | 'template'
  | 'number'
  | 'regex'
  | 'punct'
  | 'ident'
  | 'ws';

export interface JsToken {
  type: JsTokenType;
  text: string;
}

const KEYWORDS: ReadonlySet<string> = new Set([
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'export',
  'extends',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'new',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
  'let',
  'static',
  'enum',
  'await',
  'implements',
  'interface',
  'package',
  'private',
  'protected',
  'public',
  'true',
  'false',
  'null',
  'undefined',
]);

const BUILTINS: ReadonlySet<string> = new Set([
  'undefined',
  'NaN',
  'Infinity',
  'eval',
  'isFinite',
  'isNaN',
  'parseInt',
  'parseFloat',
  'encodeURI',
  'encodeURIComponent',
  'decodeURI',
  'decodeURIComponent',
  'Object',
  'Function',
  'Boolean',
  'Symbol',
  'Number',
  'BigInt',
  'Math',
  'Date',
  'String',
  'Array',
  'ArrayBuffer',
  'SharedArrayBuffer',
  'Error',
  'EvalError',
  'RangeError',
  'ReferenceError',
  'SyntaxError',
  'TypeError',
  'URIError',
  'JSON',
  'Reflect',
  'Proxy',
  'WeakMap',
  'WeakSet',
  'Map',
  'Set',
  'Promise',
  'Atomics',
  'fetch',
  'setTimeout',
  'clearTimeout',
  'setInterval',
  'clearInterval',
  'console',
  'globalThis',
]);

function isRegexContext(prev: string | null): boolean {
  if (!prev) return true;
  if (prev === ')' || prev === ']' || prev === '}') return false;
  if (prev === '++' || prev === '--') return false;
  if (KEYWORDS.has(prev) || BUILTINS.has(prev)) return true;
  return /^[-+*/%&|:=!?<>?~^;,({[]$/.test(prev);
}

function isIdentStart(c: string): boolean {
  return /[A-Za-z_$]/.test(c);
}

function isIdentPart(c: string): boolean {
  return /[\w$]/.test(c);
}

const REGEX_RE = /\/(?:\\.|[^\\/\n])+\/[gimuy]*/;

export function tokenizeJs(source: string): JsToken[] {
  const tokens: JsToken[] = [];
  const n = source.length;
  let i = 0;
  let prevSignificant: string | null = null;

  function push(type: JsTokenType, text: string): void {
    tokens.push({ type, text });
    if (type !== 'ws') prevSignificant = text;
  }

  while (i < n) {
    const c = source[i]!;

    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
      let j = i + 1;
      while (j < n && /[ \t\r\n]/.test(source[j]!)) j++;
      push('ws', source.slice(i, j));
      i = j;
      continue;
    }

    if (isIdentStart(c)) {
      let j = i + 1;
      while (j < n && isIdentPart(source[j]!)) j++;
      const word = source.slice(i, j);
      if (KEYWORDS.has(word)) push('keyword', word);
      else if (BUILTINS.has(word)) push('builtin', word);
      else push('ident', word); // identifiers render with default color
      i = j;
      continue;
    }

    if (c === '0' && /[xX]/.test(source[i + 1] ?? '')) {
      const m = source.slice(i).match(/^0[xX][0-9a-fA-F]+/);
      if (m) {
        push('number', m[0]);
        i += m[0].length;
        continue;
      }
    }

    if (/\d/.test(c) || (c === '.' && /\d/.test(source[i + 1] ?? ''))) {
      const m = source.slice(i).match(
        /^(0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+|\.\d+(?:[eE][+-]?\d+)?|\d*\.\d+(?:[eE][+-]?\d+)?|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\d+\.)/,
      );
      if (m) {
        push('number', m[0]);
        i += m[0].length;
        continue;
      }
    }

    if (c === '/' && source[i + 1] === '/') {
      let j = i + 2;
      while (j < n && source[j] !== '\n') j++;
      push('comment', source.slice(i, j));
      i = j;
      continue;
    }

    if (c === '/' && source[i + 1] === '*') {
      let j = i + 2;
      while (j < n && !(source[j] === '*' && source[j + 1] === '/')) j++;
      const end = j + 2; // include closing */
      push('comment', source.slice(i, end > n ? n : end));
      i = end > n ? n : end;
      continue;
    }

    if (c === '/') {
      if (source[i + 1] === '=') {
        push('punct', '/=');
        i += 2;
        continue;
      }
      if (prevSignificant !== null && !isRegexContext(prevSignificant)) {
        push('punct', '/');
        i += 1;
        continue;
      }
      const m = source.slice(i).match(REGEX_RE);
      if (m) {
        push('regex', m[0]);
        i += m[0].length;
        prevSignificant = 'regex';
        continue;
      }
      push('punct', '/');
      i += 1;
      continue;
    }

    if (c === '"' || c === "'") {
      const quote = c;
      let j = i + 1;
      let s = quote;
      while (j < n) {
        const ch = source[j]!;
        if (ch === '\\' && j + 1 < n) {
          s += ch + source[j + 1]!;
          j += 2;
          continue;
        }
        s += ch;
        j++;
        if (ch === quote) break;
      }
      push('string', s);
      i = j;
      continue;
    }

    if (c === '`') {
      let j = i + 1;
      let s = '`';
      while (j < n && source[j] !== '`') {
        if (source[j] === '\\' && j + 1 < n) {
          s += source[j]! + source[j + 1]!;
          j += 2;
          continue;
        }
        s += source[j]!;
        j++;
      }
      if (j < n) {
        s += '`';
        j++;
      }
      push('template', s);
      i = j;
      continue;
    }

    push('punct', c);
    i += 1;
  }

  return tokens;
}
