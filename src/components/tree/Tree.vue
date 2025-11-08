<template>
  <Loop
    ref="loopRef"
    :children-key="childrenKey"
    :model-value="loopDatas"
    :data-key="dataKey as keyof T"
    :do-not-expand-first
    :default-expand-all
  >
    <template
      #default="{ item, toggle, isExpand, layer, hasChildren, index, datas }"
    >
      <div :class="['flex items-center gap-1 rounded']">
        <div
          v-if="layer > 0"
          :style="{
            width: Math.min(width - 104, +layer * 40) + 'px',
          }"
        ></div>
        <!-- v-if="hasChildren" -->
        <CaretRightOutlined
          v-if="!customExpandElement"
          @click.stop="toggle()"
          :class="[
            'transition-transform duration-300',
            isExpand ? 'rotate-90' : '',
            hasChildren ? 'opacity-100' : 'opacity-0',
          ]"
        ></CaretRightOutlined>
        <div class="stretch self-stretch">
          <slot
            v-bind="{ item, toggle, hasChildren, isExpand, index, datas }"
          ></slot>
        </div>
      </div>
    </template>
  </Loop>
</template>
<script
  setup
  lang="ts"
  generic="T extends Partial<Record<string | number, any>>"
>
import { useElementSize } from "@vueuse/core"
import Loop from "../Loop.vue"
import type { ComponentExposed } from "vue-component-type-helpers"
import { CaretRightOutlined } from "@ant-design/icons-vue"

withDefaults(
  defineProps<{
    loopDatas?: T[]
    childrenKey?: string
    dataKey?: keyof T
    modelValue?: string | number
    doNotExpandFirst?: boolean
    defaultExpandAll?: boolean
    customExpandElement?: boolean
  }>(),
  {
    loopDatas: () => [],
    childrenKey: undefined,
    dataKey: "id",
    modelValue: undefined,
    doNotExpandFirst: undefined,
    defaultExpandAll: undefined,
    customExpandElement: undefined,
  },
)
const loopRef = ref<ComponentExposed<typeof Loop>>()
const { width } = useElementSize(loopRef as any)

defineExpose({
  toggleFirst(
    ...rest: Parameters<NonNullable<typeof loopRef.value>["toggleFirst"]>
  ) {
    return loopRef.value?.toggleFirst(...rest)
  },
  toggle(...rest: Parameters<NonNullable<typeof loopRef.value>["toggle"]>) {
    return loopRef.value?.toggle(...rest)
  },
})
</script>
