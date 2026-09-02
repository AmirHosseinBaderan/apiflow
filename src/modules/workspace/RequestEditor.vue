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
                <v-textarea
                  v-if="['json','raw','text'].includes(bodyType)"
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
import KeyValueEditor from '@components/KeyValueEditor.vue';
import ResponsePanel from '@components/ResponsePanel.vue';
import RetryPolicyEditor from '@components/RetryPolicyEditor.vue';
import TestEditor from '@components/TestEditor.vue';
import VariableExtractorEditor from '@components/VariableExtractorEditor.vue';
import { useCollectionStore } from '@stores/useCollectionStore';
import { useExecutionStore } from '@stores/useExecutionStore';

const props = defineProps<{ request: RequestDefinition }>();
const emit = defineEmits<{ (e: 'update:request', v: RequestDefinition): void }>();

const store = useCollectionStore();
const execution = useExecutionStore();

const reqTab = ref('params');
const methods = HTTP_METHODS;

const localMethod = ref(props.request.method);
const localUrl = ref(props.request.url);
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
  if (t === 'json') emitUpdate({ body: { type: 'json', content: bodyContent.value } });
  else if (t === 'raw') emitUpdate({ body: { type: 'raw', contentType: 'text/plain', content: bodyContent.value } });
  else if (t === 'text') emitUpdate({ body: { type: 'text', content: bodyContent.value } });
  else if (t === 'form') emitUpdate({ body: { type: 'formUrlEncoded', fields: formFields.value } });
  else if (t === 'multipart') emitUpdate({ body: { type: 'multipart', fields: multipartFields.value } });
  else if (t === 'binary') emitUpdate({ body: { type: 'binary', fileRef: { id: '0', name: '', size: 0, contentType: '', origin: { kind: 'browser', lastModified: 0 } } } });
  else emitUpdate({ body: { type: 'none' } });
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
  await execution.run(props.request, collection?.variables ?? []);
}

async function save() {
  await store.updateRequest(props.request);
}
</script>
