import type { RequestDefinition } from '@domain/request/RequestDefinition';
import type { ExecutionResult, ExecutionResponse, TestResult } from '@domain/test/TestResult';
import type { VariableBundle } from '@domain/variable/VariableScope';
import { responseExtractor } from '@domain/execution/ResponseExtractor';
import { requestBuilder } from './RequestBuilder';
import { retryPolicyEngine } from './RetryPolicyEngine';
import { testEngine } from './TestEngine';
import type { ScriptContext } from './TestEngine';
import type { HttpClient, HttpResponsePayload } from './httpClientPort';

export interface ExecuteRequestInput {
  readonly request: RequestDefinition;
  readonly bundle: VariableBundle;
}

export class RequestExecutionService {
  constructor(private readonly http: HttpClient) {}

  async execute({ request, bundle }: ExecuteRequestInput): Promise<ExecutionResult> {
    const errors: string[] = [];
    const tests: TestResult[] = [];
    let attempts = 0;
    let response: ExecutionResponse | undefined;
    const extracted: Record<string, string> = {};
    const runtimeMutations = new Map<string, string>();
    const collectionMutations = new Map<string, string>();

    const applyMutations = (b: VariableBundle): VariableBundle => {
      if (runtimeMutations.size === 0) return b;
      const map = new Map(b.runtime.map((v) => [v.key, v]));
      for (const [k, v] of runtimeMutations) map.set(k, { key: k, value: v, enabled: true, secret: false });
      return { ...b, runtime: Array.from(map.values()) };
    };

    const buildScriptCtx = (b: VariableBundle): ScriptContext => {
      const enabledHeaders = request.headers.filter((h) => h.enabled).map((h) => ({ key: h.key, value: h.value }));
      const enabledQuery = request.queryParams.filter((h) => h.enabled).map((h) => ({ key: h.key, value: h.value }));
      const enabledPath = request.pathParams.filter((h) => h.enabled).map((h) => ({ key: h.key, value: h.value }));
      let body: unknown = undefined;
      if (request.body.type === 'json' || request.body.type === 'raw' || request.body.type === 'text') {
        body = request.body.content;
      } else if (request.body.type === 'formUrlEncoded') {
        body = request.body.fields.filter((f) => f.enabled).map((f) => ({ key: f.key, value: f.value }));
      } else if (request.body.type === 'multipart') {
        body = request.body.fields.map((f) => ({
          key: f.key,
          value: f.value.kind === 'text' ? f.value.text : { name: f.value.file.name, contentType: f.value.file.contentType },
        }));
      }
      return {
        variables: b,
        request: {
          id: request.id,
          name: request.name,
          url: request.url,
          method: request.method,
          headers: enabledHeaders,
          queryParams: enabledQuery,
          pathParams: enabledPath,
          body,
        },
        setRuntimeVariable: (name, value) => runtimeMutations.set(name, value),
        setCollectionVariable: (name, value) => collectionMutations.set(name, value),
      };
    };

    let currentBundle: VariableBundle = applyMutations(bundle);

    for (const step of request.preRequest) {
      const result = testEngine.runPreRequest(step, buildScriptCtx(currentBundle));
      tests.push(result);
      if (result.status === 'error') {
        errors.push(`Pre-request '${step.name}' errored: ${result.error ?? 'unknown'}`);
      }
    }
    currentBundle = applyMutations(bundle);

    let built = requestBuilder.build({ request, bundle: currentBundle });

    while (true) {
      attempts += 1;
      const result = await this.http.execute(built);
      if (result.ok) {
        const payload: HttpResponsePayload = result.value;
        response = this.toExecutionResponse(payload);
        for (const step of request.postRequest) {
          tests.push(testEngine.runPostRequest(step, payload, buildScriptCtx(currentBundle)));
        }
        for (const extraction of request.variableExtractions) {
          const v = responseExtractor.extract(payload.bodyText, extraction.path);
          if (v !== undefined) extracted[extraction.name] = v;
        }
      } else {
        errors.push(result.error.message);
      }

      const decision = retryPolicyEngine.decide({
        attempt: attempts,
        maxAttempts: request.retry.maxAttempts,
        policy: request.retry,
        response: result.ok ? result.value : undefined,
        error: result.ok ? undefined : result.error,
      });

      if (decision === 'retry') {
        const delay = retryPolicyEngine.delayMs(attempts, request.retry);
        await new Promise((res) => setTimeout(res, delay));
        currentBundle = this.applyExtractedVariables(currentBundle, extracted);
        built = requestBuilder.build({ request, bundle: currentBundle });
        continue;
      }
      break;
    }

    return {
      requestId: request.id,
      requestName: request.name,
      ok: response !== undefined && response.status < 400 && tests.every((t) => t.status !== 'failed' && t.status !== 'error'),
      attempts,
      response,
      tests,
      extractedVariables: extracted,
      collectionVariables: Object.fromEntries(collectionMutations),
      errors,
    };
  }

  private applyExtractedVariables(bundle: VariableBundle, extracted: Record<string, string>): VariableBundle {
    const next = new Map(bundle.runtime.map((v) => [v.key, v]));
    for (const [k, v] of Object.entries(extracted)) next.set(k, { key: k, value: v, enabled: true, secret: false });
    return { ...bundle, runtime: Array.from(next.values()) };
  }

  private toExecutionResponse(p: HttpResponsePayload): ExecutionResponse {
    return {
      status: p.status,
      statusText: p.statusText,
      headers: Object.entries(p.headers),
      bodyText: p.bodyText,
      contentType: p.contentType,
      durationMs: p.durationMs,
      size: p.bodyText.length,
    };
  }
}