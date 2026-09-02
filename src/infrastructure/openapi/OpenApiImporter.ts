import { AppError } from '@shared/errors';
import type { Collection, CollectionFolder } from '@domain/collection/Collection';
import { emptyCollection, emptyFolder } from '@domain/collection/Collection';
import type { KeyValue, HttpMethod, RequestDefinition } from '@domain/request/RequestDefinition';
import { emptyRequest } from '@domain/request/RequestDefinition';
import { createId } from '@shared/id';

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
  readonly schema?: unknown;
  readonly sample?: unknown;
}

function sampleFromSchema(schema: unknown): unknown {
  if (!schema || typeof schema !== 'object') return undefined;
  const s = schema as {
    type?: unknown;
    example?: unknown;
    default?: unknown;
    properties?: Record<string, unknown>;
    items?: unknown;
    required?: string[];
  };
  if ('example' in s) return s.example;
  if ('default' in s) return s.default;
  const t = Array.isArray(s.type) ? s.type[0] : s.type;
  switch (t) {
    case 'object': {
      const out: Record<string, unknown> = {};
      if (s.properties) {
        for (const [k, prop] of Object.entries(s.properties)) {
          out[k] = sampleFromSchema(prop);
        }
      }
      return out;
    }
    case 'array':
      return s.items ? [sampleFromSchema(s.items)] : [];
    case 'string':
      return s.example ?? '';
    case 'number':
    case 'integer':
      return typeof s.example === 'number' ? s.example : 0;
    case 'boolean':
      return typeof s.example === 'boolean' ? s.example : false;
    default:
      return undefined;
  }
}

export class OpenApiImporter {
  importFromText(text: string): CollectionGenerator {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      throw new AppError({
        code: 'OpenApiError',
        message: 'Only JSON OpenAPI documents are supported at this time',
        cause: e,
      });
    }
    return this.fromObject(parsed);
  }

  private fromObject(doc: unknown): CollectionGenerator {
    if (!doc || typeof doc !== 'object') {
      throw new AppError({ code: 'OpenApiError', message: 'Document must be an object' });
    }
    const obj = doc as {
      openapi?: string;
      swagger?: string;
      info?: { title?: string };
      servers?: Array<{ url: string }>;
      paths?: Record<string, Record<string, unknown>>;
    };
    if (!(obj.openapi || obj.swagger)) {
      throw new AppError({ code: 'OpenApiError', message: 'Not an OpenAPI document' });
    }
    const baseUrl = obj.servers?.[0]?.url ?? '';
    const title = obj.info?.title ?? 'Imported API';
    const operations: NormalizedOperation[] = [];
    const paths = obj.paths ?? {};
    for (const [path, pathItem] of Object.entries(paths)) {
      if (!pathItem) continue;
      const item = pathItem as { parameters?: unknown[]; [k: string]: unknown };
      const pathLevelParams = Array.isArray(item.parameters) ? item.parameters : [];
      for (const [m, opRaw] of Object.entries(item)) {
        const method = m.toUpperCase();
        if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(method))
          continue;
        const op = opRaw as {
          operationId?: string;
          summary?: string;
          tags?: string[];
          parameters?: unknown[];
          requestBody?: unknown;
        };
        operations.push({
          operationId: op.operationId ?? `${method}_${path}`.replace(/[^a-zA-Z0-9]/g, '_'),
          summary: op.summary,
          method: method as HttpMethod,
          path,
          tags: op.tags ?? [],
          parameters: this.normalizeParameters(
            this.mergeParameters(pathLevelParams, op.parameters ?? []),
          ),
          requestBody: op.requestBody ? this.normalizeRequestBody(op.requestBody) : undefined,
        });
      }
    }
    const model: NormalizedApiModel = { title, baseUrl, operations };
    return new CollectionGenerator(model);
  }

  private mergeParameters(pathLevel: unknown[], operation: unknown[]): unknown[] {
    const byKey = new Map<string, unknown>();
    const order: string[] = [];
    for (const p of [...pathLevel, ...operation]) {
      const obj = p as { name?: string; in?: string };
      if (!obj.name) continue;
      const key = `${obj.name}:${obj.in ?? 'query'}`;
      if (!order.includes(key)) order.push(key);
      byKey.set(key, p);
    }
    return order.map((k) => byKey.get(k));
  }

  private normalizeParameters(params: unknown): NormalizedParameter[] {
    if (!Array.isArray(params)) return [];
    return params.map((p) => {
      const obj = p as {
        name?: string;
        in?: string;
        required?: boolean;
        description?: string;
        schema?: unknown;
      };
      return {
        name: obj.name ?? '',
        in: obj.in === 'header' || obj.in === 'query' || obj.in === 'path' ? obj.in : 'query',
        required: !!obj.required,
        description: obj.description,
        schema: obj.schema,
      } satisfies NormalizedParameter;
    });
  }

  private normalizeRequestBody(body: unknown): NormalizedRequestBody {
    const obj = body as {
      required?: boolean;
      content?: Record<
        string,
        { schema?: unknown; example?: unknown; examples?: Record<string, { value?: unknown }> }
      >;
    };
    const content = obj.content ?? {};
    const contentTypes = Object.keys(content);
    const jsonKey = contentTypes.includes('application/json')
      ? 'application/json'
      : contentTypes[0];
    const entry = jsonKey ? content[jsonKey] : undefined;
    const schema = entry?.schema;
    const sample = entry?.example;
    return { required: !!obj.required, contentTypes, schema, sample };
  }
}

