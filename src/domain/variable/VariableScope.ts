export interface VariableEntry {
  readonly key: string;
  readonly value: string;
  readonly enabled: boolean;
  readonly secret: boolean;
}

export type VariableScope = 'collection' | 'request' | 'runtime';

export interface VariableBundle {
  readonly collection: ReadonlyArray<VariableEntry>;
  readonly request: ReadonlyArray<VariableEntry>;
  readonly runtime: ReadonlyArray<VariableEntry>;
}

export interface RuntimeContext {
  readonly requestId: string;
  readonly variables: Map<string, string>;
}