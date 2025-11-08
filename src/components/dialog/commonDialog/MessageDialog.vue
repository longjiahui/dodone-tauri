<template>
  <Dialog :dialog :title :width>
    <template #autoPadding>
      <div v-if="content" class="text-light">
        {{ content }}
      </div>
    </template>
    <template #footer>
      <Button @click="dialog.close()" type="primary">
        {{ $t("resolve") }}
      </Button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { AnyDialogType } from "../dialog"

withDefaults(
  defineProps<{
    dialog: AnyDialogType
    title?: string | null
    content: string | null
    width?: string
  }>(),
  {
    title: "提示",
    width: "240px",
  },
)
</script>
