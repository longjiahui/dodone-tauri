<template>
  <div
    v-if="imageProtocolName"
    class="markdown-body !bg-transparent"
    v-html="markdownContent"
    @click.capture="handleClickCapture"
  ></div>
</template>
<script setup lang="ts">
import Markdown from "markdown-it";
import { backend } from "@/utils/backend";
import {
  imageProtocolName,
  useDefaultModifiedMarkdownContent,
  useSystemStore,
} from "@/store/system";
import { getImageFileNameFromURL } from "@/utils/platform";

const props = defineProps<{
  noImage?: boolean;
}>();

const md = Markdown();
const modelValue = defineModel<string>("modelValue", {
  default: "",
});

const systemStore = useSystemStore();
const finalModelValue = useDefaultModifiedMarkdownContent(modelValue);
const markdownContent = computed(() => {
  let content = finalModelValue.value || "";
  if (props.noImage) {
    content = content.replace(/!\[.*?\]\(.*?\)/g, "");
  }
  return md.render(content);
});

async function handleClickCapture(event: MouseEvent) {
  const target = event.target;
  if (target instanceof HTMLImageElement) {
    // 图片事件捕获、打开图片本身
    event.preventDefault();
    event.stopPropagation();
    backend.openImage({ url: await getImageFileNameFromURL(target.src) });
  }
}

watch(
  () => systemStore.isDarkMode,
  (isDark) => {
    const id = "markdown-theme-link";
    const linkElement =
      (document.querySelector(id) as HTMLLinkElement) ??
      document.createElement("link");
    linkElement.id = id;
    linkElement.href = isDark
      ? "/github-markdown-dark.css"
      : "/github-markdown-light.css";
  },
  { immediate: true }
);
</script>

<style lang="css">
@reference "../styles/index.css";

.markdown-body {
  font-size: inherit !important;
  font-family: inherit !important;
  img {
    @apply border-dark-3 inline size-[var(--markdown-image-size,80px)] cursor-pointer rounded-lg border shadow duration-300 hover:opacity-85 mb-3;
  }
  ul,
  ol,
  menu {
    list-style: inside;
  }
}
</style>
