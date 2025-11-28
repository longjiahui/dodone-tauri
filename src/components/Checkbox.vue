<template>
  <div @click="modelValue = !modelValue" class="h items-center">
    <!-- acheckbox 的点击区域很怪。。 -->
    <ACheckbox class="pointer-events-none" :checked="modelValue"></ACheckbox>
  </div>
</template>
<script setup lang="ts">
const modelValue = defineModel<boolean>("modelValue");
</script>
