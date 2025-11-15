<template>
  <DefaultDropdown
    v-model:visible="visible"
    :placement
    trigger="click"
    class="!min-w-0"
  >
    <template #body>
      <!-- 这里的click是点击工具栏可以触发自己隐藏dropdown -->
      <!-- tooltip-visible-disabled-controller 是为了可以让dropdown隐藏的时候-->
      <!-- tooltip能隐藏，否则dropdown隐藏的时候鼠标不动，就无法触发tooltip包裹元素的 mouseleave之类的事件 -->
      <!-- 然后可能就会tooltip一直显示在屏幕上 -->
      <TaskTools
        v-if="task"
        :task
        :hide-delete
        :tooltip-visible-disabled-controller="!visible"
        @click="() => (visible = false)"
      >
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
import { DropdownPlacement, ReadOnlyTaskWithChildren } from "@/types";

defineProps<{
  task: ReadOnlyTaskWithChildren | undefined;
  placement?: DropdownPlacement;
  hideDelete?: boolean;
}>();

const visible = ref(false);
</script>
