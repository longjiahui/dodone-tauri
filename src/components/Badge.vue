<template>
  <div
    :class="[
      'h h-[14px] items-center rounded-md border border-[var(--theme-text-color)] px-1 text-center text-xs',
      invert
        ? `bg-[var(--theme-text-background)] !text-[var(--theme-text-color)]`
        : 'bg-[var(--theme-text-background)] text-[var(--theme-text-color)]',
    ]"
    :style="theme.cssVariables"
  >
    {{ value }}
  </div>
</template>
<script setup lang="ts">
import { defaultPrimaryHue, themeHSColorL, themeHSColorS } from "@/const"
import { useTheme } from "@/utils/color"

const props = withDefaults(
  defineProps<{
    value: string | number
    invert?: boolean
    hue?: string
  }>(),
  { hue: defaultPrimaryHue },
)

const theme = useTheme(
  computed(() => props.hue),
  computed(() => ({
    a: 1,
    l: themeHSColorL,
    s: themeHSColorS,
  })),
)
</script>
