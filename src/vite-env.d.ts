/// <reference types="vite/client" />

import { type default as tauriAPI } from "@/api";

declare global {
  interface Window {
    backend: typeof tauriAPI;
  }
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
