<template>
  <Dialog :dialog :title>
    <template #autoPadding>
      <div v-if="content" class="text-light">
        {{ content }}
      </div>
      <!-- <Textarea v-model="textareaValue"></Textarea> -->
      <Textarea
        v-focus
        :placeholder
        class="text-md size-full resize-none bg-transparent outline-none"
        :rows="8"
        v-model="textareaValue"
      ></Textarea>
    </template>
    <template #footer>
      <Button @click="() => dialog.close()">{{ $t("cancel") }}</Button>
      <Button @click="() => dialog.finish(textareaValue)" type="primary">{{
        $t("resolve")
      }}</Button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { DialogType } from "../dialog"

const props = defineProps<{
  dialog: DialogType<any, string>
  title?: string | null
  content?: string
  value?: string | null
  placeholder?: string
}>()

const textareaValue = ref(props.value || "")
</script>
