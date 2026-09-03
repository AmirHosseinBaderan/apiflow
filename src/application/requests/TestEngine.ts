import type { HttpResponsePayload } from './httpClientPort';
import type { TestResult } from '@domain/test/TestResult';
import type { TestStep, TestKind } from '@domain/request/RequestDefinition';
import type { VariableBundle } from '@domain/variable/VariableScope';

export interface ScriptContext {
  readonly variables: VariableBundle;
  readonly request: { id: string; name: string; url: string; method: string };
  setRuntimeVariable(name: string, value: string): void;
  setCollectionVariable(name: string, value: string): void;
}

export interface PreRequestContext extends ScriptContext {
  readonly request: { id: string; name: string; url: string; method: string };
}

export class TestEngine {
  runPostRequest(step: TestStep, response: HttpResponsePayload, ctx: ScriptContext): TestResult {
    const start = performance.now();
    try {
      return this.runStep(step, response, ctx);
    } catch (e) {
      return {
        id: step.id,
        name: step.name,
        status: 'error',
        durationMs: Math.round(performance.now() - start),
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  runPreRequest(step: TestStep, ctx: PreRequestContext): TestResult {
    const start = performance.now();
    try {
      if (step.kind.type !== 'script') {
        return {
          id: step.id,
          name: step.name,
          status: 'skipped',
          durationMs: 0,
        };
      }
      const pm = this.buildPm(ctx);
      const fn = new Function('pm', 'request', 'variables', `${step.kind.source}`);
      const result = fn(pm, ctx.request, ctx.variables);
      return this.makeResult(step, result !== false, result, true, start);
    } catch (e) {
      return {
        id: step.id,
        name: step.name,
        status: 'error',
        durationMs: Math.round(performance.now() - start),
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  private buildPm(ctx: {
    variables: VariableBundle;
    setRuntimeVariable(name: string, value: string): void;
    setCollectionVariable(name: string, value: string): void;
  }) {
    return {
      variables: {
        set: (name: string, value: unknown) => {
          const str = stringifyValue(value);
          ctx.setRuntimeVariable(name, str);
          ctx.setCollectionVariable(name, str);
        },
        setCollection: (name: string, value: unknown) => {
          ctx.setCollectionVariable(name, stringifyValue(value));
        },
        get: (name: string): unknown => {
          const raw =
            ctx.variables.runtime.find((v) => v.key === name)?.value ??
            ctx.variables.request.find((v) => v.key === name)?.value ??
            ctx.variables.collection.find((v) => v.key === name)?.value;
          return parseValue(raw);
        },
      },
    };
  }

  private runStep(step: TestStep, response: HttpResponsePayload, ctx: ScriptContext): TestResult {
    const kind: TestKind = step.kind;
    const start = performance.now();
    switch (kind.type) {
      case 'statusEquals':
        return this.makeResult(
          step,
          response.status === kind.value,
          response.status,
          kind.value,
          start,
        );
      case 'statusIn':
        return this.makeResult(
          step,
          kind.values.includes(response.status),
          response.status,
          kind.values,
          start,
        );
      case 'headerEquals': {
        const actual = response.headers[kind.header.toLowerCase()] ?? '';
        return this.makeResult(step, actual === kind.value, actual, kind.value, start);
      }
      case 'bodyEquals': {
        let parsed: unknown;
        try {
          parsed = JSON.parse(response.bodyText);
        } catch {
          parsed = response.bodyText;
        }
        const actual = readPath(parsed, kind.path);
        return this.makeResult(step, deepEq(actual, kind.expected), actual, kind.expected, start);
      }
      case 'bodyExists': {
        let parsed: unknown;
        try {
          parsed = JSON.parse(response.bodyText);
        } catch {
          parsed = null;
        }
        const actual = readPath(parsed, kind.path);
        return this.makeResult(step, actual !== undefined, actual, 'defined', start);
      }
      case 'durationLessThan':
      case 'responseTimeLessThan':
        return this.makeResult(
          step,
          response.durationMs < kind.valueMs,
          response.durationMs,
          `< ${kind.valueMs}`,
          start,
        );
      case 'script':
        return this.runScript(step, response, ctx, start);
    }
  }

  private runScript(
    step: TestStep,
    response: HttpResponsePayload,
    ctx: ScriptContext,
    start: number,
  ): TestResult {
    try {
      const source = step.kind.type === 'script' ? step.kind.source : step.expression;
      const pm = this.buildPm(ctx);
      const fn = new Function('pm', 'response', `${source}`);
      const result = fn(pm, {
        status: response.status,
        headers: response.headers,
        body: safeJson(response.bodyText),
      });
      return this.makeResult(step, result === true, result, true, start);
    } catch (e) {
      return {
        id: step.id,
        name: step.name,
        status: 'error',
        durationMs: Math.round(performance.now() - start),
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  private makeResult(
    step: TestStep,
    passed: boolean,
    actual: unknown,
    expected: unknown,
    start: number,
  ): TestResult {
    return {
      id: step.id,
      name: step.name,
      status: passed ? 'passed' : 'failed',
      durationMs: Math.round(performance.now() - start),
      actualValue: actual,
      expectedValue: expected,
    };
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function readPath(root: unknown, path: string): unknown {
  const tokens = path.split('.').filter(Boolean);
  let cur: unknown = root;
  for (const t of tokens) {
    if (cur === null || cur === undefined) return undefined;
    if (Array.isArray(cur)) {
      const idx = Number(t);
      cur = Number.isInteger(idx) ? cur[idx] : undefined;
    } else if (typeof cur === 'object') {
      cur = (cur as Record<string, unknown>)[t];
    }
  }
  return cur;
}

function deepEq(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return false;
  if (typeof a === 'object') return JSON.stringify(a) === JSON.stringify(b);
  return false;
}

export const testEngine = new TestEngine();

function stringifyValue(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function parseValue(value: string | undefined): unknown {
  if (value === undefined) return undefined;
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === 'object' && parsed !== null) return parsed;
    return value;
  } catch {
    return value;
  }
}
