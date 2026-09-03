import { describe, expect, it } from 'vitest';
import { tokenizeJson } from '@composables/useJsonHighlight';

describe('tokenizeJson', () => {
  it('classifies keys, strings, numbers and punctuation', () => {
    const tokens = tokenizeJson('{"a": 1, "b": "hi"}');
    expect(tokens.find((t) => t.text === '"a"')?.type).toBe('key');
    expect(tokens.find((t) => t.text === ':')?.type).toBe('punct');
    expect(tokens.find((t) => t.text === '1')?.type).toBe('number');
    expect(tokens.find((t) => t.text === '"hi"')?.type).toBe('string');
  });

  it('classifies booleans and null', () => {
    const tokens = tokenizeJson('{ "on": true, "x": null }');
    expect(tokens.find((t) => t.text === 'true')?.type).toBe('boolean');
    expect(tokens.find((t) => t.text === 'null')?.type).toBe('null');
  });
});
