export type TestStatus = 'passed' | 'failed' | 'skipped' | 'error';

export interface TestResult {
  readonly id: string;
  readonly name: string;
  readonly status: TestStatus;
  readonly durationMs: number;
  readonly error?: string;
  readonly actualValue?: unknown;
  readonly expectedValue?: unknown;
}

export interface ExecutionResponse {
  readonly status: number;
  readonly statusText: string;
  readonly headers: ReadonlyArray<readonly [string, string]>;
  readonly bodyText: string;
  readonly contentType: string;
  readonly durationMs: number;
  readonly size: number;
}

export interface ExecutionResult {
  readonly requestId: string;
  readonly requestName: string;
  readonly ok: boolean;
  readonly attempts: number;
  readonly response?: ExecutionResponse;
  readonly tests: ReadonlyArray<TestResult>;
  readonly extractedVariables: Readonly<Record<string, string>>;
  readonly errors: ReadonlyArray<string>;
}

export type RetryDecision = 'retry' | 'giveUp';