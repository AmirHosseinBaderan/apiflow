import { describe, expect, it } from 'vitest';
import { TestEngine } from '@application/requests/TestEngine';
import type { TestStep } from '@domain/request/RequestDefinition';
import type { HttpResponsePayload } from '@application/requests/httpClientPort';

const ok = (overrides: Partial<HttpResponsePayload> = {}): HttpResponsePayload => ({
  status: 200,
  statusText: 'OK',
  headers: { 'content-type': 'application/json' },
  bodyText: '{"accessToken":"abc","user":{"id":1}}',
  contentType: 'application/json',
  durationMs: 10,
  ...overrides,
});

describe('TestEngine', () => {
  const engine = new TestEngine();

  it('passes statusEquals', () => {
    const step: TestStep = { id: 't1', name: 'is 200', kind: { type: 'statusEquals', value: 200 }, expression: '200' };
    expect(engine.runPostRequest(step, ok()).status).toBe('passed');
  });

  it('fails statusEquals', () => {
    const step: TestStep = { id: 't2', name: 'is 201', kind: { type: 'statusEquals', value: 201 }, expression: '201' };
    expect(engine.runPostRequest(step, ok()).status).toBe('failed');
  });

  it('passes bodyExists', () => {
    const step: TestStep = { id: 't3', name: 'has user.id', kind: { type: 'bodyExists', path: 'user.id' }, expression: 'user.id' };
    expect(engine.runPostRequest(step, ok()).status).toBe('passed');
  });

  it('passes script assertion', () => {
    const step: TestStep = { id: 't4', name: 'token equals abc', kind: { type: 'script', source: 'return response.body.accessToken === "abc"' }, expression: 'script' };
    expect(engine.runPostRequest(step, ok()).status).toBe('passed');
  });

  it('errors on script exception', () => {
    const step: TestStep = { id: 't4b', name: 'throws', kind: { type: 'script', source: 'throw new Error("boom")' }, expression: 'script' };
    expect(engine.runPostRequest(step, ok()).status).toBe('error');
  });

  it('passes durationLessThan', () => {
    const step: TestStep = { id: 't5', name: 'fast', kind: { type: 'durationLessThan', valueMs: 1000 }, expression: '1000' };
    expect(engine.runPostRequest(step, ok({ durationMs: 50 })).status).toBe('passed');
  });
});