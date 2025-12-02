<template>
  <MarkdownPreviewer
    :title="modelValue"
    :model-value="modelValue || ''"
    class="line-clamp-6 leading-multi"
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
