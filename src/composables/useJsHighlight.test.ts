import { describe, expect, it } from 'vitest';
import { tokenizeJs } from '@composables/useJsHighlight';

describe('tokenizeJs', () => {
  it('classifies keywords and numbers', () => {
    const tokens = tokenizeJs('return 42');
    expect(tokens.find((t) => t.text === 'return')?.type).toBe('keyword');
    expect(tokens.find((t) => t.text === '42')?.type).toBe('number');
  });

  it('classifies line comments', () => {
    const tokens = tokenizeJs('// hello\n');
    expect(tokens.find((t) => t.text === '// hello')?.type).toBe('comment');
  });

  it('classifies block comments', () => {
    const tokens = tokenizeJs('/* hi */');
    expect(tokens.find((t) => t.text === '/* hi */')?.type).toBe('comment');
  });

  it('classifies single and double quoted strings', () => {
    expect(tokenizeJs("'hi'").find((t) => t.text === "'hi'")?.type).toBe('string');
    expect(tokenizeJs('"hi"').find((t) => t.text === '"hi"')?.type).toBe('string');
  });

  it('classifies template literals', () => {
    expect(tokenizeJs('`hi`').find((t) => t.text === '`hi`')?.type).toBe('template');
  });

  it('treats / as division when preceded by an identifier', () => {
    const tokens = tokenizeJs('a / b');
    expect(tokens.find((t) => t.text === '/')?.type).toBe('punct');
  });

  it('treats / as a regex when preceded by =', () => {
    const tokens = tokenizeJs('const r = /foo/g');
    expect(tokens.find((t) => t.text === '/foo/g')?.type).toBe('regex');
  });

  it('classifies built-ins and identifiers', () => {
    const tokens = tokenizeJs('JSON.parse(response.status)');
    expect(tokens.find((t) => t.text === 'JSON')?.type).toBe('builtin');
    expect(tokens.find((t) => t.text === 'response')?.type).toBe('ident');
  });

  it('classifies hex and float numbers', () => {
    const tokens = tokenizeJs('0xff 3.14e2');
    expect(tokens.find((t) => t.text === '0xff')?.type).toBe('number');
    expect(tokens.find((t) => t.text === '3.14e2')?.type).toBe('number');
  });

  it('classifies operators and punctuation', () => {
    const tokens = tokenizeJs('a === b && c');
    expect(tokens.find((t) => t.text === 'a')?.type).toBe('ident');
    expect(tokens.every((t) => t.type !== 'regex')).toBe(true);
  });
});
