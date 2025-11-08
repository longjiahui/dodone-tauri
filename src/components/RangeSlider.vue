<template>
  <ASlider
    class="min-w-[32px]"
    :tip-formatter
    :marks
    range
    v-model:value="modelValue"
    :max="range[1]"
    :min="range[0]"
    :vertical
  ></ASlider>
</template>

<script setup lang="ts">
defineProps<{
  range: [number, number]
  marks?: Partial<Record<number, string>>
  tipFormatter?: (val: number | undefined) => string
  vertical?: boolean
}>()
const modelValue = defineModel<[number, number]>("modelValue")
</script>
