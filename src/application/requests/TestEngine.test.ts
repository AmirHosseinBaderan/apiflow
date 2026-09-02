import { describe, expect, it } from 'vitest';
import { TestEngine } from '@application/requests/TestEngine';
import type { TestStep } from '@domain/request/RequestDefinition';
import type { HttpResponsePayload } from '@application/requests/httpClientPort';
import type { ScriptContext } from '@application/requests/TestEngine';
import type { VariableBundle } from '@domain/variable/VariableScope';

const ok = (overrides: Partial<HttpResponsePayload> = {}): HttpResponsePayload => ({
  status: 200,
  statusText: 'OK',
  headers: { 'content-type': 'application/json' },
  bodyText: '{"accessToken":"abc","user":{"id":1}}',
  contentType: 'application/json',
  durationMs: 10,
  ...overrides,
});

const bundle: VariableBundle = {
  collection: [{ key: 'base', value: 'c', enabled: true, secret: false }],
  request: [],
  runtime: [],
};

function ctx(overrides: Partial<ScriptContext> = {}): ScriptContext {
  const mutations = new Map<string, string>();
  const runtime = new Map<string, string>();
  return {
    variables: overrides.variables ?? bundle,
    request: overrides.request ?? { id: 'r', name: 'n', url: 'u', method: 'GET' },
    setRuntimeVariable: (n: string, v: string) => runtime.set(n, v),
    setCollectionVariable: (n: string, v: string) => mutations.set(n, v),
    ...overrides,
    __collectionMutations: mutations,
    __runtimeMutations: runtime,
  } as unknown as ScriptContext & {
    __collectionMutations: Map<string, string>;
    __runtimeMutations: Map<string, string>;
  };
}

describe('TestEngine', () => {
  const engine = new TestEngine();

  it('passes statusEquals', () => {
    const step: TestStep = {
      id: 't1',
      name: 'is 200',
      kind: { type: 'statusEquals', value: 200 },
      expression: '200',
    };
    expect(engine.runPostRequest(step, ok(), ctx()).status).toBe('passed');
  });

  it('fails statusEquals', () => {
    const step: TestStep = {
      id: 't2',
      name: 'is 201',
      kind: { type: 'statusEquals', value: 201 },
      expression: '201',
    };
    expect(engine.runPostRequest(step, ok(), ctx()).status).toBe('failed');
  });

  it('passes bodyExists', () => {
    const step: TestStep = {
      id: 't3',
      name: 'has user.id',
      kind: { type: 'bodyExists', path: 'user.id' },
      expression: 'user.id',
    };
    expect(engine.runPostRequest(step, ok(), ctx()).status).toBe('passed');
  });

  it('passes script assertion', () => {
    const step: TestStep = {
      id: 't4',
      name: 'token equals abc',
      kind: { type: 'script', source: 'return response.body.accessToken === "abc"' },
      expression: 'script',
    };
    expect(engine.runPostRequest(step, ok(), ctx()).status).toBe('passed');
  });

  it('errors on script exception', () => {
    const step: TestStep = {
      id: 't4b',
      name: 'throws',
      kind: { type: 'script', source: 'throw new Error("boom")' },
      expression: 'script',
    };
    expect(engine.runPostRequest(step, ok(), ctx()).status).toBe('error');
  });

  it('passes durationLessThan', () => {
    const step: TestStep = {
      id: 't5',
      name: 'fast',
      kind: { type: 'durationLessThan', valueMs: 1000 },
      expression: '1000',
    };
    expect(engine.runPostRequest(step, ok({ durationMs: 50 }), ctx()).status).toBe('passed');
  });

  it('post-request script can set collection variables', () => {
    const c = ctx();
    const step: TestStep = {
      id: 't6',
      name: 'persist token',
      kind: { type: 'script', source: 'pm.variables.setCollection("token", "abc"); return true' },
      expression: 'script',
    };
    expect(engine.runPostRequest(step, ok(), c).status).toBe('passed');
    expect((c as unknown as Record<string, unknown>).__collectionMutations).toEqual(
      new Map([['token', 'abc']]),
    );
  });

  it('pm.variables.get reads collection/request/runtime scopes', () => {
    const c = ctx({
      variables: {
        collection: [{ key: 'base', value: 'c', enabled: true, secret: false }],
        request: [{ key: 'req', value: 'r', enabled: true, secret: false }],
        runtime: [{ key: 'rt', value: 'x', enabled: true, secret: false }],
      },
    });
    const step: TestStep = {
      id: 't7',
      name: 'read vars',
      kind: {
        type: 'script',
        source: `
        pm.variables.set('runtimeKey', 'rv');
        pm.variables.setCollection('col', 'cv');
        return pm.variables.get('base') === 'c' && pm.variables.get('req') === 'r' && pm.variables.get('rt') === 'x';
      `,
      },
      expression: 'script',
    };
    expect(engine.runPostRequest(step, ok(), c).status).toBe('passed');
  });
});
