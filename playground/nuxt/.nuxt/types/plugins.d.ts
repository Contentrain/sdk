// Generated by Nuxt'
import type { Plugin } from '#app'

type Decorate<T extends Record<string, any>> = { [K in keyof T as K extends string ? `$${K}` : never]: T[K] }

type InjectionType<A extends Plugin> = A extends {default: Plugin<infer T>} ? Decorate<T> : unknown

type NuxtAppInjections = 
  InjectionType<typeof import("../../../../node_modules/.pnpm/nuxt@3.15.1_@types+node@22.10.5_eslint@9.17.0_rollup@3.29.5_typescript@5.6.3_vite@6.0.7_vue-tsc@2.2.0/node_modules/nuxt/dist/app/plugins/revive-payload.client.js")> &
  InjectionType<typeof import("../../../../node_modules/.pnpm/nuxt@3.15.1_@types+node@22.10.5_eslint@9.17.0_rollup@3.29.5_typescript@5.6.3_vite@6.0.7_vue-tsc@2.2.0/node_modules/nuxt/dist/head/runtime/plugins/unhead.js")> &
  InjectionType<typeof import("../../../../node_modules/.pnpm/nuxt@3.15.1_@types+node@22.10.5_eslint@9.17.0_rollup@3.29.5_typescript@5.6.3_vite@6.0.7_vue-tsc@2.2.0/node_modules/nuxt/dist/app/plugins/router.js")> &
  InjectionType<typeof import("../../../../node_modules/.pnpm/nuxt@3.15.1_@types+node@22.10.5_eslint@9.17.0_rollup@3.29.5_typescript@5.6.3_vite@6.0.7_vue-tsc@2.2.0/node_modules/nuxt/dist/app/plugins/payload.client.js")> &
  InjectionType<typeof import("../../../../node_modules/.pnpm/nuxt@3.15.1_@types+node@22.10.5_eslint@9.17.0_rollup@3.29.5_typescript@5.6.3_vite@6.0.7_vue-tsc@2.2.0/node_modules/nuxt/dist/app/plugins/navigation-repaint.client.js")> &
  InjectionType<typeof import("../../../../node_modules/.pnpm/nuxt@3.15.1_@types+node@22.10.5_eslint@9.17.0_rollup@3.29.5_typescript@5.6.3_vite@6.0.7_vue-tsc@2.2.0/node_modules/nuxt/dist/app/plugins/check-outdated-build.client.js")> &
  InjectionType<typeof import("../../../../node_modules/.pnpm/nuxt@3.15.1_@types+node@22.10.5_eslint@9.17.0_rollup@3.29.5_typescript@5.6.3_vite@6.0.7_vue-tsc@2.2.0/node_modules/nuxt/dist/app/plugins/revive-payload.server.js")> &
  InjectionType<typeof import("../../../../node_modules/.pnpm/nuxt@3.15.1_@types+node@22.10.5_eslint@9.17.0_rollup@3.29.5_typescript@5.6.3_vite@6.0.7_vue-tsc@2.2.0/node_modules/nuxt/dist/app/plugins/chunk-reload.client.js")>

declare module '#app' {
  interface NuxtApp extends NuxtAppInjections { }

  interface NuxtAppLiterals {
    pluginName: 'nuxt:revive-payload:client' | 'nuxt:head' | 'nuxt:router' | 'nuxt:payload' | 'nuxt:revive-payload:server' | 'nuxt:chunk-reload' | 'nuxt:global-components'
  }
}

declare module 'vue' {
  interface ComponentCustomProperties extends NuxtAppInjections { }
}

export { }
