<template>
  <v-sheet color="surface-variant" class="json-code-view ma-1" elevation="1">
    <pre
      class="ma-0 pa-3"
      style="overflow: auto"
    ><code><span v-for="(token, i) in tokens" :key="`${token.type}-${i}`" :class="`token-${token.type}`">{{ token.text }}</span></code></pre>
  </v-sheet>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Token {
  type: 'key' | 'string' | 'number' | 'boolean' | 'null' | 'punctuation';
  text: string;
}

const props = defineProps<{ value?: unknown }>();

const tokens = computed<Token[]>(() => {
  const input =
    typeof props.value === 'string' ? props.value : JSON.stringify(props.value, null, 2);
  if (props.value === '' || props.value === undefined || props.value === null) return [];
  try {
    const obj = JSON.parse(input);
    return tokenize(JSON.stringify(obj, null, 2));
  } catch {
    return tokenize(input);
  }
});

function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  const n = src.length;
  const isWs = (c: string) => c === ' ' || c === '\t' || c === '\n' || c === '\r';
  while (i < n) {
    const c = src[i]!;
    if (isWs(c)) {
      let s = '';
      while (i < n && isWs(src[i]!)) {
        s += src[i]!;
        i++;
      }
      out.push({ type: 'punctuation', text: s });
      continue;
    }
    if ('{}[]:,'.includes(c)) {
      out.push({ type: 'punctuation', text: c });
      i++;
      continue;
    }
    if (c === '"' || c === "'") {
      const quote = c === '"' ? '"' : "'";
      let s = c;
      i++;
      while (i < n) {
        const ch = src[i]!;
        s += ch;
        if (ch === '\\' && i + 1 < n) {
          s += src[i + 1]!;
          i += 2;
          continue;
        }
        if (ch === quote) {
          i++;
          break;
        }
        i++;
      }
      const isKey = src[i] === ':';
      out.push({ type: isKey ? 'key' : 'string', text: s });
      continue;
    }
    let s = '';
    while (i < n && !isWs(src[i]!) && !'{}[]:,'.includes(src[i]!)) {
      s += src[i]!;
      i++;
    }
    if (s === 'true' || s === 'false') out.push({ type: 'boolean', text: s });
    else if (s === 'null') out.push({ type: 'null', text: s });
    else if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(s))
      out.push({ type: 'number', text: s });
    else out.push({ type: 'string', text: s });
  }
  return out;
}
</script>

<style scoped lang="scss">
.json-code-view {
  code {
    display: block;
    overflow-x: auto;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 0.85rem;
    line-height: 1.5;
    white-space: pre;
    word-break: keep-all;
  }
  .token-key {
    color: var(--v-theme-primary, #1867c0);
  }
  .token-string {
    color: #0a7;
  }
  .token-number {
    color: #f57c00;
  }
  .token-boolean,
  .token-null {
    color: #b00020;
  }
  .token-punctuation {
    color: #616161;
  }
}
</style>
