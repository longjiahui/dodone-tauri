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
      <Button
        @click="dialog.finish(pickerValue ? dayjs(pickerValue) : null)"
        type="primary"
        >{{ $t("resolve") }}</Button
      >
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { dayjs, Dayjs } from "@/utils/time";
import { DialogType } from "../dialog";
import { useI18n } from "vue-i18n";
const props = defineProps<{
  dialog: DialogType<any, Dayjs | null>;
  title?: string | null;
  content?: string;
  value?: Dayjs | null;
}>();

const { t } = useI18n();
const finalTitle = computed(() => props.title ?? t("pickDate"));

const pickerValue = ref<Dayjs | null>(props.value || dayjs());
</script>
