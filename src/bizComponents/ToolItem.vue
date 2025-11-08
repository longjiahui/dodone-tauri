<template>
  <Tooltip :content="tooltip ?? ''">
    <DefaultDropdownMenu :menus>
      <Button :danger type="text" @click="$emit('click', $event)">
        <component :is="icon"></component>
      </Button>
    </DefaultDropdownMenu>
  </Tooltip>
</template>
<script setup lang="ts">
import { Menu } from "@/components/dropdown/DefaultDropdownMenu.vue"
import type { Component } from "vue"

withDefaults(
  defineProps<{
    tooltip?: string
    icon: Component
    menus?: Menu[]
    danger?: boolean
  }>(),
  {
    menus: () => [],
  },
)

defineEmits<{
  (e: "click", event: MouseEvent): void
}>()
</script>
