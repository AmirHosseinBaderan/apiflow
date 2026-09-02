import { describe, expect, it } from 'vitest';
import { ResponseExtractor } from '@domain/execution/ResponseExtractor';

describe('ResponseExtractor', () => {
  const extractor = new ResponseExtractor();
  const body = JSON.stringify({
    accessToken: 'abc',
    user: { id: 123, name: 'Alice' },
    items: [{ id: 1 }, { id: 2 }],
  });

  it('extracts top-level', () => {
    expect(extractor.extract(body, 'accessToken')).toBe('abc');
  });

  it('extracts nested path', () => {
    expect(extractor.extract(body, 'user.id')).toBe('123');
  });

  it('extracts array by index', () => {
    expect(extractor.extract(body, 'items[1].id')).toBe('2');
  });

  it('returns undefined for missing path', () => {
    expect(extractor.extract(body, 'user.missing')).toBeUndefined();
  });

  it('handles invalid JSON', () => {
    expect(extractor.extract('not json', 'x')).toBeUndefined();
  });
});