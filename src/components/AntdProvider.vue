<template>
  <ConfigProvider
    :locale
    :theme="{
      algorithm: systemStore.isDarkMode
        ? theme.darkAlgorithm
        : theme.defaultAlgorithm,
      token: {
        colorPrimary: '#3875F6',
        colorSuccess: '#56C41A',
        colorError: '#EC5B56',
        wireframe: false,
        borderRadius: 4,
        fontFamily,
      },
    }"
    ><slot></slot
  ></ConfigProvider>
</template>

<script setup lang="ts">
import { useSystemStore } from "@/store/system";
import { ConfigProvider, theme } from "ant-design-vue";
import { Locale } from "ant-design-vue/es/locale";

defineProps<{
  locale?: Locale;
}>();

// const fontFamily =
//   '"LXGW WenKai", -apple-system, "Microsoft YaHei", BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important'
// const fontFamily =
//   '-apple-system, "Micro?soft YaHei", BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important'
// apple web font
const fontFamily =
  '"SF Pro SC","SF Pro Text","SF Pro Icons","PingFang SC","Helvetica Neue","Helvetica","Arial",sans-serif !important';

const systemStore = useSystemStore();
</script>
