<template>
  <ADropdown :trigger :placement :min-overlay-width-match-trigger="false">
    <slot></slot>
    <template v-if="$slots.body" #overlay>
      <slot name="body"></slot>
    </template>
  </ADropdown>
</template>
<script setup lang="ts">
import { DropdownPlacement } from "@/types"
import { Trigger } from "ant-design-vue/es/dropdown/props"

defineProps<{
  placement?: DropdownPlacement
  trigger?: Trigger
}>()
</script>
