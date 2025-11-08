<template>
  <ADrawer
    v-if="dialog"
    :open="dialog.visible"
    @close="dialog.resolve()"
    :footer="null"
    :width="finalWidth"
    :title="null"
    :closable="false"
    :mask-closable="!disableMaskClosable"
    :placement
  >
    <!-- v-loading="dialog.isLoading" -->
    <div class="bg-light-1 stretch flex h-full flex-col">
      <slot v-if="$slots.title" name="title"></slot>
      <div v-else-if="title" class="p-4 font-semibold">
        {{ title }}
      </div>
      <div v-if="!$slots.autoPadding" class="stretch">
        <slot></slot>
      </div>
      <div
        v-else
        :class="[
          'stretch flex flex-col gap-4 overflow-auto',
          `px-${drawerPaddingLevel}`,
          $slots.title || title ? '' : `pt-${drawerPaddingLevel}`,
          $slots.footer ? '' : `pb-${drawerPaddingLevel}`,
        ]"
      >
        <slot name="autoPadding"></slot>
      </div>
      <div v-if="$slots.footer" class="flex items-center justify-end gap-3 p-4">
        <slot name="footer"></slot>
      </div>
    </div>
  </ADrawer>
</template>
<script lang="ts" setup>
import { type placementType } from "ant-design-vue/es/drawer"
import { AnyDialogType } from "./dialog"
import { drawerPaddingLevel } from "@/const"

// export type Size = "small" | "medium" | "large"

const props = withDefaults(
  defineProps<{
    dialog: AnyDialogType
    title?: string | null
    // size?: Size
    width?: string
    disableMaskClosable?: boolean
    placement?: placementType
  }>(),
  {
    // size: "medium",
    title: null,
    width: undefined,
  },
)

const finalWidth = computed(() => {
  // if (props.width) {
  //   return props.width
  // } else if (props.size) {
  //   switch (props.size) {
  //     case "small":
  //       return "320px"
  //     case "medium":
  //       return "520px"
  //     case "large":
  //       return "640px"
  //   }
  // } else {
  //   return undefined
  // }
  return undefined
})
</script>

<style lang="scss">
.ant-drawer .ant-drawer-body {
  padding: 0;
  overflow: hidden;
}
</style>
