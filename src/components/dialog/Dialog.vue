<template>
  <AModal
    v-if="dialog"
    :open="dialog.visible"
    @cancel="dialog.resolve()"
    :footer="null"
    :width="finalWidth"
    :title="null"
    :closable="false"
    :keyboard="!disableEscapeKey"
    :mask-closable="!disableMaskClosable"
  >
    <!-- v-loading="dialog.isLoading" -->
    <div :class="['bg-light-1 flex max-h-[70vh] flex-col']">
      <slot v-if="$slots.title" name="title"></slot>
      <div v-else-if="title" class="p-4 font-semibold">
        {{ title }}
      </div>
      <div v-if="!$slots.autoPadding" class="stretch v">
        <slot></slot>
      </div>
      <div
        v-else
        :class="[
          'stretch flex flex-col gap-4 overflow-auto px-4',
          $slots.title || title ? '' : 'pt-4',
          $slots.footer ? '' : 'pb-4',
        ]"
      >
        <slot name="autoPadding"></slot>
      </div>
      <div v-if="$slots.footer" class="flex items-center justify-end gap-3 p-4">
        <slot name="footer"></slot>
      </div>
    </div>
  </AModal>
</template>
<script lang="ts" setup>
import { AnyDialogType } from "./dialog";

export type Size = "small" | "medium" | "large";

const props = withDefaults(
  defineProps<{
    dialog: AnyDialogType;
    title?: string | null;
    size?: Size;
    width?: string;
    disableEscapeKey?: boolean;
    disableMaskClosable?: boolean;
  }>(),
  {
    size: "medium",
    title: null,
    width: undefined,
  }
);

const finalWidth = computed(() => {
  if (props.width) {
    return props.width;
  } else if (props.size) {
    switch (props.size) {
      case "small":
        return "320px";
      case "medium":
        return "520px";
      case "large":
        return "1024px";
    }
  } else {
    return undefined;
  }
});
</script>

<style lang="scss">
.ant-modal .ant-modal-content {
  padding: 0;
  overflow: hidden;
}
</style>
