import { describe, expect, it } from 'vitest';
import { DefaultVariableResolver } from '@domain/variable/VariableResolver';
import type { VariableBundle } from '@domain/variable/VariableScope';

const baseBundle = (): VariableBundle => ({
  collection: [{ key: 'base_url', value: 'https://api.example.com', enabled: true, secret: false }],
  request: [],
  runtime: [],
});

describe('DefaultVariableResolver', () => {
  const resolver = new DefaultVariableResolver();

  it('replaces simple {{var}}', () => {
    const r = resolver.resolve('{{base_url}}/users', baseBundle());
    expect(r.value).toBe('https://api.example.com/users');
    expect(r.missing).toEqual([]);
  });

  it('reports missing keys', () => {
    const r = resolver.resolve('{{missing}}/x', baseBundle());
    expect(r.value).toBe('/x');
    expect(r.missing).toEqual(['missing']);
  });

  it('prefers runtime over collection', () => {
    const bundle: VariableBundle = {
      collection: [{ key: 'token', value: 'coll', enabled: true, secret: false }],
      request: [{ key: 'token', value: 'req', enabled: true, secret: false }],
      runtime: [{ key: 'token', value: 'rt', enabled: true, secret: false }],
    };
    expect(resolver.resolve('{{token}}', bundle).value).toBe('rt');
  });

  it('skips disabled variables', () => {
    const bundle: VariableBundle = {
      collection: [{ key: 'k', value: 'X', enabled: false, secret: false }],
      request: [],
      runtime: [],
    };
    const r = resolver.resolve('{{k}}', bundle);
    expect(r.value).toBe('');
    expect(r.missing).toEqual(['k']);
  });

  it('handles dotted names', () => {
    const bundle: VariableBundle = {
      collection: [{ key: 'a.b', value: 'V', enabled: true, secret: false }],
      request: [],
      runtime: [],
    };
    expect(resolver.resolve('{{a.b}}', bundle).value).toBe('V');
  });
});