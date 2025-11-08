<template>
  <Tooltip
    :content="
      (selectedTooltip ? (selected ? selectedTooltip : tooltip) : tooltip) || ''
    "
    :placement
  >
    <DefaultDropdownMenu :menus="menus || []">
      <div
        :class="[
          'h-[24px] cursor-pointer items-center justify-center gap-1 rounded shadow duration-300',
          labelPosition === 'right' ? 'h' : 'v',
          bgLight1,
          selected ? 'bg-primary text-white shadow-none' : `hover:${bgLight2}`,
          label ? 'px-1' : 'size-[24px] p-0',
        ]"
      >
        <component
          :is="selectedIcon ? (selected ? selectedIcon : icon) : icon"
        ></component>
        <div v-if="label" class="text-xs">{{ label }}</div>
      </div>
    </DefaultDropdownMenu>
  </Tooltip>
</template>
<script setup lang="ts">
import { Menu } from "@/components/dropdown/DefaultDropdownMenu.vue"
import { TooltipPlacement } from "@/types"
import type { Component } from "vue"

const bg = 1
const bgLight1 = `bg-light-${bg}`
const bgLight2 = `bg-light-${bg + 1}`

withDefaults(
  defineProps<{
    selectedIcon?: Component
    icon: Component
    tooltip?: string
    selectedTooltip?: string
    selected?: boolean
    placement?: TooltipPlacement
    menus?: Menu[]
    label?: string | number
    labelPosition?: "right" | "bottom"
  }>(),
  {
    labelPosition: "right",
  },
)
</script>
