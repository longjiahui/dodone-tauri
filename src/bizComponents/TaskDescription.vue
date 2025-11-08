<template>
  <MarkdownPreviewer
    :title="modelValue"
    :model-value="modelValue || ''"
    class="_task-description line-clamp-6 pr-1 pb-1"
    :no-image
  >
  </MarkdownPreviewer>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string | undefined | null
  noImage?: boolean
}>()
</script>
