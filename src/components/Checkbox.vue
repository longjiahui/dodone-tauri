<template>
  <div @click="modelValue = !modelValue">
    <ACheckbox :checked="modelValue"></ACheckbox>
  </div>
</template>
<script setup lang="ts">
const modelValue = defineModel<boolean>("modelValue")
</script>