export class CollectionGenerator {
  constructor(private readonly model: NormalizedApiModel) {}

  toCollection(name?: string): Collection {
    const coll = emptyCollection(name ?? this.model.title);

    const byTag = new Map<string, NormalizedOperation[]>();
    for (const op of this.model.operations) {
      const tag = op.tags[0] ?? 'Untagged';
      const list = byTag.get(tag) ?? [];
      list.push(op);
      byTag.set(tag, list);
    }

    const folders: CollectionFolder[] = [];
    const requests: RequestDefinition[] = [];

    for (const [tag, ops] of byTag) {
      const folder: CollectionFolder = emptyFolder(tag, null);
      folders.push(folder);
      const folderIdx = folders.length - 1;
      for (const op of ops) {
        const req = emptyRequest(crypto.randomUUID(), op.summary ?? op.operationId);
        const url = this.model.baseUrl.replace(/\/$/, '') + op.path;
        const headers: KeyValue[] = [];
        const queryParams: KeyValue[] = [];
        const pathParams: KeyValue[] = [];
        for (const p of op.parameters) {
          const entry: KeyValue = {
            id: createId('kv'),
            key: p.name,
            value: '',
            enabled: p.required,
            description: p.description,
          };
          if (p.in === 'header') headers.push(entry);
          else if (p.in === 'path') pathParams.push(entry);
          else queryParams.push(entry);
        }
        if (op.requestBody) {
          const contentType = op.requestBody.contentTypes.includes('application/json')
            ? 'application/json'
            : (op.requestBody.contentTypes[0] ?? 'application/json');
          headers.push({
            id: createId('kv'),
            key: 'Content-Type',
            value: contentType,
            enabled: true,
          });
        }
        const rawSample = op.requestBody
          ? (op.requestBody.sample ?? sampleFromSchema(op.requestBody.schema))
          : undefined;
        const body: RequestDefinition['body'] = op.requestBody
          ? {
              type: 'json',
              content:
                typeof rawSample === 'string'
                  ? rawSample
                  : JSON.stringify(rawSample ?? {}, null, 2),
            }
          : { type: 'none' };
        const built: RequestDefinition = {
          ...req,
          method: op.method,
          url,
          headers,
          queryParams,
          pathParams,
          body,
          description: op.summary && op.operationId !== op.summary ? op.summary : undefined,
        };
        requests.push(built);
        folders[folderIdx] = {
          ...folder,
          requestIds: [...folders[folderIdx]!.requestIds, built.id],
        };
      }
    }

    return { ...coll, folders, requests };
  }
}
