<template>
  <DefaultDropdown :placement trigger="click" class="!min-w-0">
    <template #body>
      <TaskTools v-if="task" :task :hide-delete>
        <template v-if="$slots.start" #start>
          <slot name="start"></slot>
        </template>
        <template #before-delete="d">
          <slot name="before-delete" v-bind="d"></slot>
        </template>
      </TaskTools>
    </template>
    <slot></slot>
  </DefaultDropdown>
</template>
<script setup lang="ts">
import { DropdownPlacement, ReadOnlyTaskWithChildren } from "@/types"

defineProps<{
  task: ReadOnlyTaskWithChildren | undefined
  placement?: DropdownPlacement
  hideDelete?: boolean
}>()
</script>
