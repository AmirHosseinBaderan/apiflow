import { reactive } from 'vue';

export interface NotificationMessage {
  readonly id: number;
  readonly text: string;
  readonly kind: 'info' | 'success' | 'error' | 'warning';
}

interface NotifierState {
  items: NotificationMessage[];
}

const state = reactive<NotifierState>({ items: [] });
let seq = 1;

export function useNotifier() {
  function notify(text: string, kind: NotificationMessage['kind'] = 'info', timeoutMs = 4000) {
    const id = seq++;
    state.items.push({ id, text, kind });
    if (timeoutMs > 0) {
      setTimeout(() => {
        state.items = state.items.filter((i) => i.id !== id);
      }, timeoutMs);
    }
  }
  function dismiss(id: number) {
    state.items = state.items.filter((i) => i.id !== id);
  }
  return { state, notify, dismiss };
}