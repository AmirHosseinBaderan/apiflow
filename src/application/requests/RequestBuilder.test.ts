import { describe, expect, it } from 'vitest';
import { RequestBuilder } from '@application/requests/RequestBuilder';
import { emptyRequest } from '@domain/request/RequestDefinition';
import type { VariableBundle } from '@domain/variable/VariableScope';

const empty = (): VariableBundle => ({ collection: [], request: [], runtime: [] });

describe('RequestBuilder', () => {
  it('builds URL with query params and path params', () => {
    const req = emptyRequest('1', 'r');
    const built = new RequestBuilder().build({
      request: {
        ...req,
        url: '{{base}}/users/:id',
        pathParams: [{ id: '1', key: 'id', value: '42', enabled: true }],
        queryParams: [{ id: '2', key: 'active', value: 'true', enabled: true }],
      },
      bundle: { collection: [{ key: 'base', value: 'https://x', enabled: true, secret: false }], request: [], runtime: [] },
    });
    expect(built.url).toBe('https://x/users/42?active=true');
  });

  it('adds bearer auth header', () => {
    const req = emptyRequest('1', 'r');
    const built = new RequestBuilder().build({
      request: { ...req, url: '/', auth: { type: 'bearer', token: '{{t}}' } },
      bundle: { collection: [], request: [], runtime: [{ key: 't', value: 'abc', enabled: true, secret: false }] },
    });
    const h = Object.fromEntries(built.headers);
    expect(h['Authorization']).toBe('Bearer abc');
  });

  it('builds form-urlencoded body', () => {
    const req = emptyRequest('1', 'r');
    const built = new RequestBuilder().build({
      request: {
        ...req,
        url: '/',
        body: { type: 'formUrlEncoded', fields: [{ id: '1', key: 'a', value: '1', enabled: true }, { id: '2', key: 'b', value: '2', enabled: true }] },
      },
      bundle: empty(),
    });
    expect(built.body).toBe('a=1&b=2');
  });

  it('json body resolves variables', () => {
    const req = emptyRequest('1', 'r');
    const built = new RequestBuilder().build({
      request: { ...req, url: '/', body: { type: 'json', content: '{"name":"{{n}}"}' } },
      bundle: { collection: [], request: [], runtime: [{ key: 'n', value: 'Alice', enabled: true, secret: false }] },
    });
    expect(built.body).toBe('{"name":"Alice"}');
  });
});