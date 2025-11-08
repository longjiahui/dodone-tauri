<template>
  <Dropdown trigger="click">
    <div
      class="border-dark-5 size-[32px] cursor-pointer rounded border hover:opacity-85"
      :style="{
        background: `hsla(${modelValue}, ${s}, ${l}, ${a})`,
      }"
    ></div>
    <template #body>
      <div class="bg-blur rounded p-2 shadow">
        <!-- @mousemove="handleMouseMove" -->
        <div
          @click="handleMouseMove"
          class="border-dark-5 size-[120px] cursor-pointer rounded-full border shadow"
          :style="{
            opacity: a,
            background: `conic-gradient(
              hsl(0 ${s} ${l}),
              hsl(45 ${s} ${l}),
              hsl(90 ${s} ${l}),
              hsl(135 ${s} ${l}),
              hsl(180 ${s} ${l}),
              hsl(225 ${s} ${l}),
              hsl(270 ${s} ${l}),
              hsl(315 ${s} ${l}),
              hsl(360 ${s} ${l})
  )`,
          }"
        ></div>
      </div>
    </template>
  </Dropdown>
</template>
<script setup lang="ts">
const modelValue = defineModel<number | string | null | undefined>(
  "modelValue",
  undefined,
)
defineProps<{
  // saturation
  s: string
  // lightness
  l: string
  // alpha
  a: string
}>()

// const currentHue = ref(modelValue.value)

function handleMouseMove(e: MouseEvent) {
  // 获取圆心坐标
  const rect = (e.target as HTMLElement).getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  // 计算鼠标相对于圆心的坐标
  const deltaX = e.clientX - centerX
  const deltaY = e.clientY - centerY
  // 计算角度
  let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90
  if (angle < 0) angle += 360
  // currentHue.value = Math.round(angle)
  modelValue.value = Math.round(angle)
}
</script>
