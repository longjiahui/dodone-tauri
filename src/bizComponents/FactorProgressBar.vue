<template>
  <div class="h items-center gap-1" :style="theme.cssVariables">
    <div
      :class="[
        'bg-[var(--theme-light-3)]',
        'stretch relative h-1 shrink-0 overflow-auto rounded',
      ]"
    >
      <!-- <span class="text-primary rounded bg-white px-1">
        {{ Math.ceil((finish! / total!) * 100) }} %
      </span> -->
      <div
        :style="{
          width: finalProgress + '%',
        }"
        :class="[
          // contrast ? 'bg-[var(--theme-dark)]' : 'bg-[var(--theme)]',
          'bg-[var(--theme-dark)]',
          'absolute top-0 left-0 h-full w-full transition-[width] duration-300',
        ]"
      ></div>
    </div>
    <div
      v-if="showFinishTotal"
      class="text-light relative z-10 w-[80px] px-2 text-xs"
    >
      <!-- {{ finalProgress.toFixed(1) }} % -->
      <!-- <span v-if="showFinishTotal" class="pl-2"> -->
      {{ finish }}
      /
      {{ total }}
      <!-- </span> -->
    </div>
  </div>
</template>
<script setup lang="ts">
import { defaultPrimaryHue, themeHSColorL, themeHSColorS } from "@/const"
import { useTheme } from "@/utils/color"

const props = withDefaults(
  defineProps<{
    finish?: number
    total?: number
    progress?: number
    hideFinishTotal?: boolean

    hue?: string
    s?: number
    l?: number
  }>(),
  {
    hue: defaultPrimaryHue,
    s: themeHSColorS,
    l: themeHSColorL,
  },
)
const showFinishTotal = computed(
  () => !props.hideFinishTotal && props.finish != null && props.total != null,
)
const finalProgress = computed(() => {
  if (props.total && props.finish) {
    return Math.max(0, Math.min(100, (props.finish! / props.total!) * 100))
  } else {
    return Math.min(Math.max(0, +(props.progress ?? 0)), 100)
  }
})
const theme = useTheme(
  computed(() => props.hue),
  computed(() => ({
    a: 1,
    s: props.s,
    l: props.l,
  })),
)
</script>
