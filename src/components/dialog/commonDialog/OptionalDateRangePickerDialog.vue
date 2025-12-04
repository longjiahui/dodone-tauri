<template>
  <Dialog :dialog :title="finalTitle" size="small">
    <template #autoPadding>
      <div v-if="content" class="text-light">
        {{ content }}
      </div>
      <div class="flex items-center gap-2">
        <div>
          {{ $t("startDate") }}
        </div>
        <DatePicker
          class="stretch"
          :model-value="pickerValue[0]"
          @update:model-value="(val) => (pickerValue[0] = val)"
          :disabled-date="
            (d) => {
              if (pickerValue[1]) {
                return d.isAfter(pickerValue[1]);
              }
              return false;
            }
          "
        ></DatePicker>
      </div>
      <div class="flex items-center gap-2">
        <div>
          {{ $t("endDate") }}
        </div>
        <DatePicker
          class="stretch"
          :model-value="pickerValue[1]"
          @update:model-value="(val) => (pickerValue[1] = val)"
          :disabled-date="
            (d) => {
              if (pickerValue[0]) {
                return d.isBefore(pickerValue[0]);
              }
              return false;
            }
          "
        ></DatePicker>
      </div>
      <!-- 快速设置选项 -->
      <div class="h items-center gap-2">
        <div>快速设置</div>
        <Button
          v-for="d in [
            {
              name: '今天',
              offsetToToday: 0,
            },
            {
              name: '明天',
              offsetToToday: 1,
            },
            {
              name: '后天',
              offsetToToday: 2,
            },
          ]"
          :key="d.name"
          type="text"
          @click="
            () => {
              const targetDate = today.add(d.offsetToToday, 'day');
              pickerValue[0] = targetDate;
              pickerValue[1] = null;
            }
          "
          >{{ d.name }}</Button
        >
        <Button type="text" danger @click="pickerValue = [null, null]"
          >清空</Button
        >
      </div>
    </template>
    <template #footer>
      <Button @click="dialog.close()">{{ $t("cancel") }}</Button>
      <Button
        @click="
          dialog.finish(
            pickerValue && [
              pickerValue[0] ? dayjs(pickerValue[0]) : undefined,
              pickerValue[1] ? dayjs(pickerValue[1]) : undefined,
            ]
          )
        "
        type="primary"
        >{{ $t("resolve") }}</Button
      >
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { dayjs, Dayjs } from "@/utils/time";
import { DialogType } from "../dialog";
import { useSystemStore } from "@/store/system";
import { useI18n } from "vue-i18n";

const props = withDefaults(
  defineProps<{
    dialog: DialogType<any, [Dayjs | undefined, Dayjs | undefined]>;
    title?: string | null;
    content?: string;
    // value?: [string | Dayjs | undefined, string | Dayjs | undefined]
    value?: [Dayjs | null, Dayjs | null];
  }>(),
  {}
);
const { t } = useI18n();
const finalTitle = computed(() => props.title || t("pickDateRange"));
const systemStore = useSystemStore();
const today = computed(() => systemStore.today);
const pickerValue = ref<[Dayjs | null, Dayjs | null]>(
  props.value || [null, null]
);
</script>
