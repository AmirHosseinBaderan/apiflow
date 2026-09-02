<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-text>
            <v-row align="center">
              <v-col cols="auto">
                <v-select
                  v-model="localMethod"
                  :items="methods"
                  label="Method"
                  density="compact"
                  hide-details
                  style="min-width: 130px"
                  @update:model-value="commit"
                />
              </v-col>
              <v-col>
                <v-text-field
                  v-model="localUrl"
                  placeholder="https://api.example.com/path"
                  prepend-inner-icon="mdi-link-variant"
                  density="compact"
                  hide-details
                  @update:model-value="commit"
                />
              </v-col>
              <v-col cols="auto">
                <v-btn color="primary" prepend-icon="mdi-send" :loading="running" @click="run">Send</v-btn>
                <v-btn class="ml-2" variant="tonal" prepend-icon="mdi-content-save" @click="save">Save</v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <div class="d-flex align-start">
          <v-text-field
            v-model="nameLocal"
            label="Request name"
            density="compact"
            hide-details
            variant="plain"
            class="text-h6"
            style="max-width: 480px"
            @update:model-value="onNameChange"
          />
          <v-spacer />
          <v-chip v-if="props.request.method" size="small" color="primary" label class="mt-3">{{ props.request.method }}</v-chip>
        </div>
        <v-text-field
          v-model="descLocal"
          label="Description"
          placeholder="What does this request do?"
          density="compact"
          hide-details
          variant="outlined"
          class="mt-1"
          @update:model-value="onDescChange"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-tabs v-model="reqTab" color="primary" density="comfortable">
            <v-tab value="params">Params</v-tab>
            <v-tab value="headers">Headers</v-tab>
            <v-tab value="body">Body</v-tab>
            <v-tab value="auth">Auth</v-tab>
            <v-tab value="pre">Pre-req</v-tab>
            <v-tab value="tests">Tests</v-tab>
            <v-tab value="extract">Extract</v-tab>
            <v-tab value="settings">Settings</v-tab>
          </v-tabs>
          <v-card-text>
            <v-tabs-window v-model="reqTab">
              <v-tabs-window-item value="params">
                <KeyValueEditor v-model="queryParamsLocal" @update:model-value="onParamChange" />
              </v-tabs-window-item>
              <v-tabs-window-item value="headers">
                <KeyValueEditor v-model="headersLocal" @update:model-value="onHeaderChange" />
              </v-tabs-window-item>
              <v-tabs-window-item value="body">
                <v-select
                  v-model="bodyType"
                  :items="bodyTypes"
                  label="Body type"
                  density="compact"
                  hide-details
                  class="mb-3"
                  @update:model-value="onBodyTypeChange"
                />
                <JsonEditor
                  v-if="bodyType === 'json'"
                  v-model="bodyContent"
                  :rows="8"
                  @update:model-value="onBodyContentChange"
                />
                <v-textarea
                  v-else-if="['raw', 'text'].includes(bodyType)"
                  v-model="bodyContent"
                  :rows="8"
                  density="compact"
                  hide-details
                  @update:model-value="onBodyContentChange"
                />
                <KeyValueEditor
                  v-if="bodyType === 'form'"
                  :model-value="formFields"
                  @update:model-value="onFormChange"
                />
                <div v-if="bodyType === 'multipart'">
                  <v-row
                    v-for="(f, i) in multipartFields"
                    :key="f.id"
                    dense
                    align="center"
                    class="mb-1"
                  >
                    <v-col cols="auto"><v-checkbox-btn v-model="f.enabled" density="compact" /></v-col>
                    <v-col><v-text-field v-model="f.key" placeholder="key" density="compact" hide-details /></v-col>
                    <v-col>
                      <v-text-field
                        v-if="f.value.kind === 'text'"
                        v-model="f.value.text"
                        placeholder="text"
                        density="compact"
                        hide-details
                      />
                      <v-file-input
                        v-else
                        :model-value="undefined"
                        placeholder="file"
                        density="compact"
                        hide-details
                        prepend-icon=""
                        @update:model-value="onMultipartFile(i, $event)"
                      />
                    </v-col>
                    <v-col cols="auto">
                      <v-btn icon="mdi-swap-horizontal" size="small" variant="text" @click="toggleMultipartKind(i)" />
                      <v-btn icon="mdi-delete" size="small" variant="text" @click="removeMultipart(i)" />
                    </v-col>
                  </v-row>
                  <v-btn size="small" variant="text" prepend-icon="mdi-plus" @click="addMultipartText">Add field</v-btn>
                </div>
                <div v-if="bodyType === 'binary'">
                  <v-file-input label="Select file" density="compact" hide-details @update:model-value="onBinaryFile" />
                </div>
              </v-tabs-window-item>
              <v-tabs-window-item value="auth">
                <v-select
                  v-model="authType"
                  :items="['none','bearer','basic','apiKey']"
                  label="Auth type"
                  density="compact"
                  hide-details
                  class="mb-3"
                  @update:model-value="onAuthChange"
                />
                <v-text-field
                  v-if="authType === 'bearer'"
                  v-model="bearerToken"
                  label="Token"
                  density="compact"
                  hide-details
                  @update:model-value="onAuthChange"
                />
                <template v-if="authType === 'basic'">
                  <v-text-field v-model="basicUser" label="Username" density="compact" hide-details @update:model-value="onAuthChange" />
                  <v-text-field v-model="basicPass" label="Password" type="password" density="compact" hide-details @update:model-value="onAuthChange" />
                </template>
                <template v-if="authType === 'apiKey'">
                  <v-text-field v-model="apiKeyName" label="Header / Query name" density="compact" hide-details @update:model-value="onAuthChange" />
                  <v-text-field v-model="apiKeyValue" label="Value" density="compact" hide-details @update:model-value="onAuthChange" />
                  <v-select v-model="apiKeyIn" :items="['header','query']" label="Add to" density="compact" hide-details @update:model-value="onAuthChange" />
                </template>
              </v-tabs-window-item>
              <v-tabs-window-item value="pre">
                <TestEditor :model-value="request.preRequest" @update:model-value="onPreChange" />
                <v-alert class="mt-2" type="info" variant="tonal" density="compact">
                  Pre-request scripts run before the HTTP call. Use <code>pm.variables.set('k','v')</code> to set runtime variables.
                </v-alert>
              </v-tabs-window-item>
              <v-tabs-window-item value="tests">
                <TestEditor :model-value="request.postRequest" @update:model-value="onTestsChange" />
              </v-tabs-window-item>
              <v-tabs-window-item value="extract">
                <VariableExtractorEditor
                  :model-value="request.variableExtractions"
                  @update:model-value="onExtractionsChange"
                />
              </v-tabs-window-item>
              <v-tabs-window-item value="settings">
                <v-text-field v-model.number="timeoutLocal" type="number" label="Timeout (ms)" density="compact" hide-details @update:model-value="onTimeoutChange" />
                <v-divider class="my-3" />
                <RetryPolicyEditor :model-value="retryLocal" @update:model-value="onRetryChange" />
              </v-tabs-window-item>
            </v-tabs-window>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <ResponsePanel
          :response="lastResult?.response"
          :tests="lastResult?.tests"
          :extracted="lastResult?.extractedVariables"
          :errors="lastResult?.errors"
          :attempts="lastResult?.attempts"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type {
  RequestDefinition,
  KeyValue,
  Auth,
  MultipartField,
  FileReference,
  RetryPolicyWithCodes,
} from '@domain/request/RequestDefinition';
import { HTTP_METHODS } from '@domain/request/RequestDefinition';
import { createId } from '@shared/id';
import JsonEditor from '@components/JsonEditor.vue';
import ResponsePanel from '@components/ResponsePanel.vue';
import RetryPolicyEditor from '@components/RetryPolicyEditor.vue';
import TestEditor from '@components/TestEditor.vue';
import VariableExtractorEditor from '@components/VariableExtractorEditor.vue';
import { useCollectionStore } from '@stores/useCollectionStore';
import { useExecutionStore } from '@stores/useExecutionStore';
import { useNotifier } from '@composables/useNotifier';

