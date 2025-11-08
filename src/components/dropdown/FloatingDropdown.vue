<template>
  <div
    ref="reference"
    @focusin="() => trigger === 'focus' && !disabled && (open = true)"
    @focusout="() => trigger === 'focus' && (open = false)"
    @click.stop="() => trigger === 'click' && !disabled && (open = !open)"
  >
    <slot></slot>
    <Teleport to="body">
      <div
        v-if="trigger !== 'hover' && finalOpen && isReferenceVisibility"
        @click="open = false"
        class="fixed top-0 left-0 z-[9998] size-full"
      ></div>
    </Teleport>
    <Teleport :to="teleport">
      <transition :name="transition" appear>
        <div
          @click.stop="() => trigger === 'click' && (open = false)"
          ref="floating"
          v-if="finalOpen && isReferenceVisibility"
          :style="{
            ...floatingStyles,
            minWidth: noMinWidth ? 0 : referenceWidth + 'px',
          }"
          :class="['h z-[9999]', ...bodyWrapperClass]"
        >
          <slot v-if="$slots.body" name="body"></slot>
        </div>
      </transition>
    </Teleport>
  </div>
</template>
<script setup lang="ts">
import {
  useElementHover,
  useElementSize,
  useElementVisibility,
} from "@vueuse/core"
import {
  autoUpdate,
  useFloating,
  offset as offsetMid,
  flip,
  hide,
} from "@floating-ui/vue"
import { v1 as uuid } from "uuid"
import { WatchStopHandle } from "vue"
import { Trigger } from "@/types"

type SubHovers = Partial<Record<string, boolean>>
const subHoversKey: InjectionKey<Ref<SubHovers>> = Symbol()

type Placement =
  | "bottomLeft"
  | "bottom"
  | "bottomRight"
  | "topLeft"
  | "top"
  | "topRight"
  | "leftTop"
  | "left"
  | "leftBottom"
  | "right"
  | "rightTop"
const props = withDefaults(
  defineProps<{
    trigger?: Trigger
    placement?: Placement
    offset?: number
    disabled?: boolean
    teleport?: string
    bodyWrapperClass?: string[] | string
    transition?: string

    /* 是否显示的第二个开关 */
    secondOpen?: boolean
    /**取消浮层最小宽度 */
    noMinWidth?: boolean
  }>(),
  {
    trigger: "hover",
    placement: "bottom",
    offset: undefined,
    disabled: false,
    teleport: "body",
    bodyWrapperClass: "",
    noMinWidth: false,
    transition: "fade-translate-from-top-fast",

    secondOpen: true,
  },
)
const open = defineModel<boolean>("open", { default: false })
const finalOpen = computed(() => open.value && props.secondOpen)
const reference = ref<HTMLElement>()
const { width: referenceWidth } = useElementSize(reference)
const floating = ref<HTMLElement>()

const { floatingStyles } = useFloating(reference, floating, {
  whileElementsMounted: autoUpdate,
  transform: false,
  placement: computed(
    () =>
      (
        ({
          bottom: "bottom",
          bottomLeft: "bottom-start",
          bottomRight: "bottom-end",
          top: "top",
          topLeft: "top-start",
          topRight: "top-end",
          left: "left",
          leftTop: "left-start",
          right: "right",
          rightTop: "right-start",
          leftBottom: "left-end",
        }) satisfies Record<Placement, any> as Record<Placement, any>
      )[props.placement],
  ),
  middleware: [
    hide({ strategy: "referenceHidden" }),
    flip(),
    offsetMid(props.offset || 0),
  ],
})
const isReferenceHover = useElementHover(reference, { delayLeave: 100 })
const isFloatingHover = useElementHover(floating, { delayLeave: 100 })
const isReferenceVisibility = useElementVisibility(reference)
const subHovers = ref<SubHovers>({})
const id = uuid()
const parentSubHovers = inject(subHoversKey, undefined)
const isHover = computed(() => {
  return (
    isReferenceHover.value ||
    // floating 必须显示才能hover
    (isFloatingHover.value && finalOpen.value) ||
    Object.values(subHovers.value).some((h) => !!h)
  )
})

watch(isReferenceVisibility, (val) => {
  if (!val) {
    open.value = false
  }
})
watch(
  isHover,
  (val) => {
    if (parentSubHovers) {
      parentSubHovers.value[id] = val
    }
  },
  { immediate: true },
)
watch(open, (val) => {
  if (!val) {
    setTimeout(() => {
      triggerRef(isHover)
    }, 100)
  }
})
provide(subHoversKey, subHovers)

function useWatch(
  _watch: (() => WatchStopHandle) | (() => WatchStopHandle)[],
  immediate = true,
) {
  const watch = _watch instanceof Array ? _watch : [_watch]
  let us: WatchStopHandle[] = []
  if (immediate) {
    if (us.length > 0) {
      us.forEach((u) => u())
      us = []
    }
    us = watch.map((w) => w())
  }
  return {
    resume() {
      if (us.length > 0) {
        us.forEach((u) => u())
        us = []
      }
      us = watch.map((w) => w())
    },
    pause() {
      if (us.length > 0) {
        us.forEach((u) => u())
        us = []
      }
    },
  }
}
const { pause, resume } = useWatch(
  () =>
    watch(isHover, (val) => {
      if (!props.disabled) {
        open.value = val
      }
    }),
  false,
)
watch(
  () => props.trigger === "hover",
  (val) => {
    if (val) {
      resume()
    } else {
      pause()
    }
  },
  { immediate: true },
)
</script>
