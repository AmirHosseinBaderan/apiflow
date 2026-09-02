import { AppError } from '@shared/errors';
import type { Collection } from '@domain/collection/Collection';
import { emptyCollection } from '@domain/collection/Collection';
import type { KeyValue, HttpMethod, RequestDefinition } from '@domain/request/RequestDefinition';
import { emptyRequest } from '@domain/request/RequestDefinition';

export interface NormalizedApiModel {
  readonly title: string;
  readonly baseUrl: string;
  readonly operations: ReadonlyArray<NormalizedOperation>;
}

export interface NormalizedOperation {
  readonly operationId: string;
  readonly summary?: string;
  readonly method: HttpMethod;
  readonly path: string;
  readonly tags: ReadonlyArray<string>;
  readonly parameters: ReadonlyArray<NormalizedParameter>;
  readonly requestBody?: NormalizedRequestBody;
}

export type NormalizedParameter = {
  readonly name: string;
  readonly in: 'header' | 'query' | 'path';
  readonly required: boolean;
  readonly description?: string;
  readonly schema?: unknown;
};

export interface NormalizedRequestBody {
  readonly required: boolean;
  readonly contentTypes: ReadonlyArray<string>;
}

export class OpenApiImporter {
  importFromText(text: string): CollectionGenerator {
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch (e) {
      throw new AppError({ code: 'OpenApiError', message: 'Only JSON OpenAPI documents are supported at this time', cause: e });
    }
    return this.fromObject(parsed);
  }

  private fromObject(doc: unknown): CollectionGenerator {
    if (!doc || typeof doc !== 'object') {
      throw new AppError({ code: 'OpenApiError', message: 'Document must be an object' });
    }
    const obj = doc as { openapi?: string; swagger?: string; info?: { title?: string }; servers?: Array<{ url: string }>; paths?: Record<string, Record<string, unknown>> };
    if (!(obj.openapi || obj.swagger)) {
      throw new AppError({ code: 'OpenApiError', message: 'Not an OpenAPI document' });
    }
    const baseUrl = obj.servers?.[0]?.url ?? '';
    const title = obj.info?.title ?? 'Imported API';
    const operations: NormalizedOperation[] = [];
    const paths = obj.paths ?? {};
    for (const [path, methods] of Object.entries(paths)) {
      if (!methods) continue;
      for (const [m, opRaw] of Object.entries(methods)) {
        const method = m.toUpperCase();
        if (!['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS'].includes(method)) continue;
        const op = opRaw as { operationId?: string; summary?: string; tags?: string[]; parameters?: unknown[]; requestBody?: unknown };
        operations.push({
          operationId: op.operationId ?? `${method}_${path}`.replace(/[^a-zA-Z0-9]/g, '_'),
          summary: op.summary,
          method: method as HttpMethod,
          path,
          tags: op.tags ?? [],
          parameters: this.normalizeParameters(op.parameters),
          requestBody: op.requestBody ? { required: false, contentTypes: ['application/json'] } : undefined,
        });
      }
    }
    const model: NormalizedApiModel = { title, baseUrl, operations };
    return new CollectionGenerator(model);
  }

  private normalizeParameters(params: unknown): NormalizedParameter[] {
    if (!Array.isArray(params)) return [];
    return params.map((p) => {
      const obj = p as { name?: string; in?: string; required?: boolean; description?: string; schema?: unknown };
      return {
        name: obj.name ?? '',
        in: (obj.in === 'header' || obj.in === 'query' || obj.in === 'path') ? obj.in : 'query',
        required: !!obj.required,
        description: obj.description,
        schema: obj.schema,
      } satisfies NormalizedParameter;
    });
  }
}

export class CollectionGenerator {
  constructor(private readonly model: NormalizedApiModel) {}

  toCollection(name?: string): Collection {
    const coll = emptyCollection(name ?? this.model.title);
    const requests = this.model.operations.map((op) => {
      const req = emptyRequest(crypto.randomUUID(), op.summary ?? op.operationId);
      const url = this.model.baseUrl.replace(/\/$/, '') + op.path;
      const headers: KeyValue[] = [];
      const queryParams: KeyValue[] = [];
      const pathParams: KeyValue[] = [];
      for (const p of op.parameters) {
        const entry: KeyValue = { id: crypto.randomUUID(), key: p.name, value: '', enabled: p.required, description: p.description };
        if (p.in === 'header') headers.push(entry);
        else if (p.in === 'path') pathParams.push(entry);
        else queryParams.push(entry);
      }
      if (op.requestBody) {
        headers.push({ id: crypto.randomUUID(), key: 'Content-Type', value: 'application/json', enabled: true });
      }
      const body: RequestDefinition['body'] = op.requestBody
        ? { type: 'json', content: '{}' }
        : { type: 'none' };
      return {
        ...req,
        method: op.method,
        url,
        headers,
        queryParams,
        pathParams,
        body,
      };
    });
    return { ...coll, requests };
  }
}