import { NuxtModule, RuntimeConfig } from '@nuxt/schema'
declare module '@nuxt/schema' {
  interface NuxtOptions {
    /**
     * Configuration for `/Users/ahmetbayramoglu/Desktop/Projects/contentrain-sdk/packages/nuxt/src/module`
     */
    ["contentrain"]: typeof import("/Users/ahmetbayramoglu/Desktop/Projects/contentrain-sdk/packages/nuxt/src/module").default extends NuxtModule<infer O> ? O : Record<string, any>
    /**
     * Configuration for `@nuxt/devtools`
     */
    ["devtools"]: typeof import("@nuxt/devtools").default extends NuxtModule<infer O> ? O : Record<string, any>
    /**
     * Configuration for `@nuxt/telemetry`
     */
    ["telemetry"]: typeof import("@nuxt/telemetry").default extends NuxtModule<infer O> ? O : Record<string, any>
  }
  interface NuxtConfig {
    /**
     * Configuration for `/Users/ahmetbayramoglu/Desktop/Projects/contentrain-sdk/packages/nuxt/src/module`
     */
    ["contentrain"]?: typeof import("/Users/ahmetbayramoglu/Desktop/Projects/contentrain-sdk/packages/nuxt/src/module").default extends NuxtModule<infer O> ? Partial<O> : Record<string, any>
    /**
     * Configuration for `@nuxt/devtools`
     */
    ["devtools"]?: typeof import("@nuxt/devtools").default extends NuxtModule<infer O> ? Partial<O> : Record<string, any>
    /**
     * Configuration for `@nuxt/telemetry`
     */
    ["telemetry"]?: typeof import("@nuxt/telemetry").default extends NuxtModule<infer O> ? Partial<O> : Record<string, any>
    modules?: (undefined | null | false | NuxtModule<any> | string | [NuxtModule | string, Record<string, any>] | ["/Users/ahmetbayramoglu/Desktop/Projects/contentrain-sdk/packages/nuxt/src/module", Exclude<NuxtConfig["contentrain"], boolean>] | ["@nuxt/devtools", Exclude<NuxtConfig["devtools"], boolean>] | ["@nuxt/telemetry", Exclude<NuxtConfig["telemetry"], boolean>])[],
  }
}
declare module 'nuxt/schema' {
  interface NuxtOptions {
    /**
     * Configuration for `/Users/ahmetbayramoglu/Desktop/Projects/contentrain-sdk/packages/nuxt/src/module`
     * @see https://www.npmjs.com/package//Users/ahmetbayramoglu/Desktop/Projects/contentrain-sdk/packages/nuxt/src/module
     */
    ["contentrain"]: typeof import("/Users/ahmetbayramoglu/Desktop/Projects/contentrain-sdk/packages/nuxt/src/module").default extends NuxtModule<infer O> ? O : Record<string, any>
    /**
     * Configuration for `@nuxt/devtools`
     * @see https://www.npmjs.com/package/@nuxt/devtools
     */
    ["devtools"]: typeof import("@nuxt/devtools").default extends NuxtModule<infer O> ? O : Record<string, any>
    /**
     * Configuration for `@nuxt/telemetry`
     * @see https://www.npmjs.com/package/@nuxt/telemetry
     */
    ["telemetry"]: typeof import("@nuxt/telemetry").default extends NuxtModule<infer O> ? O : Record<string, any>
  }
  interface NuxtConfig {
    /**
     * Configuration for `/Users/ahmetbayramoglu/Desktop/Projects/contentrain-sdk/packages/nuxt/src/module`
     * @see https://www.npmjs.com/package//Users/ahmetbayramoglu/Desktop/Projects/contentrain-sdk/packages/nuxt/src/module
     */
    ["contentrain"]?: typeof import("/Users/ahmetbayramoglu/Desktop/Projects/contentrain-sdk/packages/nuxt/src/module").default extends NuxtModule<infer O> ? Partial<O> : Record<string, any>
    /**
     * Configuration for `@nuxt/devtools`
     * @see https://www.npmjs.com/package/@nuxt/devtools
     */
    ["devtools"]?: typeof import("@nuxt/devtools").default extends NuxtModule<infer O> ? Partial<O> : Record<string, any>
    /**
     * Configuration for `@nuxt/telemetry`
     * @see https://www.npmjs.com/package/@nuxt/telemetry
     */
    ["telemetry"]?: typeof import("@nuxt/telemetry").default extends NuxtModule<infer O> ? Partial<O> : Record<string, any>
    modules?: (undefined | null | false | NuxtModule<any> | string | [NuxtModule | string, Record<string, any>] | ["/Users/ahmetbayramoglu/Desktop/Projects/contentrain-sdk/packages/nuxt/src/module", Exclude<NuxtConfig["contentrain"], boolean>] | ["@nuxt/devtools", Exclude<NuxtConfig["devtools"], boolean>] | ["@nuxt/telemetry", Exclude<NuxtConfig["telemetry"], boolean>])[],
  }
  interface RuntimeConfig {
   app: {
      buildId: string,

      baseURL: string,

      buildAssetsDir: string,

      cdnURL: string,
   },

   nitro: {
      envPrefix: string,
   },

   contentrain: {
      contentDir: string,

      defaultLocale: string,

      cache: boolean,

      ttl: number,

      maxCacheSize: number,

      modelTTL: any,
   },
  }
  interface PublicRuntimeConfig {
   contentrain: {
      defaultLocale: string,
   },
  }
}
declare module 'vue' {
        interface ComponentCustomProperties {
          $config: RuntimeConfig
        }
      }