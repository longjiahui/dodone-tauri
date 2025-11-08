<template>
  <Dialog :dialog :title :width>
    <template #autoPadding>
      <div v-if="content" class="text-light">
        {{ content }}
      </div>
    </template>
    <template #footer>
      <Button @click="dialog.close()">{{ $t("cancel") }}</Button>
      <Button @click="dialog.finish()" type="primary">{{
        $t("resolve")
      }}</Button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { type AnyDialogType } from "../dialog"

withDefaults(
  defineProps<{
    dialog: AnyDialogType
    title?: string | null
    content?: string | null
    width?: string
  }>(),
  {
    width: "240px",
  },
)
</script>
