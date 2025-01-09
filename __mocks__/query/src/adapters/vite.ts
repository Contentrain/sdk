import type { QueryBuilder } from '../core/QueryBuilder';
import type { ContentrainUpdateEvent } from '../types/plugin';

interface ViteHotContext {
  on: (event: string, cb: (data: any) => void) => void
  send: (event: string, data: any) => void
}

declare global {
  interface ImportMeta {
    hot?: ViteHotContext
  }
}

export function setupHMR(queryBuilder?: QueryBuilder<any>) {
  if (import.meta.hot) {
    import.meta.hot.on('contentrain:update', (_data: ContentrainUpdateEvent['data']) => {
      void (async () => {
        if (queryBuilder) {
          // Cache'i temizle ve yeniden yükle
          await queryBuilder.reload();
        }
        else {
          // Cache'i temizleyemiyorsak sayfayı yenile
          window.location.reload();
        }
      })();
    });
  }
}

export function useContentrainHMR(queryBuilder?: QueryBuilder<any>) {
  if (typeof window !== 'undefined') {
    setupHMR(queryBuilder);
  }
}

// Vue için composable
export function useContentrainVueHMR(queryBuilder?: QueryBuilder<any>) {
  if (typeof window !== 'undefined') {
    // Vue onMounted hook'unda çağrılmalı
    setupHMR(queryBuilder);
  }
}

// React için hook
export function useContentrainReactHMR(queryBuilder?: QueryBuilder<any>) {
  if (typeof window !== 'undefined') {
    // React useEffect hook'unda çağrılmalı
    setupHMR(queryBuilder);
  }
}
