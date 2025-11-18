<template>
  <Dialog :dialog size="small" :title="$t('editTargetRecord')">
    <template #autoPadding>
      <div>
        <div class="font-semibold">{{ $t("value") }}</div>
        <div>
          <Input v-model="localData.value" type="number"></Input>
        </div>
      </div>
      <div>
        <div class="font-semibold">{{ $t("time") }}</div>
        <div>
          <DateTimePicker v-model="localData.recordAt"></DateTimePicker>
        </div>
      </div>
      <div>
        <div class="font-semibold">{{ $t("remark") }}</div>
        <div>
          <Input v-model="localData.remark" :placeholder="$t('remark')"></Input>
        </div>
      </div>
    </template>
    <template #footer>
      <Button @click="dialog.close()">{{ $t("close") }}</Button>
      <Button
        type="primary"
        @click="
          dialog.finish({
            value: isNaN(+localData.value) ? '0' : localData.value,
            recordAt: dayjs(localData.recordAt).toDate().toISOString(),
            remark: localData.remark,
          })
        "
        >{{ $t("save") }}</Button
      >
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DialogType } from "@/components/dialog/dialog";
import { dayjs } from "@/utils/time";
import { TaskTargetRecord } from "@/types";

const props = defineProps<{
  dialog: DialogType<
    any,
    Pick<TaskTargetRecord, "value" | "recordAt" | "remark">
  >;
  record: TaskTargetRecord;
}>();

const localData = ref({
  value: props.record.value,
  recordAt: dayjs(props.record.recordAt),
  remark: props.record.remark || "",
});
</script>
