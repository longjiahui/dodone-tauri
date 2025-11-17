import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import AutoImport from "unplugin-auto-import/vite";
import AutoImportComponents from "unplugin-vue-components/vite";
import { AntDesignVueResolver } from "unplugin-vue-components/resolvers";
import { resolve } from "node:path";

////@ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  optimizeDeps: {
    include: [
      "@vueuse/components",

      "echarts/charts",
      "echarts/components",
      "echarts/renderers",
      "echarts",
      "vue-echarts",
    ],
  },
  plugins: [
    vue(),
    tailwindcss(),
    AutoImport({
      imports: [
        "vue",
        "@vueuse/core",
        {
          echarts: ["graphic"],
          "echarts/renderers": ["CanvasRenderer"],
          "echarts/components": [
            "LegendComponent",
            "TitleComponent",
            "TooltipComponent",
            "GridComponent",
            "DatasetComponent",
            "TransformComponent",
            "TitleComponentOption",
            "TooltipComponentOption",
            "GridComponentOption",
            "DatasetComponentOption",
            "TransformComponentOption",
            "LegendComponentOption",
            "MarkLineComponent",
          ],
          "echarts/charts": [
            "LineChart",
            // "GraphChart",
            // "BarChart",
            // "PieChart",
            // "SankeyChart",
          ],
          "echarts/core": ["use"],
        },
        {
          from: "echarts/core",
          type: true,
          imports: ["ComposeOption"],
        },
        {
          from: "echarts",
          type: true,
          imports: [
            "EChartsOption",
            // 'PieSeriesOption',
            // 'BarSeriesOption',
            // 'LineSeriesOption',
            // 'PieChartSeriesOption',
            // 'XAxisOption',
            // 'YAxisOption',
            // 'TitleComponentOption',
            // 'LegendComponentOption',
            // 'GridComponentOption',
            // 'TransformComponentOption',
            // 'TooltipComponentOption',
          ],
        },
      ],
      dts: "src/auto-imports.d.ts",
      resolvers: [AntDesignVueResolver()],
    }),
    AutoImportComponents({
      // default: src.components
      dirs: ["src/components", "src/bizComponents", "src/viewComponents"],
      extensions: ["vue"],
      deep: true,
      dts: "src/components.d.ts",
      resolvers: [
        AntDesignVueResolver({
          resolveIcons: true,
          importStyle: false,
        }),
      ],
    }),
  ],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        doing: resolve(__dirname, "src/src-doing/index.html"),
      },
    },
  },
}));
