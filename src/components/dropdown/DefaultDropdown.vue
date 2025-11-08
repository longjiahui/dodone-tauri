<template>
  <Dropdown :trigger :placement>
    <slot></slot>
    <template #body="d">
      <div
        class="border-light-3 bg-bg flex flex-col overflow-hidden rounded border shadow-2xl"
      >
        <slot name="body" v-bind="d"></slot>
      </div>
    </template>
  </Dropdown>
</template>
<script setup lang="ts">
import { DropdownPlacement, Trigger } from "@/types"

defineProps<{
  placement?: DropdownPlacement
  trigger?: Trigger
}>()
</script>
