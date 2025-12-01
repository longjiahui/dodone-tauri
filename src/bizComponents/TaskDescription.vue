<template>
  <MarkdownPreviewer
    :title="modelValue"
    :model-value="modelValue || ''"
    class="_task-description line-clamp-6 leading-multi pr-1 pb-1"
    :no-image
  >
  </MarkdownPreviewer>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string | undefined | null;
  noImage?: boolean;
}>();
</script>