const props = defineProps<{ request: RequestDefinition }>();
const emit = defineEmits<{ (e: 'update:request', v: RequestDefinition): void }>();

const store = useCollectionStore();
const execution = useExecutionStore();
const { notify } = useNotifier();

const reqTab = ref('params');
const methods = HTTP_METHODS;

const localMethod = ref(props.request.method);
const localUrl = ref(props.request.url);
const nameLocal = ref(props.request.name);
const descLocal = ref(props.request.description ?? '');
const queryParamsLocal = ref<KeyValue[]>([...props.request.queryParams]);
const headersLocal = ref<KeyValue[]>([...props.request.headers]);
const timeoutLocal = ref(props.request.timeoutMs);
const retryLocal = ref<RetryPolicyWithCodes>({ ...props.request.retry, retryOn: [...props.request.retry.retryOn], retryStatusCodes: [...props.request.retry.retryStatusCodes] });

const bodyType = ref<string>('json');
const bodyContent = ref<string>('');
const formFields = ref<KeyValue[]>([]);
const multipartFields = ref<MultipartField[]>([]);

const authType = ref<'none' | 'bearer' | 'basic' | 'apiKey'>('none');
const bearerToken = ref('');
const basicUser = ref('');
const basicPass = ref('');
const apiKeyName = ref('');
const apiKeyValue = ref('');
const apiKeyIn = ref<'header' | 'query'>('header');

