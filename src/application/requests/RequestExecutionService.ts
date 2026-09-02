import type { RequestDefinition } from '@domain/request/RequestDefinition';
import type { ExecutionResult, ExecutionResponse, TestResult } from '@domain/test/TestResult';
import type { VariableBundle } from '@domain/variable/VariableScope';
import { responseExtractor } from '@domain/execution/ResponseExtractor';
import { requestBuilder } from './RequestBuilder';
import { retryPolicyEngine } from './RetryPolicyEngine';
import { testEngine } from './TestEngine';
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

    let currentBundle: VariableBundle = bundle;
    const built = requestBuilder.build({ request, bundle });

    while (true) {
      attempts += 1;
      const result = await this.http.execute(built);
      if (result.ok) {
        const payload: HttpResponsePayload = result.value;
        response = this.toExecutionResponse(payload);
        for (const step of request.postRequest) {
          tests.push(testEngine.runPostRequest(step, payload));
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
        const rebuilt = requestBuilder.build({
          request,
          bundle: currentBundle,
        });
        Object.assign(built, rebuilt);
        continue;
      }
      break;
    }

    return {
      requestId: request.id,
      requestName: request.name,
      ok: response !== undefined && response.status < 400 && tests.every((t) => t.status !== 'failed'),
      attempts,
      response,
      tests,
      extractedVariables: extracted,
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