import type { Pinia } from 'pinia';
import { LocalStorageCollectionRepository } from '@infrastructure/persistence/LocalStorageCollectionRepository';
import { HttpCollectionRepository } from '@infrastructure/persistence/HttpCollectionRepository';
import { FetchHttpClient } from '@infrastructure/http/FetchHttpClient';
import { OpenApiImporter } from '@infrastructure/openapi/OpenApiImporter';
import { CollectionService } from '@application/collections/CollectionService';
import { RequestExecutionService } from '@application/requests/RequestExecutionService';
import { OpenApiService, setOpenApiImporter } from '@application/imports/OpenApiService';
import { setCollectionRepository } from '@application/collections/collectionRepositoryPort';
import { setHttpClient } from '@application/requests/httpClientPort';
import { useCollectionStore } from '@stores/useCollectionStore';
import { useExecutionStore } from '@stores/useExecutionStore';
import axios from 'axios';

export interface AppServices {
  openApiService: OpenApiService;
}

async function detectServer(): Promise<boolean> {
  try {
    await axios.get('/health');
    return true;
  } catch {
    return false;
  }
}

export async function configureAppServices(pinia: Pinia): Promise<AppServices> {
  const useServer = await detectServer();
  const repo = useServer ? new HttpCollectionRepository() : new LocalStorageCollectionRepository();
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