watch(() => props.request, (r) => syncFromProps(r), { immediate: true });

function syncFromProps(r: RequestDefinition) {
  localMethod.value = r.method;
  localUrl.value = r.url;
  nameLocal.value = r.name;
  descLocal.value = r.description ?? '';
  queryParamsLocal.value = [...r.queryParams];
  headersLocal.value = [...r.headers];
  timeoutLocal.value = r.timeoutMs;
  retryLocal.value = { ...r.retry, retryOn: [...r.retry.retryOn], retryStatusCodes: [...r.retry.retryStatusCodes] };
  syncBody(r);
  syncAuth(r.auth);
}

function syncBody(r: RequestDefinition) {
  const b = r.body;
  if (b.type === 'json' || b.type === 'raw' || b.type === 'text') {
    bodyType.value = b.type;
    bodyContent.value = b.content;
  } else if (b.type === 'formUrlEncoded') {
    bodyType.value = 'form';
    formFields.value = [...b.fields];
  } else if (b.type === 'multipart') {
    bodyType.value = 'multipart';
    multipartFields.value = [...b.fields];
  } else if (b.type === 'binary') {
    bodyType.value = 'binary';
  } else {
    bodyType.value = 'none';
  }
}

function syncAuth(auth: Auth) {
  authType.value = auth.type;
  if (auth.type === 'bearer') bearerToken.value = auth.token;
  if (auth.type === 'basic') {
    basicUser.value = auth.username;
    basicPass.value = auth.password;
  }
  if (auth.type === 'apiKey') {
    apiKeyName.value = auth.key;
    apiKeyValue.value = auth.value;
    apiKeyIn.value = auth.in;
  }
}

const bodyTypes = ['none', 'json', 'raw', 'text', 'form', 'multipart', 'binary'];

function emitUpdate(partial: Partial<RequestDefinition>) {
  emit('update:request', { ...props.request, ...partial });
}

function commit() {
  emitUpdate({ method: localMethod.value, url: localUrl.value });
}

function onNameChange() {
  const next = nameLocal.value.trim();
  if (next) emitUpdate({ name: next });
}

function onDescChange() {
  const v = descLocal.value.trim();
  emitUpdate({ description: v ? v : undefined });
}

function onParamChange(v: KeyValue[]) {
  queryParamsLocal.value = v;
  emitUpdate({ queryParams: v });
}

function onHeaderChange(v: KeyValue[]) {
  headersLocal.value = v;
  emitUpdate({ headers: v });
}

function onTimeoutChange() {
  emitUpdate({ timeoutMs: Number(timeoutLocal.value) || 30000 });
}

function onRetryChange(v: RequestDefinition['retry']) {
  retryLocal.value = v;
  emitUpdate({ retry: v });
}

function onBodyTypeChange() {
  const t = bodyType.value;
  if (t === 'json') {
    applyDefaultContentType('application/json');
    emitUpdate({ body: { type: 'json', content: bodyContent.value } });
  } else if (t === 'raw') {
    applyDefaultContentType('text/plain');
    emitUpdate({ body: { type: 'raw', contentType: 'text/plain', content: bodyContent.value } });
  } else if (t === 'text') {
    applyDefaultContentType('text/plain');
    emitUpdate({ body: { type: 'text', content: bodyContent.value } });
  } else if (t === 'form') {
    applyDefaultContentType('application/x-www-form-urlencoded');
    emitUpdate({ body: { type: 'formUrlEncoded', fields: formFields.value } });
  } else if (t === 'multipart') {
    // No default Content-Type for multipart; browser sets the boundary.
    emitUpdate({ body: { type: 'multipart', fields: multipartFields.value } });
  } else if (t === 'binary') {
    emitUpdate({ body: { type: 'binary', fileRef: { id: '0', name: '', size: 0, contentType: '', origin: { kind: 'browser', lastModified: 0 } } } });
  } else {
    removeContentType();
    emitUpdate({ body: { type: 'none' } });
  }
}

function applyDefaultContentType(value: string): void {
  const existing = headersLocal.value.find((h) => h.key.toLowerCase() === 'content-type');
  if (existing) {
    if (existing.value === value) return;
    headersLocal.value = headersLocal.value.map((h) =>
      h.id === existing.id ? { ...h, value, enabled: true } : h,
    );
  } else {
    headersLocal.value = [
      ...headersLocal.value,
      { id: createId('kv'), key: 'Content-Type', value, enabled: true },
    ];
  }
  emitUpdate({ headers: headersLocal.value });
}

function removeContentType(): void {
  const next = headersLocal.value.filter((h) => h.key.toLowerCase() !== 'content-type');
  if (next.length !== headersLocal.value.length) {
    headersLocal.value = next;
    emitUpdate({ headers: next });
  }
}

