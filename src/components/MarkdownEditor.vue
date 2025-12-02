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
import { selectImageFiles } from "@/utils/file";

const container = ref<HTMLDivElement>();
const modelValue = defineModel<string>("modelValue", { default: "" });
const props = withDefaults(
  defineProps<{
    autoFocus?: boolean;
  }>(),
  {}
);

// tab 缩进（支持选择多行，Shift+Tab 反向减少缩进）
const tabHandler = EditorView.domEventHandlers({
  keydown(event, view) {
    if (event.key !== "Tab") return false;
    event.preventDefault();
    const tab = "  ";
    const sel = view.state.selection.main;
    const { from, to } = sel;
    if (from === to) {
      const line = view.state.doc.lineAt(from);
      if (event.shiftKey) {
        const ahead = view.state.doc.sliceString(
          line.from,
          line.from + tab.length
        );
        if (ahead === tab) {
          view.dispatch({
            changes: {
              from: line.from,
              to: line.from + tab.length,
              insert: "",
            },
            selection: { anchor: from - tab.length },
          });
          return true;
        }
        if (ahead.startsWith("\t")) {
          view.dispatch({
            changes: { from: line.from, to: line.from + 1, insert: "" },
            selection: { anchor: Math.max(line.from, from - 1) },
          });
          return true;
        }
        return true;
      } else {
        view.dispatch({
          changes: { from, to, insert: tab },
          selection: { anchor: from + tab.length },
        });
        return true;
      }
    }
    const startLine = view.state.doc.lineAt(from).number;
    const endLineObj = view.state.doc.lineAt(to);
    let endLine = endLineObj.number;
    if (to === endLineObj.from && to > from) endLine -= 1;
    const changes: { from: number; to: number; insert: string }[] = [];
    let newFrom = from;
    let newTo = to;
    if (event.shiftKey) {
      for (let ln = startLine; ln <= endLine; ln++) {
        const lineObj = view.state.doc.line(ln);
        const text = lineObj.text;
        if (text.startsWith(tab)) {
          changes.push({
            from: lineObj.from,
            to: lineObj.from + tab.length,
            insert: "",
          });
          if (lineObj.from < from) newFrom -= tab.length;
          newTo -= tab.length;
        } else if (text.startsWith("\t")) {
          changes.push({
            from: lineObj.from,
            to: lineObj.from + 1,
            insert: "",
          });
          if (lineObj.from < from) newFrom -= 1;
          newTo -= 1;
        }
      }
    } else {
      let lineCount = 0;
      for (let ln = startLine; ln <= endLine; ln++) {
        const lineObj = view.state.doc.line(ln);
        changes.push({ from: lineObj.from, to: lineObj.from, insert: tab });
        lineCount++;
        if (lineObj.from <= from) newFrom += tab.length;
        newTo += tab.length;
      }
    }
    if (changes.length) {
      view.dispatch({
        changes,
        selection: { anchor: newFrom, head: newTo },
      });
    }
    return true;
  },
});

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
    extensions: [
      basicSetup,
      EditorView.lineWrapping,
      markdown(),
      pasteHandler,
      tabHandler,
    ],
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

defineExpose({
  uploadImage: async () => {
    const images = await selectImageFiles();
    return insertImages(images);
  },
});
</script>

<style lang="css"></style>
