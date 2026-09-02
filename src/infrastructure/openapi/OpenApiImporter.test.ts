import { describe, expect, it } from 'vitest';
import { OpenApiImporter } from '@infrastructure/openapi/OpenApiImporter';
import { AppError } from '@shared/errors';

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
        requestBody: { required: true, content: { 'application/json': {} } },
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
  });

  it('rejects non-openapi', () => {
    expect(() => new OpenApiImporter().importFromText(JSON.stringify({ foo: 1 }))).toThrow(AppError);
  });
});