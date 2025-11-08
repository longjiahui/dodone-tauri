<template>
  <div ref="scrollbarRef" :class="ns.b()">
    <div
      ref="wrapRef"
      :class="wrapKls"
      :style="wrapStyle"
      @scroll="handleScroll"
    >
      <component
        :is="tag"
        :id="id"
        ref="resizeRef"
        :class="resizeKls"
        :style="viewStyle"
        :role="role"
        :aria-label="ariaLabel"
        :aria-orientation="ariaOrientation"
      >
        <slot />
      </component>
    </div>
    <template v-if="!native">
      <bar
        ref="barRef"
        :height="sizeHeight"
        :width="sizeWidth"
        :always="always"
        :ratio-x="ratioX"
        :ratio-y="ratioY"
      />
    </template>
  </div>
</template>
<script lang="ts" setup>
import type { BarInstance } from "./bar"
import Bar from "./bar.vue"
import "./base.css"
import { scrollbarContextKey } from "./constants"
import { useNamespace } from "./namespace"
import { scrollbarEmits, scrollbarProps } from "./scrollbar"
import "./scrollbar.css"
import { GAP } from "./util"
import { isObject, useEventListener, useResizeObserver } from "@vueuse/core"
import {
  computed,
  nextTick,
  onMounted,
  onUpdated,
  provide,
  reactive,
  ref,
  watch,
} from "vue"
import type { CSSProperties, StyleValue } from "vue"

class ElementPlusError extends Error {
  constructor(m: string) {
    super(m)
    this.name = "ElementPlusError"
  }
}

const isString: (val: unknown) => val is string = ((val: any) =>
  typeof val === "string") as any
const isStringNumber = (val: string): boolean => {
  if (!isString(val)) {
    return false
  }
  return !Number.isNaN(Number(val))
}

function debugWarn(scope: string, message?: string): void {
  if (process.env.NODE_ENV !== "production") {
    const error: Error = isString(scope)
      ? new ElementPlusError(`[${scope}] ${message}`)
      : scope
    // eslint-disable-next-line no-console
    console.warn(error)
  }
}
const isNumber = (val: any): val is number => typeof val === "number"

const SCOPE = "utils/dom/style"
function addUnit(value?: string | number, defaultUnit = "px") {
  if (!value) return ""
  if (isNumber(value) || isStringNumber(value)) {
    return `${value}${defaultUnit}`
  } else if (isString(value)) {
    return value
  }
  debugWarn(SCOPE, "binding value must be a string or number")
}

const COMPONENT_NAME = "ElScrollbar"

defineOptions({
  name: COMPONENT_NAME,
})

const props = defineProps(scrollbarProps)
const emit = defineEmits<{
  (e: "scroll", el: HTMLElement): void
}>()

const ns = useNamespace("scrollbar")

let stopResizeObserver: (() => void) | undefined = undefined
let stopResizeListener: (() => void) | undefined = undefined

const scrollbarRef = ref<HTMLDivElement>()
const wrapRef = ref<HTMLDivElement>()
const resizeRef = ref<HTMLElement>()

const sizeWidth = ref("0")
const sizeHeight = ref("0")
const barRef = ref<BarInstance>()
const ratioY = ref(1)
const ratioX = ref(1)

const wrapStyle = computed<StyleValue>(() => {
  const style: CSSProperties = {}
  if (props.height) style.height = addUnit(props.height)
  if (props.maxHeight) style.maxHeight = addUnit(props.maxHeight)
  return [props.wrapStyle, style]
})

const wrapKls = computed(() => {
  return [
    props.wrapClass,
    ns.e("wrap"),
    {
      [ns.em("wrap", "hidden-default")]: !props.native,
    },
  ]
})

const resizeKls = computed(() => {
  return [ns.e("view"), props.viewClass]
})

const handleScroll = () => {
  if (wrapRef.value) {
    barRef.value?.handleScroll(wrapRef.value)

    emit(
      "scroll",
      wrapRef.value,
      // {
      //   scrollTop: wrapRef.value.scrollTop,
      //   scrollLeft: wrapRef.value.scrollLeft
      // }
    )
  }
}

