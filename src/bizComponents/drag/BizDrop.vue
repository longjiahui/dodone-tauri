<template>
  <slot
    v-bind="{
      setRef,
      isDroppingActive,
      isDragging,
    }"
  ></slot>
</template>
<script setup lang="ts">
import { DragData, dragEventEmitter } from "./drag"

const props = defineProps<{
  channel?: DragData["type"] | DragData["type"][]
  disabled?: boolean
}>()

const finalChannels = computed(() =>
  props.channel
    ? props.channel instanceof Array
      ? props.channel.slice()
      : [props.channel]
    : [],
)

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

const emit = defineEmits<{
  (e: "drop", channel: DragData["type"], dragData: DragData): void
}>()
// "drop:move-tasks": (_: DragData<ReadOnlyTaskWithChildren>) => {},
// "drop:order-taskview": (_: DragData<ReadOnlyTaskViewWithExtra>) => {},
// "drop:order-taskgroup": (_: DragData<ReadOnlyTaskGroupWithExtra>) => {},
// "drop:order-taskanchor": (_: DragData<TaskAnchorWithTaskGroupId>) => {},
// drop: (channel: DragData["type"], dragData: DragData) => {},

const isDroppingActive = ref(false)
const isDragging = ref(false)

function getDragData<D extends DragData>(
  channel: string,
  e: DragEvent,
): D | null {
  if (e.dataTransfer) {
    let data: DragData
    try {
      const dataRaw = e.dataTransfer.getData(channel)
      if (dataRaw) {
        data = JSON.parse(dataRaw)
      } else {
        return null
      }
    } catch (err) {
      console.error("dataTransfer data is not json", err)
      return null
    }
    return data as D
  }
  return null
}

function handleDrop(e: DragEvent) {
  if (droppable(e)) {
    finalChannels.value.forEach((c) => {
      let data = getDragData(c, e)
      if (data) {
        e.preventDefault()
        if (finalChannels.value.includes(data.type)) {
          emit("drop", data.type, data)
        }
      }
    })
  }
}

function isHitChannel(cs: string[]) {
  return finalChannels.value.some((d) => cs.includes(d))
}

function droppable(e: DragEvent) {
  if (e.dataTransfer) {
    if (isHitChannel(e.dataTransfer?.types.slice() || [])) {
      return true
    }
  }
  return false
}

function handleDragOver(e: DragEvent) {
  // dragover无法获取data内容，为了安全、因为用户不希望把数据暴露给 over的元素上、例如跨网站。天啊、太细了
  // let dragData = getDragData(e)
  if (droppable(e)) {
    e.preventDefault()
  }
}

function handleDragEnter(e: DragEvent) {
  if (droppable(e)) {
    isDroppingActive.value = true
  }
}
function handleDragLeave(e: DragEvent) {
  if (droppable(e)) {
    let relatedElement = e.relatedTarget as HTMLElement | null | undefined
    if (relatedElement) {
      while (relatedElement !== slotRef.value && relatedElement) {
        relatedElement = relatedElement?.parentElement
      }
    }
    if (relatedElement !== slotRef.value) {
      isDroppingActive.value = false
    }
  }
}

function listen(el: HTMLElement) {
  el.addEventListener("drop", handleDrop)
  el.addEventListener("dragover", handleDragOver)
  el.addEventListener("dragenter", handleDragEnter)
  el.addEventListener("dragleave", handleDragLeave)
}
function removeListen(el: HTMLElement) {
  el.removeEventListener("drop", handleDrop)
  el.removeEventListener("dragover", handleDragOver)
  el.removeEventListener("dragenter", handleDragEnter)
  el.removeEventListener("dragleave", handleDragLeave)
}

watch(
  [slotRef, () => props.disabled],
  ([el, disabled], [oldEl]) => {
    if (oldEl) {
      removeListen(oldEl)
    }
    if (el && !disabled) {
      listen(el)
    } else if (el) {
      removeListen(el)
    }
  },
  { immediate: true },
)
function handleDragEnd() {
  isDroppingActive.value = false
  isDragging.value = false
}

function handleDragStart(_e: DragEvent, c: string[]) {
  if (isHitChannel(c)) {
    isDragging.value = true
  }
}
dragEventEmitter.on("dragend", handleDragEnd)
dragEventEmitter.on("dragstart", handleDragStart)
onBeforeUnmount(() => {
  if (slotRef.value) {
    removeListen(slotRef.value)
  }
  dragEventEmitter.off("dragend", handleDragEnd)
  dragEventEmitter.off("dragstart", handleDragStart)
})
</script>
