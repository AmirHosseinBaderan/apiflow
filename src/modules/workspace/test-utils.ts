import type { Collection } from '@domain/collection/Collection';
import { emptyCollection } from '@domain/collection/Collection';
import { emptyRequest } from '@domain/request/RequestDefinition';

export function createCollectionWithRequests(): Collection {
  const collection = emptyCollection('Test');
  const r1 = emptyRequest('req-1', 'List users');
  const r2 = emptyRequest('req-2', 'Get user');
  return {
    ...collection,
    id: 'c',
    requests: [r1, r2],
    workflows: [
      {
        id: 'wf-1',
        name: 'My workflow',
        steps: [
          {
            id: 'step_1',
            requestId: r1.id,
            variableMappings: [],
            condition: { type: 'always' },
            next: { type: 'next' },
          },
          {
            id: 'step_2',
            requestId: r2.id,
            variableMappings: [],
            condition: { type: 'always' },
            next: { type: 'end' },
          },
        ],
      },
    ],
  };
}
