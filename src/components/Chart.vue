<template>
  <VChart
    @click="(d) => $emit('click', d)"
    :option="finalOption"
    autoresize
    :init-options="initOptions"
  ></VChart>
</template>
<script setup lang="ts">
import type { ECElementEvent } from "echarts/core"
import VChart from "vue-echarts"

// const devicePixelRatio = window.devicePixelRatio
const props = withDefaults(
  defineProps<{
    option: (() => EChartsOption) | EChartsOption
  }>(),
  {},
)
defineEmits<{
  (e: "click", d: ECElementEvent): void
}>()
const initOptions = {
  devicePixelRatio: window.devicePixelRatio,
}
let _hook = ref(Math.random())
const refreshFinalOption = () => (_hook.value = Math.random())
const finalOption = computed(() => {
  _hook.value
  const options =
    props.option instanceof Function ? props.option() : props.option
  if (options.tooltip && typeof options.tooltip === "object") {
    if (!(options.tooltip instanceof Array)) {
      options.tooltip!.className = "echarts-blur-tooltip"
    } else {
      options.tooltip?.forEach((t) => (t.className = "echarts-blur-tooltip"))
    }
  }
  // function iterateOptions(options: Partial<Record<string, any>>) {
  //     Object.keys(options).forEach((k) => {
  //         const val = options[k]
  //         // 添加默认 tooltip 样式
  //         if (k === 'tooltip' && !options[k]?.['textStyle']) {
  //             options[k]['textStyle'] = {}
  //         }
  //         // 添加默认 axisLabel 隐藏重叠
  //         if (k === 'axisLabel') {
  //             options[k]['hideOverlap'] = true
  //         }
  //         if (
  //             ['textStyle', 'axisLabel', 'label', 'nameTextStyle'].includes(k)
  //         ) {
  //             // 添加默认 fontSize
  //             if (!options[k]['fontSize']) {
  //                 options[k]['fontSize'] = remSize()
  //             }
  //         }
  //         if (val && typeof val === 'object') {
  //             iterateOptions(val)
  //         }
  //     })
  // }
  // iterateOptions(options)
  return options
})

function handleResize() {
  refreshFinalOption()
}
watch(
  () => props.option,
  () => refreshFinalOption(),
)
window.addEventListener("resize", handleResize)
onBeforeUnmount(() => window.removeEventListener("resize", handleResize))
</script>