function onBodyContentChange() {
  if (bodyType.value === 'json') emitUpdate({ body: { type: 'json', content: bodyContent.value } });
  else if (bodyType.value === 'raw') emitUpdate({ body: { type: 'raw', contentType: 'text/plain', content: bodyContent.value } });
  else if (bodyType.value === 'text') emitUpdate({ body: { type: 'text', content: bodyContent.value } });
}

function onFormChange(v: KeyValue[]) {
  formFields.value = v;
  emitUpdate({ body: { type: 'formUrlEncoded', fields: v } });
}

function addMultipartText() {
  multipartFields.value = [
    ...multipartFields.value,
    { id: createId('mp'), key: '', enabled: true, value: { kind: 'text', text: '' } },
  ];
  emitUpdate({ body: { type: 'multipart', fields: multipartFields.value } });
}

function removeMultipart(i: number) {
  multipartFields.value = multipartFields.value.filter((_, idx) => idx !== i);
  emitUpdate({ body: { type: 'multipart', fields: multipartFields.value } });
}

function toggleMultipartKind(i: number) {
  multipartFields.value = multipartFields.value.map((f, idx) => {
    if (idx !== i) return f;
    if (f.value.kind === 'text') {
      return { ...f, value: { kind: 'file', file: { id: '0', name: '', size: 0, contentType: '', origin: { kind: 'browser', lastModified: 0 } } as FileReference } };
    }
    return { ...f, value: { kind: 'text', text: '' } };
  });
  emitUpdate({ body: { type: 'multipart', fields: multipartFields.value } });
}

function onMultipartFile(i: number, fileList: File | File[] | null) {
  const file = Array.isArray(fileList) ? fileList[0] : fileList;
  if (!file) return;
  multipartFields.value = multipartFields.value.map((f, idx) =>
    idx === i
      ? {
          ...f,
          value: {
            kind: 'file',
            file: {
              id: createId('file'),
              name: file.name,
              size: file.size,
              contentType: file.type,
              origin: { kind: 'browser', lastModified: file.lastModified },
            },
          },
        }
      : f,
  );
  emitUpdate({ body: { type: 'multipart', fields: multipartFields.value } });
}

function onBinaryFile(fileList: File | File[] | null) {
  const file = Array.isArray(fileList) ? fileList[0] : fileList;
  if (!file) return;
  const ref: FileReference = {
    id: createId('file'),
    name: file.name,
    size: file.size,
    contentType: file.type,
    origin: { kind: 'browser', lastModified: file.lastModified },
  };
  emitUpdate({ body: { type: 'binary', fileRef: ref } });
}

function onAuthChange() {
  let auth: Auth;
  if (authType.value === 'bearer') auth = { type: 'bearer', token: bearerToken.value };
  else if (authType.value === 'basic') auth = { type: 'basic', username: basicUser.value, password: basicPass.value };
  else if (authType.value === 'apiKey') auth = { type: 'apiKey', key: apiKeyName.value, value: apiKeyValue.value, in: apiKeyIn.value };
  else auth = { type: 'none' };
  emitUpdate({ auth });
}

function onPreChange(t: RequestDefinition['preRequest']) {
  emitUpdate({ preRequest: t });
}

function onTestsChange(t: RequestDefinition['postRequest']) {
  emitUpdate({ postRequest: t });
}

function onExtractionsChange(e: RequestDefinition['variableExtractions']) {
  emitUpdate({ variableExtractions: e });
}

const running = computed(() => execution.running);
const lastResult = computed(() => {
  if (!execution.lastResult) return null;
  if (execution.lastResult.requestId !== props.request.id) return null;
  return execution.lastResult;
});

async function run() {
  const collection = store.activeCollection;
  if (!isValidUrl(props.request.url)) {
    notify('Provide a valid URL (e.g. https://example.com/path).', 'error');
    return;
  }
  const dups = duplicateHeaderKeys(props.request.headers);
  if (dups.length) {
    notify(`Duplicate header keys: ${dups.join(', ')}`, 'warning');
    return;
  }
  await execution.run(props.request, collection?.variables ?? []);
}

function isValidUrl(value: string): boolean {
  return /^https?:\/\/.+/.test(value.trim());
}

function duplicateHeaderKeys(headers: ReadonlyArray<KeyValue>): string[] {
  const seen = new Map<string, number>();
  for (const h of headers) {
    if (!h.enabled) continue;
    const k = h.key.toLowerCase();
    seen.set(k, (seen.get(k) ?? 0) + 1);
  }
  return [...seen.entries()]
    .filter(([, n]) => n > 1)
    .map(([k]) => k);
}

async function save() {
  await store.updateRequest(props.request);
}
</script>
