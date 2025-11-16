<template>
  <div
    class="size-full stretch flex flex-col gap-xs justify-center items-center max-h-[320px]"
  >
    <AEmpty
      class="text-lightest"
      :image="Empty.PRESENTED_IMAGE_SIMPLE"
      :description="description || $t('noData')"
    ></AEmpty>
    <slot></slot>
  </div>
</template>
<script setup lang="ts">
import { Empty } from "ant-design-vue";

defineProps<{ description?: string }>();
</script>
