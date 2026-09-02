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
                  @update:model-value="onChange"
                />
              </v-col>
              <v-col>
                <v-text-field
                  v-model="localUrl"
                  placeholder="https://api.example.com/path"
                  prepend-inner-icon="mdi-link-variant"
                  density="compact"
                  hide-details
                  @update:model-value="onChange"
                />
              </v-col>
              <v-col cols="auto">
                <v-btn color="primary" prepend-icon="mdi-send" :loading="running" @click="run">Send</v-btn>
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
            <v-tab value="tests">Tests</v-tab>
            <v-tab value="extract">Extract</v-tab>
            <v-tab value="settings">Settings</v-tab>
          </v-tabs>
          <v-card-text>
            <v-tabs-window v-model="reqTab">
              <v-tabs-window-item value="params">
                <KeyValueEditor v-model="request.queryParams" />
              </v-tabs-window-item>
              <v-tabs-window-item value="headers">
                <KeyValueEditor v-model="request.headers" />
              </v-tabs-window-item>
              <v-tabs-window-item value="body">
                <v-select v-model="bodyType" :items="bodyTypes" label="Body type" density="compact" hide-details class="mb-3" />
                <v-textarea
                  v-if="['json','raw','text'].includes(bodyType)"
                  v-model="bodyContent"
                  :rows="8"
                  density="compact"
                  hide-details
                  @update:model-value="onBodyChange"
                />
                <KeyValueEditor v-if="bodyType === 'form'" :model-value="formFields" @update:model-value="onFormChange" />
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
                <v-text-field v-model.number="request.timeoutMs" type="number" label="Timeout (ms)" />
                <RetryPolicyEditor v-model="request.retry" />
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
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { RequestDefinition, KeyValue } from '@domain/request/RequestDefinition';
import { HTTP_METHODS } from '@domain/request/RequestDefinition';
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

watch(() => props.request, (r) => {
  localMethod.value = r.method;
  localUrl.value = r.url;
});

function onChange() {
  emit('update:request', { ...props.request, method: localMethod.value, url: localUrl.value });
}

const bodyType = ref<string>('json');
const bodyContent = ref<string>('');

watch(() => props.request.body, (b) => {
  if (b.type === 'json' || b.type === 'raw' || b.type === 'text') {
    bodyType.value = b.type;
    bodyContent.value = b.content;
  } else if (b.type === 'formUrlEncoded') {
    bodyType.value = 'form';
  } else {
    bodyType.value = 'none';
  }
}, { immediate: true });

const bodyTypes = ['none', 'json', 'raw', 'text', 'form', 'multipart', 'binary'];

function onBodyChange() {
  let body: RequestDefinition['body'];
  if (bodyType.value === 'json') body = { type: 'json', content: bodyContent.value };
  else if (bodyType.value === 'raw') body = { type: 'raw', contentType: 'text/plain', content: bodyContent.value };
  else if (bodyType.value === 'text') body = { type: 'text', content: bodyContent.value };
  else if (bodyType.value === 'form') body = { type: 'formUrlEncoded', fields: formFields.value };
  else if (bodyType.value === 'multipart') body = { type: 'multipart', fields: [] };
  else if (bodyType.value === 'binary') body = { type: 'binary', fileRef: { id: '0', name: '', size: 0, contentType: '', origin: { kind: 'browser', lastModified: 0 } } };
  else body = { type: 'none' };
  emit('update:request', { ...props.request, body });
}

const formFields = ref<KeyValue[]>([]);
watch(() => props.request.body, (b) => {
  if (b.type === 'formUrlEncoded') formFields.value = [...b.fields];
}, { immediate: true });

function onFormChange(v: KeyValue[]) {
  formFields.value = v;
  emit('update:request', { ...props.request, body: { type: 'formUrlEncoded', fields: v } });
}

function onTestsChange(t: RequestDefinition['postRequest']) {
  emit('update:request', { ...props.request, postRequest: t });
}

function onExtractionsChange(e: RequestDefinition['variableExtractions']) {
  emit('update:request', { ...props.request, variableExtractions: e });
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
  await store.updateRequest(props.request);
}
</script>