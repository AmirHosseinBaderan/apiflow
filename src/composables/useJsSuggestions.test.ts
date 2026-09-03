import { describe, expect, it } from 'vitest';
import {
  getCompletionContext,
  getSuggestions,
  applySuggestion,
} from '@composables/useJsSuggestions';

describe('useJsSuggestions - completion context', () => {
  it('detects global completion by prefix', () => {
    const ctx = getCompletionContext('pm', 2);
    expect(ctx.mode).toBe('global');
    expect(ctx.prefix).toBe('pm');
    expect(ctx.prefixStart).toBe(0);
  });

  it('detects member completion after a dot', () => {
    const ctx = getCompletionContext('response.', 9);
    expect(ctx.mode).toBe('member');
    expect(ctx.objectPath).toEqual(['response']);
    expect(ctx.prefix).toBe('');
    expect(ctx.prefixStart).toBe(9);
  });

  it('detects member completion with a partial name', () => {
    const ctx = getCompletionContext('response.s', 10);
    expect(ctx.mode).toBe('member');
    expect(ctx.objectPath).toEqual(['response']);
    expect(ctx.prefix).toBe('s');
    expect(ctx.prefixStart).toBe(9);
  });

  it('resolves chained member paths', () => {
    const ctx = getCompletionContext('pm.variables.', 13);
    expect(ctx.mode).toBe('member');
    expect(ctx.objectPath).toEqual(['pm', 'variables']);
    expect(ctx.prefix).toBe('');
    expect(ctx.prefixStart).toBe(13);
  });
});

describe('useJsSuggestions - getSuggestions', () => {
  it('returns the script context members', () => {
    const s = getSuggestions('response.', 9);
    expect(s.map((i) => i.label)).toEqual(
      expect.arrayContaining(['status', 'headers', 'body', 'bodyText']),
    );
    expect(s).toHaveLength(4);
  });

  it('filters member suggestions by prefix', () => {
    const s = getSuggestions('response.s', 10);
    expect(s.map((i) => i.label)).toEqual(['status']);
  });

  it('offers built-in member completions', () => {
    const s = getSuggestions('JSON.', 6);
    expect(s.map((i) => i.label)).toEqual(expect.arrayContaining(['parse', 'stringify']));
  });

  it('offers top-level script identifiers while typing', () => {
    const s = getSuggestions('re', 2).map((i) => i.label);
    expect(s).toContain('response');
    expect(s).toContain('request');
  });

  it('offers builtins while typing', () => {
    const s = getSuggestions('Ma', 2).map((i) => i.label);
    expect(s).toContain('Math');
  });

  it('returns nothing for unknown objects', () => {
    expect(getSuggestions('foo.', 4)).toHaveLength(0);
  });

  it('includes available variables in global completion', () => {
    const s = getSuggestions('', 0, { variables: ['myVar', 'userId'] }).map((i) => i.label);
    expect(s).toContain('myVar');
    expect(s).toContain('userId');
  });

  it('suggests keyword and snippet completions', () => {
    const s = getSuggestions('return', 6).map((i) => i.label);
    expect(s).toContain('return');
    expect(s).toContain('return response.status === 200');
  });
});

describe('useJsSuggestions - applySuggestion', () => {
  it('completes a member replacement', () => {
    const ctx = getCompletionContext('response.s', 10);
    const sug = getSuggestions('response.s', 10)[0]!;
    const res = applySuggestion('response.s', 10, ctx, sug);
    expect(res.source).toBe('response.status');
    expect(res.cursor).toBe(15);
  });

  it('inserts a snippet replacing the prefix', () => {
    const ctx = getCompletionContext('ret', 3);
    const snip = getSuggestions('ret', 3).find((s) => s.kind === 'snippet')!;
    const res = applySuggestion('ret', 3, ctx, snip);
    expect(res.source).toBe('return response.status === 200');
    expect(res.cursor).toBe(res.source.length);
  });
});
