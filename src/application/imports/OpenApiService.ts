import { AppError } from '@shared/errors';
import { OpenApiImporter, type CollectionGenerator } from '@infrastructure/openapi/OpenApiImporter';

let active: OpenApiImporter | undefined;

export function setOpenApiImporter(importer: OpenApiImporter): void {
  active = importer;
}

function require(): OpenApiImporter {
  if (!active) throw new Error('OpenApiImporter not configured.');
  return active;
}

export class OpenApiService {
  importFromText(text: string): CollectionGenerator {
    try {
      return require().importFromText(text);
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw new AppError({ code: 'OpenApiError', message: (e as Error).message, cause: e });
    }
  }
}
