import type { RequestDefinition, KeyValue } from '@domain/request/RequestDefinition';
import type { TestResult } from '@domain/test/TestResult';
import { createId } from '@shared/id';

export interface StepOverrides {
  readonly pathParams?: ReadonlyArray<KeyValue>;
  readonly queryParams?: ReadonlyArray<KeyValue>;
  readonly headers?: ReadonlyArray<KeyValue>;
  readonly body?: string;
}

export interface WorkflowStep {
  readonly id: string;
  readonly requestId: string;
  readonly condition?: WorkflowCondition;
  readonly next?: WorkflowNext;
  readonly variableMappings: ReadonlyArray<VariableMapping>;
  readonly overrides?: StepOverrides;
}

export type WorkflowCondition =
  | { readonly type: 'always' }
  | { readonly type: 'statusEquals'; readonly value: number }
  | { readonly type: 'variableEquals'; readonly name: string; readonly value: string }
  | { readonly type: 'expression'; readonly source: string };

export type WorkflowNext =
  | { readonly type: 'next' }
  | { readonly type: 'jump'; readonly toStepId: string }
  | { readonly type: 'end' };

export interface VariableMapping {
  readonly fromVar: string;
  readonly toVar: string;
  readonly transform?: 'trim' | 'lower' | 'upper' | 'number';
}

export interface Workflow {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly steps: ReadonlyArray<WorkflowStep>;
}

export interface WorkflowExecutionResult {
  readonly workflowId: string;
  readonly ok: boolean;
  readonly steps: ReadonlyArray<StepExecutionResult>;
  readonly collectionVariables: Readonly<Record<string, string>>;
}

export interface StepExecutionResult {
  readonly stepId: string;
  readonly requestName: string;
  readonly ok: boolean;
  readonly error?: string;
  readonly requestBody?: string;
  readonly responseBody?: string;
  readonly responseContentType?: string;
  readonly status?: number;
  readonly tests: ReadonlyArray<TestResult>;
}

export function buildLinearWorkflowFromRequests(
  requests: ReadonlyArray<RequestDefinition>,
): WorkflowStep[] {
  return requests.map((req, index) => {
    const isLast = index === requests.length - 1;
    return {
      id: `step_${req.id}`,
      requestId: req.id,
      condition: { type: 'always' },
      next: isLast ? { type: 'end' } : { type: 'next' },
      variableMappings: [],
    } satisfies WorkflowStep;
  });
}

export function buildStepFromRequest(
  request: RequestDefinition,
  overrides?: StepOverrides,
): WorkflowStep {
  return {
    id: `step_${request.id}_${createId('s')}`,
    requestId: request.id,
    condition: { type: 'always' },
    next: { type: 'next' },
    variableMappings: [],
    overrides: overrides ?? {
      pathParams: request.pathParams ?? [],
      queryParams: request.queryParams ?? [],
      headers: request.headers ?? [],
      body: request.body?.type === 'json' ? request.body?.content : undefined,
    },
  };
}
