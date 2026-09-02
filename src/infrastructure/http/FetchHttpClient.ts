import type { BuiltRequest, HttpClient, HttpResponsePayload, HttpResult } from '@application/requests/httpClientPort';

export class FetchHttpClient implements HttpClient {
  async execute(built: BuiltRequest): Promise<HttpResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), built.timeoutMs);
    const start = performance.now();
    try {
      const res = await fetch(built.url, {
        method: built.method,
        headers: Object.fromEntries(built.headers),
        body: built.body,
        signal: controller.signal,
      });
      const bodyText = await res.text();
      const headers: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        headers[k] = v;
      });
      const contentType = headers['content-type'] ?? '';
      const payload: HttpResponsePayload = {
        status: res.status,
        statusText: res.statusText,
        headers,
        bodyText,
        contentType,
        durationMs: Math.round(performance.now() - start),
      };
      return { ok: true, value: payload };
    } catch (e) {
      const isAbort = (e as { name?: string }).name === 'AbortError';
      return {
        ok: false,
        error: {
          kind: isAbort ? 'timeout' : 'network',
          message: (e as Error).message ?? 'Unknown fetch error',
        },
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}