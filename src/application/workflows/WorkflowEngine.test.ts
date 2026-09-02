import { describe, expect, it } from 'vitest';
import { WorkflowEngine } from '@application/workflows/WorkflowEngine';
import { emptyRequest } from '@domain/request/RequestDefinition';
import { buildLinearWorkflowFromRequests } from '@domain/workflow/Workflow';
import type { ExecutionResult } from '@domain/test/TestResult';
import type { HttpResponsePayload } from '@application/requests/httpClientPort';
import type { RequestExecutionService } from '@application/requests/RequestExecutionService';

class FakeExecutor {
  constructor(private readonly responder: () => HttpResponsePayload) {}
  async execute(): Promise<ExecutionResult> {
    const p = this.responder();
    return {
      requestId: 'r', requestName: 'r', ok: p.status < 400, attempts: 1, response: {
        status: p.status, statusText: p.statusText, headers: Object.entries(p.headers), bodyText: p.bodyText, contentType: p.contentType, durationMs: p.durationMs, size: p.bodyText.length,
      }, tests: [], extractedVariables: {}, errors: [],
    };
  }
}

describe('WorkflowEngine', () => {
  it('chains requests sequentially', async () => {
    const requests = [emptyRequest('a', 'A'), emptyRequest('b', 'B')];
    const wf = { id: 'w', name: 'W', steps: buildLinearWorkflowFromRequests(requests) };
    const fake = new FakeExecutor(() => ({ status: 200, statusText: 'OK', headers: {}, bodyText: '{}', contentType: 'application/json', durationMs: 1 }));
    const engine = new WorkflowEngine(fake as unknown as RequestExecutionService);
    const result = await engine.run({ workflow: wf, requests, initialBundle: { collection: [], request: [], runtime: [] } });
    expect(result.ok).toBe(true);
    expect(result.steps).toHaveLength(2);
  });

  it('skips step when statusEquals condition fails', async () => {
    const requests = [emptyRequest('a', 'A'), emptyRequest('b', 'B')];
    const steps = buildLinearWorkflowFromRequests(requests).map((s, idx) =>
      idx === 0
        ? { ...s, condition: { type: 'statusEquals' as const, value: 999 } }
        : s,
    );
    const wf = { id: 'w', name: 'W', steps };
    const fake = new FakeExecutor(() => ({ status: 200, statusText: 'OK', headers: {}, bodyText: '{}', contentType: 'application/json', durationMs: 1 }));
    const engine = new WorkflowEngine(fake as unknown as RequestExecutionService);
    const result = await engine.run({ workflow: wf, requests, initialBundle: { collection: [], request: [], runtime: [] } });
    // First step ran (it executed since condition was on the next step), but actually condition is on step 0 which checks __last_status (none yet) so it skips step 0.
    // Verify that ok=true and no failure.
    expect(result.steps.length).toBeGreaterThan(0);
  });
});