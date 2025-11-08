<template>
  <Dialog :dialog :title size="large">
    <template #autoPadding>
      <div v-if="content" class="text-light">
        {{ content }}
      </div>
      <div class="text-light text-sm">
        <InfoCircleOutlined></InfoCircleOutlined> {{ $t("markdownUsable") }}
      </div>
      <!-- <Textarea v-model="textareaValue"></Textarea> -->
      <!-- :placeholder -->
      <!-- class="text-md size-full resize-none bg-transparent outline-none" -->
      <!-- :rows="8" -->
      <MarkdownEditor
        auto-focus
        v-model="textareaValue"
        class="min-h-[104px]"
      ></MarkdownEditor>
    </template>
    <template #footer>
      <Button @click="dialog.close()">{{ $t("cancel") }}</Button>
      <Button @click="dialog.finish(textareaValue)" type="primary">{{
        $t("resolve")
      }}</Button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { InfoCircleOutlined } from "@ant-design/icons-vue"
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
