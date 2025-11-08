<template>
  <ATooltip
    :placement
    overlay-class-name="pointer-events-none"
    :title="content ?? ''"
  >
    <!-- :visible="!!content && visibleController"
    @update:visible="(val) => (visibleController = val)" -->
    <slot></slot>
    <template #title>
      <slot name="content"></slot>
    </template>
  </ATooltip>
</template>
<script setup lang="ts">
import { TooltipPlacement } from "@/types"

defineProps<{
  content?: string
  placement?: TooltipPlacement
}>()

// const visibleController = ref(false)
</script>
