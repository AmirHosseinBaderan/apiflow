import type { Pinia } from 'pinia';
import { LocalStorageCollectionRepository } from '@infrastructure/persistence/LocalStorageCollectionRepository';
import { FetchHttpClient } from '@infrastructure/http/FetchHttpClient';
import { OpenApiImporter } from '@infrastructure/openapi/OpenApiImporter';
import { CollectionService } from '@application/collections/CollectionService';
import { RequestExecutionService } from '@application/requests/RequestExecutionService';
import { OpenApiService, setOpenApiImporter } from '@application/imports/OpenApiService';
import { setCollectionRepository } from '@application/collections/collectionRepositoryPort';
import { setHttpClient } from '@application/requests/httpClientPort';
import { useCollectionStore } from '@stores/useCollectionStore';
import { useExecutionStore } from '@stores/useExecutionStore';

export interface AppServices {
  openApiService: OpenApiService;
}

export function configureAppServices(pinia: Pinia): AppServices {
  const repo = new LocalStorageCollectionRepository();
  const http = new FetchHttpClient();
  const openApi = new OpenApiImporter();

  setCollectionRepository(repo);
  setHttpClient(http);
  setOpenApiImporter(openApi);

  const collections = new CollectionService(repo);
  const executor = new RequestExecutionService(http);
  const openApiService = new OpenApiService();

  const collectionStore = useCollectionStore(pinia);
  collectionStore.bindService(collections);

  const executionStore = useExecutionStore(pinia);
  executionStore.bindService(executor);

  return { openApiService };
}
