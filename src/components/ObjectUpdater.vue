<template>
  <slot :update></slot>
</template>
<script setup lang="ts" generic="T extends object | undefined">
const props = defineProps<{
  modelValue?: T
}>()
const emit = defineEmits<{
  (e: "update:model-value", value: T): void
}>()

function update<D extends T | T[keyof T]>(val: D, key?: keyof T) {
  if (key) {
    emit("update:model-value", { ...(props.modelValue || {}), [key]: val } as T)
  } else {
    emit("update:model-value", val as T)
  }
}
</script>
