<template>
  <DropZone
    @drop="handleDropFile"
    class="h items-stretch gap-4 [&>div]:flex-1 [&>div]:overflow-x-hidden"
  >
    <div ref="container" class="stretch size-full"></div>
    <div class="bg-bg rounded p-4">
      <MarkdownPreviewer :model-value class="break-all"></MarkdownPreviewer>
    </div>
  </DropZone>
</template>
<script setup lang="ts">
import { EditorView, basicSetup } from "codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { fileTypeFromBuffer } from "file-type";
import { backend } from "@/utils/backend";

const container = ref<HTMLDivElement>();
const modelValue = defineModel<string>("modelValue", { default: "" });
const props = withDefaults(
  defineProps<{
    autoFocus?: boolean;
  }>(),
  {}
);

// handle paste
const pasteHandler = EditorView.domEventHandlers({
  paste(event, _view) {
    // Check if the clipboard contains files (images)
    const items = event.clipboardData?.items || [];
    const files = [...items]
      .map((item) => {
        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          return file;
          // if (file) {
          //   // Process the image file (e.g., read as base64, upload)
          //   handlePastedImage(file, view);
          //   event.preventDefault(); // Prevent default paste behavior
          //   return true; // Signal that the event was handled
          // }
        }
      })
      .filter((f) => !!f)
      .map((f) => f!);
    if (files.length > 0) {
      event.preventDefault();
      insertImages(files);
      return true;
    }
    return false; // Let CodeMirror handle other paste types
  },
});

let editor: EditorView | undefined;
onMounted(() => {
  editor = new EditorView({
    parent: container.value!,
    doc: modelValue.value,
    extensions: [basicSetup, EditorView.lineWrapping, markdown(), pasteHandler],
    dispatch: (tr) => {
      editor?.update([tr]);
      if (tr.docChanged) {
        modelValue.value = editor?.state.doc.toString() || "";
      }
    },
  });
  if (props.autoFocus) {
    editor.focus();
  }
});

async function insertImages(imageFiles: File[]) {
  if (imageFiles.length > 0) {
    // upload imagefiles
    const files = await Promise.all(
      imageFiles.map(async (f) => f.arrayBuffer())
    );
    // convert array buffer to uint8array
    const imageURLs = await backend.uploadImages({
      files: files.map((f) => {
        return Array.from(new Uint8Array(f));
      }),
    });
    // insert markdown image links
    const insertTexts =
      imageURLs.map((url) => `![image](${url})`).join("\n") + "\n";
    const currentPos = editor?.state.selection.main.head || 0;
    const newPos = currentPos + insertTexts.length;
    editor?.dispatch(
      editor.state.update({
        changes: {
          from: currentPos,
          to: currentPos,
          insert: insertTexts,
        },
        selection: { anchor: newPos },
      })
    );
  }
}

async function handleDropFile(files: File[], _filelist: FileList) {
  const imageFiles = (
    await Promise.all(
      files.map(async (f) => {
        const buffer = await f.arrayBuffer();
        const type = await fileTypeFromBuffer(buffer);
        return [f, !!type?.mime.startsWith("image/")] satisfies [
          File,
          boolean,
        ] as [File, boolean];
      })
    )
  )
    .filter((d) => !!d[1])
    .map((d) => d[0]);
  return insertImages(imageFiles);
}
</script>

<style lang="css"></style>
