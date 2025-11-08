<template>
  <div
    :class="[
      `px-${sidebarPaddingXLevel} py-2`,
      'h items-center justify-end gap-2',
    ]"
  >
    <slot></slot>
  </div>
</template>
<script setup lang="ts">
import { sidebarPaddingXLevel } from "@/const"
</script>
