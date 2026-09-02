import type { Auth, RequestBody, RequestDefinition } from '@domain/request/RequestDefinition';
import { VariableResolver, variableResolver } from '@domain/variable/VariableResolver';
import type { VariableBundle } from '@domain/variable/VariableScope';
import type { BuiltRequest } from '@application/requests/httpClientPort';

export interface BuiltRequestInput {
  readonly request: RequestDefinition;
  readonly bundle: VariableBundle;
}

export class RequestBuilder {
  constructor(private readonly resolver: VariableResolver = variableResolver) {}

  build({ request, bundle }: BuiltRequestInput): BuiltRequest {
    const url = this.buildUrl(request, bundle);
    const headers = this.buildHeaders(request, bundle);
    const body = this.buildBody(request, bundle);
    const authHeaders = this.buildAuthHeaders(request.auth, bundle);
    const allHeaders = [...headers, ...authHeaders];

    return {
      method: request.method,
      url,
      headers: allHeaders,
      body,
      timeoutMs: request.timeoutMs,
    };
  }

  private buildUrl(request: RequestDefinition, bundle: VariableBundle): string {
    const baseUrl = this.resolver.resolve(request.url, bundle).value;
    const params: Array<readonly [string, string]> = request.queryParams
      .filter((p) => p.enabled && p.key)
      .map((p) => [p.key, this.resolver.resolve(p.value, bundle).value] as const);

    let url = baseUrl;
    for (const p of request.pathParams) {
      if (!p.enabled || !p.key) continue;
      const resolved = this.resolver.resolve(p.value, bundle).value;
      url = url.replace(`:${p.key}`, encodeURIComponent(resolved)).replace(`{${p.key}}`, encodeURIComponent(resolved));
    }

    if (params.length > 0) {
      const qs = new URLSearchParams();
      for (const [k, v] of params) qs.append(k, v);
      url += (url.includes('?') ? '&' : '?') + qs.toString();
    }
    return url;
  }

  private buildHeaders(request: RequestDefinition, bundle: VariableBundle): ReadonlyArray<readonly [string, string]> {
    const out: Array<readonly [string, string]> = [];
    for (const h of request.headers) {
      if (!h.enabled || !h.key) continue;
      out.push([h.key, this.resolver.resolve(h.value, bundle).value] as const);
    }
    return out;
  }

  private buildAuthHeaders(auth: Auth, bundle: VariableBundle): ReadonlyArray<readonly [string, string]> {
    const r = this.resolver;
    switch (auth.type) {
      case 'none':
        return [];
      case 'bearer':
        return [['Authorization', `Bearer ${r.resolve(auth.token, bundle).value}`] as const];
      case 'basic': {
        const user = r.resolve(auth.username, bundle).value;
        const pass = r.resolve(auth.password, bundle).value;
        const encoded = btoa(`${user}:${pass}`);
        return [['Authorization', `Basic ${encoded}`] as const];
      }
      case 'apiKey':
        return auth.in === 'header'
          ? [[auth.key, r.resolve(auth.value, bundle).value] as const]
          : [];
    }
  }

  private buildBody(request: RequestDefinition, bundle: VariableBundle): BodyInit | undefined {
    const r = this.resolver;
    const body: RequestBody = request.body;
    switch (body.type) {
      case 'none':
        return undefined;
      case 'json':
        return r.resolve(body.content, bundle).value;
      case 'raw':
        return r.resolve(body.content, bundle).value;
      case 'text':
        return r.resolve(body.content, bundle).value;
      case 'formUrlEncoded': {
        const params = new URLSearchParams();
        for (const f of body.fields) {
          if (f.enabled && f.key) params.append(f.key, r.resolve(f.value, bundle).value);
        }
        return params.toString();
      }
      case 'multipart':
        return this.buildMultipart(body, bundle);
      case 'binary':
        return undefined;
    }
  }

  private buildMultipart(body: Extract<RequestBody, { type: 'multipart' }>, bundle: VariableBundle): FormData {
    const form = new FormData();
    const r = this.resolver;
    for (const f of body.fields) {
      if (!f.enabled || !f.key) continue;
      if (f.value.kind === 'text') {
        form.append(f.key, r.resolve(f.value.text, bundle).value);
      }
    }
    return form;
  }
}

export const requestBuilder = new RequestBuilder();