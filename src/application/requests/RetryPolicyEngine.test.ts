import { describe, expect, it } from 'vitest';
import { RetryPolicyEngine } from '@application/requests/RetryPolicyEngine';
import type { HttpErrorPayload, HttpResponsePayload } from '@application/requests/httpClientPort';

const policy = {
  enabled: true,
  maxAttempts: 3,
  initialDelayMs: 100,
  backoff: 'fixed' as const,
  retryOn: ['networkError' as const, 'status5xx' as const],
  retryStatusCodes: [429],
};

const ok = (status: number): HttpResponsePayload => ({
  status,
  statusText: 'OK',
  headers: {},
  bodyText: '',
  contentType: '',
  durationMs: 1,
});

const err = (kind: 'network' | 'timeout'): HttpErrorPayload => ({ kind, message: 'x' });

describe('RetryPolicyEngine', () => {
  const engine = new RetryPolicyEngine();

  it('retries on network error when configured', () => {
    expect(engine.decide({ attempt: 1, maxAttempts: 3, policy, error: err('network') })).toBe('retry');
  });

  it('gives up after max attempts', () => {
    expect(engine.decide({ attempt: 3, maxAttempts: 3, policy, error: err('network') })).toBe('giveUp');
  });

  it('retries on 5xx', () => {
    expect(engine.decide({ attempt: 1, maxAttempts: 3, policy, response: ok(500) })).toBe('retry');
  });

  it('does not retry on 4xx', () => {
    expect(engine.decide({ attempt: 1, maxAttempts: 3, policy, response: ok(404) })).toBe('giveUp');
  });

  it('exponential backoff', () => {
    expect(engine.delayMs(1, policy)).toBe(100);
    expect(engine.delayMs(3, { ...policy, backoff: 'exponential' })).toBe(400);
  });
});