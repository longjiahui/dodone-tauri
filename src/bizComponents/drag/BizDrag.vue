<template>
  <slot :set-ref="setRef"></slot>
  <!-- <DefineDragImageTemplate #default="{ name }">
    <div class="rounded bg-bg p-2 shadow">{{ name }}</div>
  </DefineDragImageTemplate> -->
</template>
<script setup lang="ts">
import { DragData, dragEventEmitter } from "./drag"

const props = defineProps<{
  dragDatas: () => DragData[]
}>()

const slotRef = ref<HTMLElement>()
function setRef<T>(el: T) {
  if (el instanceof HTMLDivElement) {
    slotRef.value = el
  } else if (!el) {
    slotRef.value = undefined
  } else {
    throw new Error("el is not HTMLDivElement")
  }
}

// const [DefineDragImageTemplate, DragImageTemplate] = createReusableTemplate<{
//   name: string
// }>()

// function createDragImage<T extends DragData>(dragData: T) {
//   if (dragData.type === "move-task") {
//     const data = dragData.data as ReadOnlyTaskWithChildren
//     const div = document.createElement("div")
//     div.className = "inline-block fixed top-full left-full"
//     render(
//       h(DragImageTemplate, {
//         name: data.content,
//       }),
//       div,
//     )
//     return div
//   } else {
//     throw new Error("unknown drag data type")
//   }
// }

let originOpacity: string = ""
function handleDragStart(e: DragEvent) {
  if (slotRef.value && e.dataTransfer) {
    const dragDatas = props.dragDatas()
    dragDatas.forEach((dragData) => {
      e.dataTransfer!.setData(dragData.type, JSON.stringify(dragData))
    })
    originOpacity = slotRef.value?.style.opacity || ""
    slotRef.value.style.opacity = "0.5"
    // if (dragData.type === "move-tasks") {
    e.dataTransfer.effectAllowed = "move"
    // }
    setTimeout(() => {
      // setTimeout延迟 否则可能会影响orderContainer的拖拽体验
      dragEventEmitter.emit(
        "dragstart",
        e,
        dragDatas.map((d) => d.type),
      )
    })
  }
}
function handleDragEnd(e: DragEvent) {
  if (slotRef.value) {
    slotRef.value.style.opacity = originOpacity
  }
  dragEventEmitter.emit("dragend", e)
}
watch(
  slotRef,
  (val, old) => {
    if (old) {
      old.removeEventListener("dragstart", handleDragStart)
      old.removeEventListener("dragend", handleDragEnd)
    }
    if (val) {
      val.draggable = true
      val.addEventListener("dragstart", handleDragStart)
      val.addEventListener("dragend", handleDragEnd)
    }
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  if (slotRef.value) {
    slotRef.value.removeEventListener("dragstart", handleDragStart)
    slotRef.value.removeEventListener("dragend", handleDragEnd)
  }
})
</script>
