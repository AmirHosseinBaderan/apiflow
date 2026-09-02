export interface BuiltRequest {
  readonly method: string;
  readonly url: string;
  readonly headers: ReadonlyArray<readonly [string, string]>;
  readonly body?: BodyInit;
  readonly signal?: AbortSignal;
  readonly timeoutMs: number;
}

export interface HttpResponsePayload {
  readonly status: number;
  readonly statusText: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly bodyText: string;
  readonly contentType: string;
  readonly durationMs: number;
}

export interface HttpErrorPayload {
  readonly kind: 'network' | 'timeout' | 'abort';
  readonly message: string;
}

export type HttpResult =
  | { readonly ok: true; readonly value: HttpResponsePayload }
  | { readonly ok: false; readonly error: HttpErrorPayload };

export interface HttpClient {
  execute(built: BuiltRequest): Promise<HttpResult>;
}

let active: HttpClient | undefined;

export function setHttpClient(client: HttpClient): void {
  active = client;
}

export function httpClient(): HttpClient {
  if (!active) {
    throw new Error('HttpClient not configured. Call setHttpClient() at bootstrap.');
  }
  return active;
}
