import type { Collection } from '@domain/collection/Collection';
import { AppError } from '@shared/errors';

export const COLLECTION_FORMAT = 'api-testing-collection';
export const COLLECTION_VERSION = '1.0';

export interface ExportDocument {
  readonly format: typeof COLLECTION_FORMAT;
  readonly version: string;
  readonly collection: Collection;
}

export class CollectionExporter {
  export(collection: Collection): string {
    const doc: ExportDocument = {
      format: COLLECTION_FORMAT,
      version: COLLECTION_VERSION,
      collection,
    };
    return JSON.stringify(doc, null, 2);
  }
}

export class CollectionImporter {
  import(raw: string): Collection {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      throw new AppError({ code: 'ImportError', message: 'Invalid JSON', cause: e });
    }
    if (!parsed || typeof parsed !== 'object') {
      throw new AppError({ code: 'ImportError', message: 'Document must be an object' });
    }
    const doc = parsed as Partial<ExportDocument>;
    if (doc.format !== COLLECTION_FORMAT) {
      throw new AppError({ code: 'ImportError', message: `Unsupported format: ${String(doc.format)}` });
    }
    if (typeof doc.version !== 'string' || !doc.version.startsWith('1.')) {
      throw new AppError({ code: 'ImportError', message: `Unsupported version: ${String(doc.version)}` });
    }
    if (!doc.collection || typeof doc.collection !== 'object') {
      throw new AppError({ code: 'ImportError', message: 'Missing collection payload' });
    }
    return doc.collection;
  }
}