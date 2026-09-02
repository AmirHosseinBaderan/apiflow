import type { RequestDefinition } from '@domain/request/RequestDefinition';
import type { VariableEntry } from '@domain/variable/VariableScope';
import { createId } from '@shared/id';

export interface CollectionFolder {
  readonly id: string;
  readonly name: string;
  readonly parentId: string | null;
  readonly requestIds: ReadonlyArray<string>;
  readonly childFolderIds: ReadonlyArray<string>;
}

export interface Collection {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly folders: ReadonlyArray<CollectionFolder>;
  readonly requests: ReadonlyArray<RequestDefinition>;
  readonly variables: ReadonlyArray<VariableEntry>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function emptyCollection(name: string): Collection {
  const now = new Date().toISOString();
  return {
    id: createId('col'),
    name,
    folders: [],
    requests: [],
    variables: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function emptyFolder(name: string, parentId: string | null = null): CollectionFolder {
  return {
    id: createId('fld'),
    name,
    parentId,
    requestIds: [],
    childFolderIds: [],
  };
}