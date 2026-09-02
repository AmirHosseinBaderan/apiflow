import type { Workflow, WorkflowStep, WorkflowExecutionResult, StepExecutionResult } from '@domain/workflow/Workflow';
import type { RequestDefinition } from '@domain/request/RequestDefinition';
import type { VariableBundle } from '@domain/variable/VariableScope';
import type { ExecutionResult } from '@domain/test/TestResult';
import { RequestExecutionService } from '@application/requests/RequestExecutionService';

export interface RunWorkflowInput {
  readonly workflow: Workflow;
  readonly requests: ReadonlyArray<RequestDefinition>;
  readonly initialBundle: VariableBundle;
}

export class WorkflowEngine {
  constructor(private readonly executor: RequestExecutionService) {}

  async run({ workflow, requests, initialBundle }: RunWorkflowInput): Promise<WorkflowExecutionResult> {
    const requestMap = new Map(requests.map((r) => [r.id, r]));
    const stepResults: StepExecutionResult[] = [];
    let bundle: VariableBundle = initialBundle;
    let cursor = 0;
    let ok = true;

    while (cursor < workflow.steps.length) {
      const step = workflow.steps[cursor]!;
      const req = requestMap.get(step.requestId);
      if (!req) {
        stepResults.push({ stepId: step.id, requestName: '(unknown)', ok: false, error: 'Request not found' });
        ok = false;
        break;
      }
      if (!this.conditionMatches(step, bundle)) {
        cursor += 1;
        continue;
      }
      bundle = { ...bundle, request: this.requestVariablesFromStep(req) };
      let execResult: ExecutionResult;
      try {
        execResult = await this.executor.execute({ request: req, bundle });
      } catch (e) {
        stepResults.push({ stepId: step.id, requestName: req.name, ok: false, error: String(e) });
        ok = false;
        break;
      }

      bundle = this.applyExtractions(bundle, execResult.extractedVariables);

      stepResults.push({ stepId: step.id, requestName: req.name, ok: execResult.ok, error: execResult.errors.join('; ') || undefined });
      if (!execResult.ok) {
        ok = false;
        break;
      }

      const next = step.next ?? { type: 'end' as const };
      if (next.type === 'end') break;
      if (next.type === 'jump') {
        const idx = workflow.steps.findIndex((s) => s.id === next.toStepId);
        if (idx < 0) break;
        cursor = idx;
        continue;
      }
      cursor += 1;
    }

    return { workflowId: workflow.id, ok, steps: stepResults };
  }

  private conditionMatches(step: WorkflowStep, bundle: VariableBundle): boolean {
    const cond = step.condition ?? { type: 'always' as const };
    if (cond.type === 'always') return true;
    if (cond.type === 'statusEquals') {
      const last = bundle.runtime.find((v) => v.key === '__last_status');
      return Number(last?.value) === cond.value;
    }
    if (cond.type === 'variableEquals') {
      const v = bundle.runtime.find((r) => r.key === cond.name);
      return v?.value === cond.value;
    }
    return true;
  }

  private requestVariablesFromStep(req: RequestDefinition) {
    return req.variableExtractions.map((ve) => ({ key: ve.name, value: '', enabled: true, secret: false }));
  }

  private applyExtractions(bundle: VariableBundle, extracted: Readonly<Record<string, string>>): VariableBundle {
    const map = new Map(bundle.runtime.map((v) => [v.key, v]));
    for (const [k, v] of Object.entries(extracted)) map.set(k, { key: k, value: v, enabled: true, secret: false });
    return { ...bundle, runtime: Array.from(map.values()) };
  }
}