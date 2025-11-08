<template>
    <div @drop.prevent="onDrop">
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
    (e: 'drop', files: File[], filelist: FileList): void
}>()

function onDrop(e: DragEvent) {
    if ((e.dataTransfer?.files.length || 0) > 0) {
        emit('drop', Array.from(e.dataTransfer!.files), e.dataTransfer!.files)
    }
}

function preventDefaults(e: Event) {
    e.preventDefault()
}

const events = ['dragenter', 'dragover', 'dragleave', 'drop']
onMounted(() => {
    events.forEach((eventName) => {
        document.body.addEventListener(eventName, preventDefaults)
    })
})

onUnmounted(() => {
    events.forEach((eventName) => {
        document.body.removeEventListener(eventName, preventDefaults)
    })
})
</script>