const setScrollTop = (value: number) => {
  if (!isNumber(value)) {
    debugWarn(COMPONENT_NAME, "value must be a number")
    return
  }
  wrapRef.value!.scrollTop = value
}

const setScrollLeft = (value: number) => {
  if (!isNumber(value)) {
    debugWarn(COMPONENT_NAME, "value must be a number")
    return
  }
  wrapRef.value!.scrollLeft = value
}

const update = () => {
  if (!wrapRef.value) return
  const offsetHeight = wrapRef.value.offsetHeight - GAP
  const offsetWidth = wrapRef.value.offsetWidth - GAP

  const originalHeight = offsetHeight ** 2 / wrapRef.value.scrollHeight
  const originalWidth = offsetWidth ** 2 / wrapRef.value.scrollWidth
  const height = Math.max(originalHeight, props.minSize)
  const width = Math.max(originalWidth, props.minSize)

  ratioY.value =
    originalHeight /
    (offsetHeight - originalHeight) /
    (height / (offsetHeight - height))
  ratioX.value =
    originalWidth /
    (offsetWidth - originalWidth) /
    (width / (offsetWidth - width))

  sizeHeight.value = height + GAP < offsetHeight ? `${height}px` : ""
  sizeWidth.value = width + GAP < offsetWidth ? `${width}px` : ""
}

watch(
  () => props.noresize,
  (noresize) => {
    if (noresize) {
      stopResizeObserver?.()
      stopResizeListener?.()
    } else {
      ;({ stop: stopResizeObserver } = useResizeObserver(resizeRef, update))
      stopResizeListener = useEventListener("resize", update)
    }
  },
  { immediate: true },
)

watch(
  () => [props.maxHeight, props.height],
  () => {
    if (!props.native)
      nextTick(() => {
        update()
        if (wrapRef.value) {
          barRef.value?.handleScroll(wrapRef.value)
        }
      })
  },
)

provide(
  scrollbarContextKey,
  reactive({
    scrollbarElement: scrollbarRef as any,
    wrapElement: wrapRef as any,
  }),
)
function handleWheel(event: WheelEvent) {
  if (!props.horizontalScroll) return
  if (event.deltaY == 0) return
  event.preventDefault()
  wrapRef.value!.scrollTo({
    left: wrapRef.value!.scrollLeft + event.deltaY,
    // behavior: "smooth",
  })
}
onMounted(() => {
  if (!props.native)
    nextTick(() => {
      update()
    })

  if (props.horizontalScroll) {
    wrapRef.value?.addEventListener(
      "wheel",
      (e) => {
        handleWheel(e)
      },
      { passive: false },
    )
  }
})
onBeforeUnmount(() => {
  wrapRef.value?.removeEventListener("wheel", handleWheel)
})
onUpdated(() => update())
type ScrollBehavior = "auto" | "instant" | "smooth"
interface ScrollOptions {
  behavior?: ScrollBehavior
}

interface ScrollToOptions extends ScrollOptions {
  left?: number
  top?: number
}
// TODO: refactor method overrides, due to script setup dts
function scrollTo(xCord: number, yCord?: number): void
// eslint-disable-next-line no-redeclare
function scrollTo(options: ScrollToOptions): void
// eslint-disable-next-line no-redeclare
function scrollTo(arg1: unknown, arg2?: number) {
  if (isObject(arg1)) {
    wrapRef.value!.scrollTo(arg1)
  } else if (isNumber(arg1) && isNumber(arg2)) {
    wrapRef.value!.scrollTo(arg1, arg2)
  }
}

defineExpose({
  /** @description scrollbar wrap ref */
  wrapRef,
  /** @description update scrollbar state manually */
  update,
  /** @description scrolls to a particular set of coordinates */
  scrollTo,
  /** @description set distance to scroll top */
  setScrollTop,
  /** @description set distance to scroll left */
  setScrollLeft,
  /** @description handle scroll event */
  handleScroll,
  scrollHeight: () => wrapRef.value?.scrollHeight || 0,
  clientHeight: () => wrapRef.value?.clientHeight || 0,
})
</script>
