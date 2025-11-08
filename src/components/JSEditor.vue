<template>
  <div ref="container" class="stretch size-full"></div>
</template>
<script setup lang="ts">
import { EditorView, basicSetup } from "codemirror"
import { javascript } from "@codemirror/lang-javascript"

const container = ref<HTMLDivElement>()
const modelValue = defineModel<string>("modelValue", { default: "" })
const props = withDefaults(
  defineProps<{
    autoFocus?: boolean
  }>(),
  {},
)

let editor: EditorView | undefined
onMounted(() => {
  editor = new EditorView({
    parent: container.value!,
    doc: modelValue.value,
    extensions: [basicSetup, EditorView.lineWrapping, javascript()],
    dispatch: (tr) => {
      editor?.update([tr])
      if (tr.docChanged) {
        modelValue.value = editor?.state.doc.toString() || ""
      }
    },
  })
  if (props.autoFocus) {
    editor.focus()
  }
})
</script>

<style lang="css"></style>
