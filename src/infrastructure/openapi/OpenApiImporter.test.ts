import { describe, expect, it } from 'vitest';
import { OpenApiImporter } from '@infrastructure/openapi/OpenApiImporter';
import { AppError } from '@shared/errors';
import type { RequestDefinition } from '@domain/request/RequestDefinition';

const sample = JSON.stringify({
  openapi: '3.0.0',
  info: { title: 'Pet Store', version: '1.0.0' },
  servers: [{ url: 'https://api.petstore.com' }],
  paths: {
    '/pets': {
      get: {
        operationId: 'listPets',
        summary: 'List all pets',
        parameters: [{ name: 'limit', in: 'query', required: false }],
      },
      post: {
        operationId: 'createPet',
        summary: 'Create pet',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  status: { type: 'integer' },
                  active: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    },
    '/pets/{id}': {
      get: {
        operationId: 'getPet',
        summary: 'Get pet',
        parameters: [{ name: 'id', in: 'path', required: true }],
      },
    },
  },
});

describe('OpenApiImporter', () => {
  it('imports JSON OpenAPI into a collection', () => {
    const generator = new OpenApiImporter().importFromText(sample);
    const collection = generator.toCollection();
    expect(collection.requests).toHaveLength(3);
    expect(collection.requests[0]?.method).toBe('GET');
    expect(collection.requests[0]?.url).toBe('https://api.petstore.com/pets');
    const get = collection.requests.find((r) => r.name === 'Get pet');
    expect(get?.pathParams[0]?.key).toBe('id');
    const created = collection.requests.find((r) => r.name === 'Create pet');
    expect(created?.headers.find((h) => h.key === 'Content-Type')?.value).toBe('application/json');
    expect(created?.body.type).toBe('json');
    expect(JSON.parse((created?.body.type === 'json' ? created.body.content : '{}'))).toEqual({
      name: '',
      status: 0,
      active: false,
    });
  });

  it('groups operations into folders by tag', () => {
    const tagged = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Tag Demo' },
      paths: {
        '/a': { get: { operationId: 'aGet', tags: ['Users'] } },
        '/b': { post: { operationId: 'bPost', tags: ['Posts'] } },
        '/c': { get: { operationId: 'cGet', tags: ['Users'] } },
        '/d': { get: { operationId: 'dGet' } },
      },
    });
    const collection = new OpenApiImporter().importFromText(tagged).toCollection();
    expect(collection.folders.map((f) => f.name).sort()).toEqual(['Posts', 'Untagged', 'Users']);
    const users = collection.folders.find((f) => f.name === 'Users');
    expect(users?.requestIds).toHaveLength(2);
    const untagged = collection.folders.find((f) => f.name === 'Untagged');
    expect(untagged?.requestIds).toHaveLength(1);
  });

  it('imports path-level parameters and per-operation overrides', () => {
    const doc = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Path Params' },
      servers: [{ url: 'https://api.example.com' }],
      paths: {
        '/items/{id}': {
          parameters: [{ name: 'id', in: 'path', required: true }],
          get: {
            operationId: 'getItem',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }, { name: 'fields', in: 'query' }],
            requestBody: { content: { 'application/json': { example: { name: 'widget', qty: 2 } } } },
          },
        },
      },
    });
    const collection = new OpenApiImporter().importFromText(doc).toCollection();
    const get = collection.requests[0] as RequestDefinition;
    expect(get?.pathParams.map((p) => p.key).sort()).toEqual(['id']);
    expect(get?.queryParams.map((p) => p.key)).toEqual(['fields']);
    expect(JSON.parse(get?.body.type === 'json' ? get.body.content : '{}')).toEqual({ name: 'widget', qty: 2 });
  });

  it('rejects non-openapi', () => {
    expect(() => new OpenApiImporter().importFromText(JSON.stringify({ foo: 1 }))).toThrow(AppError);
  });
});