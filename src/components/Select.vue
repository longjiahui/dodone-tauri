<template>
  <ASelect v-model:value="modelValue!" class="stretch w-full">
    <ASelectOption v-for="o in options" :key="o.id || ''" :value="o.id">{{
      o.name
    }}</ASelectOption>
  </ASelect>
</template>

<script lang="ts">
export type Option<ID = string> = {
  id: ID
  name?: string
}
</script>

<script setup lang="ts" generic="ID extends string | number | undefined | null">
defineProps<{
  options: Option<ID>[]
}>()
const modelValue = defineModel<ID>("modelValue")
</script>
