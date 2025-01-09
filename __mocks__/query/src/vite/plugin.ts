import type { Plugin } from 'vite';
import type { ContentrainPluginOptions } from '../types/plugin';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { MemoryCache } from '../cache/strategies';

export function contentrainQuery(options: ContentrainPluginOptions = {}): Plugin {
  const cache = MemoryCache.getInstance();
  const {
    contentDir = 'contentrain',
    include = ['**/*.json'],
    exclude = ['node_modules/**'],
    hot = true,
    cacheTime = 5 * 60 * 1000, // 5 dakika
  } = options;

  return {
    name: 'vite-plugin-contentrain-query',
    enforce: 'pre',
    apply: 'serve',

    configureServer(server) {
      if (hot) {
        const contentPath = resolve(process.cwd(), contentDir);
        server.watcher.add(contentPath);

        server.watcher.on('change', (path) => {
          if (path.includes(contentDir)) {
            const cacheKey = `content:${path}`;
            cache.delete(cacheKey);

            server.ws.send({
              type: 'custom',
              event: 'contentrain:update',
              data: { path },
            });

            const mod = server.moduleGraph.getModuleById(path);
            if (mod) {
              server.moduleGraph.invalidateModule(mod);
            }
          }
        });
      }
    },

    resolveId(id) {
      if (id.includes(contentDir) && id.endsWith('.json')) {
        return resolve(process.cwd(), id);
      }
      return null;
    },

    async load(id) {
      if (!id.includes(contentDir) || !id.endsWith('.json')) {
        return null;
      }

      const cacheKey = `content:${id}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        return {
          code: cached,
          map: { mappings: '' },
        };
      }

      try {
        const content = readFileSync(id, 'utf-8');
        const code = `export default ${content}`;

        cache.set(cacheKey, code, cacheTime);

        return {
          code,
          map: { mappings: '' },
        };
      }
      catch (err) {
        this.error(`Failed to load JSON file: ${id}`);
        return null;
      }
    },
  };
}
