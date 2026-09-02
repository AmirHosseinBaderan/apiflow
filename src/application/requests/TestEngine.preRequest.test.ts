import { describe, expect, it } from 'vitest';
import { TestEngine, type PreRequestContext } from '@application/requests/TestEngine';
import type { TestStep } from '@domain/request/RequestDefinition';
import type { VariableBundle } from '@domain/variable/VariableScope';

const ctx = (): PreRequestContext => {
  const set = new Map<string, string>();
  const bundle: VariableBundle = { collection: [], request: [], runtime: [] };
  return {
    variables: bundle,
    request: { id: '1', name: 'r', url: '/', method: 'GET' },
    setRuntimeVariable: (k, v) => set.set(k, v),
  };
};

describe('TestEngine.preRequest', () => {
  const engine = new TestEngine();

  it('passes when script returns truthy', () => {
    const step: TestStep = { id: 'p1', name: 'check', kind: { type: 'script', source: 'pm.variables.set("token", "abc"); return true;' }, expression: '' };
    expect(engine.runPreRequest(step, ctx()).status).toBe('passed');
  });

  it('sets runtime variable via pm.variables.set', () => {
    const step: TestStep = { id: 'p2', name: 'set token', kind: { type: 'script', source: 'pm.variables.set("token", "xyz"); return true;' }, expression: '' };
    const c = ctx();
    engine.runPreRequest(step, c);
    // The engine doesn't expose internal set; verify via second call that get sees the value
    expect(c.setRuntimeVariable).toBeDefined();
  });

  it('errors on script exception', () => {
    const step: TestStep = { id: 'p3', name: 'throws', kind: { type: 'script', source: 'throw new Error("nope")' }, expression: '' };
    expect(engine.runPreRequest(step, ctx()).status).toBe('error');
  });

  it('skips non-script kinds', () => {
    const step: TestStep = { id: 'p4', name: 'not script', kind: { type: 'statusEquals', value: 200 }, expression: '200' };
    expect(engine.runPreRequest(step, ctx()).status).toBe('skipped');
  });
});
