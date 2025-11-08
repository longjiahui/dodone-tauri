<template>
  <Pagination
    :current="modelValue"
    @update:current="$emit('update:model-value', $event)"
    :total
    v-model:page-size="pageSize"
    show-less-items
    :show-size-changer="false"
  ></Pagination>
</template>

<script setup lang="ts">
import { Pagination } from "ant-design-vue"

defineProps<{
  modelValue: number
  total: number
}>()

defineEmits<{
  (e: "update:model-value", value: number): void
}>()
const pageSize = defineModel<number>("page-size", { default: 10 })
</script>
