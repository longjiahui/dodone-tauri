<template>
  <Dialog :dialog :title :width>
    <template #autoPadding>
      <div v-if="content" class="text-light">
        {{ content }}
      </div>
    </template>
    <template #footer>
      <Button @click="cancel()">{{ $t("cancel") }}</Button>
      <Button @click="resolve()" type="primary">{{ $t("resolve") }}</Button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { type AnyDialogType } from "../dialog";

const props = withDefaults(
  defineProps<{
    dialog: AnyDialogType;
    title?: string | null;
    content?: string | null;
    width?: string;
  }>(),
  {
    width: "240px",
  }
);

function resolve() {
  return props.dialog.finish();
}
function cancel() {
  return props.dialog.close();
}

function handleKeyup(e: KeyboardEvent) {
  if (e.key === "Enter") {
    resolve();
  }
  if (e.key === "Escape") {
    cancel();
  }
}
document.addEventListener("keyup", handleKeyup);
onBeforeUnmount(() => {
  document.removeEventListener("keyup", handleKeyup);
});
</script>
