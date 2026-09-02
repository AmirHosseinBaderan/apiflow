import type { Workflow, WorkflowStep, WorkflowExecutionResult, StepExecutionResult, VariableMapping } from '@domain/workflow/Workflow';
import type { RequestDefinition } from '@domain/request/RequestDefinition';
import type { VariableEntry, VariableBundle } from '@domain/variable/VariableScope';
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
      bundle = { ...bundle, request: this.applyVariableMappings(this.requestVariablesFromStep(req), step, bundle) };
      let execResult: ExecutionResult;
      try {
        execResult = await this.executor.execute({ request: req, bundle });
      } catch (e) {
        stepResults.push({ stepId: step.id, requestName: req.name, ok: false, error: String(e) });
        ok = false;
        break;
      }

      const requestBody = req.body.type === 'json' ? req.body.content : undefined;
      const responseBody = execResult.response?.bodyText;
      const responseContentType = execResult.response?.contentType;

      bundle = this.applyExtractions(bundle, execResult.extractedVariables);
      if (execResult.response) {
        bundle = this.applyExtractions(bundle, { __last_status: String(execResult.response.status) });
      }

      stepResults.push({
        stepId: step.id,
        requestName: req.name,
        ok: execResult.ok,
        error: execResult.errors.join('; ') || undefined,
        requestBody,
        responseBody,
        responseContentType,
      });
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

  private resolveVariable(name: string, bundle: VariableBundle): string | undefined {
    return (
      bundle.runtime.find((v) => v.key === name)?.value ??
      bundle.request.find((v) => v.key === name)?.value ??
      bundle.collection.find((v) => v.key === name)?.value
    );
  }

  private applyTransform(value: string, transform?: VariableMapping['transform']): string {
    if (transform === 'upper') return value.toUpperCase();
    if (transform === 'lower') return value.toLowerCase();
    if (transform === 'trim') return value.trim();
    if (transform === 'number') return String(Number(value));
    return value;
  }

  private applyVariableMappings(
    requestVars: VariableEntry[],
    mappings: ReadonlyArray<VariableMapping>,
    bundle: VariableBundle,
  ): VariableEntry[] {
    const map = new Map(requestVars.map((v) => [v.key, v]));
    for (const m of mappings) {
      const source = this.resolveVariable(m.fromVar, bundle);
      if (source === undefined) continue;
      const value = this.applyTransform(source, m.transform);
      const existing = map.get(m.toVar);
      map.set(m.toVar, existing ? { ...existing, value, enabled: true } : { key: m.toVar, value, enabled: true, secret: false });
    }
    return Array.from(map.values());
  }

  private applyExtractions(bundle: VariableBundle, extracted: Readonly<Record<string, string>>): VariableBundle {
    const map = new Map(bundle.runtime.map((v) => [v.key, v]));
    for (const [k, v] of Object.entries(extracted)) map.set(k, { key: k, value: v, enabled: true, secret: false });
    return { ...bundle, runtime: Array.from(map.values()) };
  }
}