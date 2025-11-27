<template>
  <CaretRightOutlined
    :class="['transition-transform duration-300', isExpand ? 'rotate-90' : '']"
  ></CaretRightOutlined>
</template>
<script setup lang="ts">
defineProps<{
  isExpand: boolean;
}>();
</script>
