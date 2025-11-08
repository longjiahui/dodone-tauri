<template>
  <ASlider
    class="min-w-[32px]"
    :tip-formatter
    :marks
    v-model:value="modelValue"
    :max="range[1]"
    :min="range[0]"
    :vertical
    :step="noStep ? (null as any) : step"
  ></ASlider>
</template>

<script setup lang="ts">
defineProps<{
  range: [number, number]
  marks?: Partial<Record<number, string>>
  tipFormatter?: (val: number | undefined) => string
  vertical?: boolean
  step?: number
  noStep?: boolean
}>()
const modelValue = defineModel<number>("modelValue")
</script>
