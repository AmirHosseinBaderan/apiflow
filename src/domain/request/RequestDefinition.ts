export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS';

export const HTTP_METHODS: ReadonlyArray<HttpMethod> = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
];

export interface KeyValue {
  readonly id: string;
  readonly key: string;
  readonly value: string;
  readonly enabled: boolean;
  readonly description?: string;
}

export type AuthKind =
  | { readonly type: 'none' }
  | { readonly type: 'bearer'; readonly token: string }
  | { readonly type: 'basic'; readonly username: string; readonly password: string }
  | { readonly type: 'apiKey'; readonly key: string; readonly value: string; readonly in: 'header' | 'query' };

export type Auth = AuthKind;

export type RequestBody =
  | { readonly type: 'none' }
  | { readonly type: 'json'; readonly content: string }
  | { readonly type: 'raw'; readonly contentType: string; readonly content: string }
  | { readonly type: 'text'; readonly content: string }
  | { readonly type: 'formUrlEncoded'; readonly fields: ReadonlyArray<KeyValue> }
  | { readonly type: 'multipart'; readonly fields: ReadonlyArray<MultipartField> }
  | { readonly type: 'binary'; readonly fileRef: FileReference };

export interface MultipartField {
  readonly id: string;
  readonly key: string;
  readonly enabled: boolean;
  readonly contentType?: string;
  readonly value: MultipartValue;
}

export type MultipartValue =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'file'; readonly file: FileReference };

export interface FileReference {
  readonly id: string;
  readonly name: string;
  readonly size: number;
  readonly contentType: string;
  readonly origin: FileOrigin;
}

export type FileOrigin =
  | { readonly kind: 'browser'; readonly lastModified: number }
  | { readonly kind: 'stored'; readonly storageId: string };

export interface RetryPolicy {
  readonly enabled: boolean;
  readonly maxAttempts: number;
  readonly initialDelayMs: number;
  readonly backoff: 'fixed' | 'exponential';
  readonly retryOn: ReadonlyArray<RetryCondition>;
}

export type RetryCondition = 'networkError' | 'timeout' | 'status5xx' | 'statusCode';

export interface RetryPolicyWithCodes extends RetryPolicy {
  readonly retryStatusCodes: ReadonlyArray<number>;
}

export interface RequestDefinition {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly method: HttpMethod;
  readonly url: string;
  readonly headers: ReadonlyArray<KeyValue>;
  readonly queryParams: ReadonlyArray<KeyValue>;
  readonly pathParams: ReadonlyArray<KeyValue>;
  readonly body: RequestBody;
  readonly auth: Auth;
  readonly timeoutMs: number;
  readonly retry: RetryPolicyWithCodes;
  readonly preRequest: ReadonlyArray<TestStep>;
  readonly postRequest: ReadonlyArray<TestStep>;
  readonly variableExtractions: ReadonlyArray<VariableExtraction>;
}

export interface TestStep {
  readonly id: string;
  readonly name: string;
  readonly kind: TestKind;
  readonly expression: string;
  readonly expected?: string;
}

export type TestKind =
  | { readonly type: 'statusEquals'; readonly value: number }
  | { readonly type: 'statusIn'; readonly values: ReadonlyArray<number> }
  | { readonly type: 'headerEquals'; readonly header: string; readonly value: string }
  | { readonly type: 'bodyEquals'; readonly path: string; readonly expected: unknown }
  | { readonly type: 'bodyExists'; readonly path: string }
  | { readonly type: 'durationLessThan'; readonly valueMs: number }
  | { readonly type: 'responseTimeLessThan'; readonly valueMs: number }
  | { readonly type: 'script'; readonly source: string };

export interface VariableExtraction {
  readonly id: string;
  readonly name: string;
  readonly path: string;
}

export function emptyRequest(id: string, name: string): RequestDefinition {
  return {
    id,
    name,
    method: 'GET',
    url: '',
    headers: [],
    queryParams: [],
    pathParams: [],
    body: { type: 'none' },
    auth: { type: 'none' },
    timeoutMs: 30_000,
    retry: {
      enabled: false,
      maxAttempts: 1,
      initialDelayMs: 500,
      backoff: 'fixed',
      retryOn: [],
      retryStatusCodes: [],
    },
    preRequest: [],
    postRequest: [],
    variableExtractions: [],
  };
}