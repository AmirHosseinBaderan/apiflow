import type {
  Workflow,
  WorkflowStep,
  WorkflowExecutionResult,
  StepExecutionResult,
  VariableMapping,
} from '@domain/workflow/Workflow';
import type { RequestDefinition, KeyValue } from '@domain/request/RequestDefinition';
import type { VariableEntry, VariableBundle } from '@domain/variable/VariableScope';
import type { ExecutionResult } from '@domain/test/TestResult';

export interface RunWorkflowInput {
  readonly workflow: Workflow;
  readonly requests: ReadonlyArray<RequestDefinition>;
  readonly initialBundle: VariableBundle;
  readonly runTests?: boolean;
}

export interface WorkflowExecutor {
  execute(input: { request: RequestDefinition; bundle: VariableBundle }): Promise<ExecutionResult>;
}

export class WorkflowEngine {
  constructor(private readonly executor: WorkflowExecutor) {}

  async run({
    workflow,
    requests,
    initialBundle,
    runTests = true,
  }: RunWorkflowInput): Promise<WorkflowExecutionResult> {
    const requestMap = new Map(requests.map((r) => [r.id, r]));
    const stepResults: StepExecutionResult[] = [];
    let bundle: VariableBundle = initialBundle;
    let cursor = 0;
    let ok = true;
    const collectionMutations = new Map<string, string>();

    while (cursor < workflow.steps.length) {
      const step = workflow.steps[cursor]!;
      const req = requestMap.get(step.requestId);
      if (!req) {
        stepResults.push({
          stepId: step.id,
          requestName: '(unknown)',
          ok: false,
          error: 'Request not found',
          tests: [],
        });
        ok = false;
        break;
      }
      if (!this.conditionMatches(step, bundle)) {
        cursor += 1;
        continue;
      }
      const effectiveRequest = this.applyOverrides(req, step);
      bundle = {
        ...bundle,
        request: this.applyVariableMappings(
          this.requestVariablesFromStep(req),
          step.variableMappings,
          bundle,
        ),
      };
      let execResult: ExecutionResult;
      try {
        execResult = await this.executor.execute({ request: effectiveRequest, bundle });
      } catch (e) {
        stepResults.push({
          stepId: step.id,
          requestName: req.name,
          ok: false,
          error: String(e),
          tests: [],
        });
        ok = false;
        break;
      }

      const requestBody =
        effectiveRequest.body.type === 'json' ? effectiveRequest.body.content : undefined;
      const responseBody = execResult.response?.bodyText;
      const responseContentType = execResult.response?.contentType;
      const status = execResult.response?.status;

      bundle = this.applyExtractions(bundle, execResult.extractedVariables);
      for (const [k, v] of Object.entries(execResult.collectionVariables ?? {})) {
        collectionMutations.set(k, v);
      }
      if (execResult.response) {
        bundle = this.applyExtractions(bundle, {
          __last_status: String(execResult.response.status),
        });
      }

      const tests = execResult.tests ?? [];
      const responseOk = execResult.response !== undefined && execResult.response.status < 400;
      const testsOk = tests.every((t) => t.status !== 'failed' && t.status !== 'error');
      const stepOk = responseOk && (runTests ? testsOk : true);

      stepResults.push({
        stepId: step.id,
        requestName: req.name,
        ok: stepOk,
        error: execResult.errors.join('; ') || undefined,
        requestBody,
        responseBody,
        responseContentType,
        status,
        tests,
      });
      if (!stepOk) {
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

    return {
      workflowId: workflow.id,
      ok,
      steps: stepResults,
      collectionVariables: Object.fromEntries(collectionMutations),
    };
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
    return req.variableExtractions.map((ve) => ({
      key: ve.name,
      value: '',
      enabled: true,
      secret: false,
    }));
  }

  private applyOverrides(req: RequestDefinition, step: WorkflowStep): RequestDefinition {
    const o = step.overrides;
    if (!o) return req;
    let body = req.body;
    if (typeof o.body === 'string' && req.body.type === 'json') {
      body = { ...req.body, content: o.body };
    }
    return {
      ...req,
      headers: this.mergeKeyValues(req.headers, o.headers),
      pathParams: this.mergeKeyValues(req.pathParams, o.pathParams),
      queryParams: this.mergeKeyValues(req.queryParams, o.queryParams),
      body,
    };
  }

  private mergeKeyValues(
    base: ReadonlyArray<KeyValue>,
    overrides?: ReadonlyArray<KeyValue>,
  ): ReadonlyArray<KeyValue> {
    if (!overrides) return base;
    const seen = new Set<string>();
    const out: KeyValue[] = base.map((kv) => {
      seen.add(kv.key);
      const o = overrides.find((o2) => o2.key === kv.key);
      return o ?? kv;
    });
    for (const ov of overrides) {
      if (!seen.has(ov.key)) {
        out.push(ov);
        seen.add(ov.key);
      }
    }
    return out;
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
      map.set(
        m.toVar,
        existing
          ? { ...existing, value, enabled: true }
          : { key: m.toVar, value, enabled: true, secret: false },
      );
    }
    return Array.from(map.values());
  }

  private applyExtractions(
    bundle: VariableBundle,
    extracted: Readonly<Record<string, string>>,
  ): VariableBundle {
    const map = new Map(bundle.runtime.map((v) => [v.key, v]));
    for (const [k, v] of Object.entries(extracted))
      map.set(k, { key: k, value: v, enabled: true, secret: false });
    return { ...bundle, runtime: Array.from(map.values()) };
  }
}
