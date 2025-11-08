<template>
  <Dialog :dialog :title="finalTitle" width="300px">
    <template #autoPadding>
      <div v-if="content" class="text-light">
        {{ content }}
      </div>
      <DatePicker v-model="pickerValue"></DatePicker>
    </template>
    <template #footer>
      <Button @click="dialog.close()">{{ $t("cancel") }}</Button>
      <Button @click="dialog.finish(dayjs(pickerValue))" type="primary">{{
        $t("resolve")
      }}</Button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { dayjs, Dayjs } from "@/utils/time"
import { DialogType } from "../dialog"
import { useI18n } from "vue-i18n"
const props = defineProps<{
  dialog: DialogType<any, Dayjs>
  title?: string | null
  content?: string
  value?: Dayjs
}>()

const { t } = useI18n()
const finalTitle = computed(
  () => props.title ?? t("datePickerDialog.defaultTitle"),
)

const pickerValue = ref<Dayjs>(props.value || dayjs())
</script>
