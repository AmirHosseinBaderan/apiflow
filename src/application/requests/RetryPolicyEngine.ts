import type { RetryPolicyWithCodes } from '@domain/request/RequestDefinition';
import type { HttpResponsePayload, HttpErrorPayload } from '@application/requests/httpClientPort';
import type { RetryDecision } from '@domain/test/TestResult';

export interface RetryDecisionInput {
  readonly attempt: number;
  readonly maxAttempts: number;
  readonly policy: RetryPolicyWithCodes;
  readonly response?: HttpResponsePayload;
  readonly error?: HttpErrorPayload;
}

export class RetryPolicyEngine {
  decide(input: RetryDecisionInput): RetryDecision {
    const { attempt, maxAttempts, policy } = input;
    if (!policy.enabled) return 'giveUp';
    if (attempt >= maxAttempts) return 'giveUp';
    if (input.error) {
      if (policy.retryOn.includes('networkError') && input.error.kind === 'network') return 'retry';
      if (policy.retryOn.includes('timeout') && input.error.kind === 'timeout') return 'retry';
    }
    if (input.response) {
      if (policy.retryOn.includes('status5xx') && input.response.status >= 500 && input.response.status < 600) return 'retry';
      if (policy.retryOn.includes('statusCode') && policy.retryStatusCodes.includes(input.response.status)) return 'retry';
    }
    return 'giveUp';
  }

  delayMs(attempt: number, policy: RetryPolicyWithCodes): number {
    if (policy.backoff === 'fixed') return policy.initialDelayMs;
    return policy.initialDelayMs * Math.pow(2, attempt - 1);
  }
}

export const retryPolicyEngine = new RetryPolicyEngine();