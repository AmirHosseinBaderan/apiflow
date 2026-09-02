import { describe, expect, it } from 'vitest';
import { CollectionExporter, CollectionImporter } from '@application/imports/CollectionExchange';
import { emptyCollection } from '@domain/collection/Collection';
import { emptyRequest } from '@domain/request/RequestDefinition';
import { AppError } from '@shared/errors';

describe('CollectionExporter / Importer', () => {
  it('round-trips a collection', () => {
    const collection = emptyCollection('Demo');
    const request = emptyRequest('r1', 'Get Users');
    const updated = { ...collection, requests: [request] };
    const text = new CollectionExporter().export(updated);
    const restored = new CollectionImporter().import(text);
    expect(restored.name).toBe('Demo');
    expect(restored.requests).toHaveLength(1);
  });

  it('rejects invalid JSON', () => {
    expect(() => new CollectionImporter().import('{')).toThrow(AppError);
  });

  it('rejects wrong format', () => {
    expect(() => new CollectionImporter().import(JSON.stringify({ format: 'other', version: '1.0', collection: {} }))).toThrow(AppError);
  });
});