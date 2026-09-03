import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTabStore } from '@stores/useTabStore';

export function useKeyboard() {
  const router = useRouter();
  const tabs = useTabStore();

  function isMod(e: KeyboardEvent): boolean {
    return e.ctrlKey || e.metaKey;
  }

  function onKeyDown(e: KeyboardEvent) {
    if (isMod(e)) {
      if (e.key === 't' && e.shiftKey) {
        e.preventDefault();
        tabs.prev();
        const t = tabs.activeTab;
        if (t?.route) router.push(t.route as Parameters<typeof router.push>[0]);
        return;
      }
      if (e.key === 't') {
        e.preventDefault();
        tabs.next();
        const t = tabs.activeTab;
        if (t?.route) router.push(t.route as Parameters<typeof router.push>[0]);
        return;
      }
      if (e.key === 'w') {
        e.preventDefault();
        const active = tabs.activeTab;
        if (active) {
          tabs.remove(active.id);
          const next = tabs.activeTab;
          if (next?.route) router.push(next.route as Parameters<typeof router.push>[0]);
        }
        return;
      }
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        tabs.openRoute('home', {}, 'Home');
        router.push({ name: 'home' });
        return;
      }
      if (e.key === 's') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('app:save'));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('app:send'));
        return;
      }
      if (e.key.toLowerCase() === 'l') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('app:focus-url'));
        return;
      }
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeyDown, true));
  onUnmounted(() => window.removeEventListener('keydown', onKeyDown, true));
}
