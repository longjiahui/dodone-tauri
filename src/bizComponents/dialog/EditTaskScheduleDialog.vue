<template>
  <Dialog :dialog :title="$t('editSchedule')">
    <template #autoPadding>
      <Task v-if="task" :model-value="task" :background="2"></Task>
      <div class="h items-stretch gap-2">
        <div class="v gap-2">
          <div class="font-semibold">{{ $t("color") }}</div>
          <HSLAHuePicker
            v-model="data.hue"
            :s="taskScheduleHSColorSString"
            :l="taskScheduleHSColorLString"
            :a="taskScheduleHSColorAString"
          ></HSLAHuePicker>
        </div>
        <div class="v stretch gap-2">
          <div class="font-semibold">{{ $t("timeRange") }}</div>
          <TimeRangePicker v-model="data.range"></TimeRangePicker>
        </div>
      </div>
      <div class="h gap-2">
        <Switch v-model="data.useNotification"></Switch>
        <div :class="[!!data.useNotification ? '' : 'opacity-50']">
          {{ $t("useNotification") }}
        </div>
      </div>
    </template>
    <template #footer>
      <Button @click="dialog.close()">{{ $t("cancel") }}</Button>
      <Button
        danger
        @click="
          () => {
            return backend
              .deleteTaskInDayById({ id: taskSchedule.id })
              .then(() => dialog.finish({ type: 'delete' }));
          }
        "
        >{{ $t("removeSchedule") }}</Button
      >
      <Button type="primary" @click="handleSave">{{ $t("resolve") }}</Button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { DialogType } from "@/components/dialog/dialog";
import { ChartData } from "../ScheduleChart.vue";
import { useTaskStore } from "@/store/task";
import { Dayjs, dayjs } from "@/utils/time";
import {
  taskScheduleHSColorAString,
  taskScheduleHSColorLString,
  taskScheduleHSColorSString,
} from "@/const";
import { backend } from "@/utils/backend";
import { ReadOnlyTaskInDayWithExtra } from "@/types";
import { openDialog } from "@/components/dialog/helper";
import ConfirmDialog from "@/components/dialog/commonDialog/ConfirmDialog.vue";
import { updateTaskInDayById } from "@/utils/biz";
import { useNotificationStore } from "@/store/notification";

const props = defineProps<{
  dialog: DialogType<
    any,
    {
      type: "delete" | "update";
      data?: ReadOnlyTaskInDayWithExtra;
    }
  >;

  taskSchedule: ChartData;
}>();

const taskStore = useTaskStore();
const notificationStore = useNotificationStore();
const task = computed(
  () => taskStore.tasksDict[props.taskSchedule.data.taskId]
);

const data = ref({
  range: [dayjs(props.taskSchedule.start), dayjs(props.taskSchedule.end)] as [
    Dayjs,
    Dayjs,
  ],
  hue: props.taskSchedule.color,
  useNotification: !!props.taskSchedule.data.notificationId,
});
function handleSave() {
  return updateTaskInDayById(notificationStore, {
    id: props.taskSchedule.id,
    data: {
      startTime: data.value.range[0].toDate().toISOString(),
      endTime: data.value.range[1].toDate().toISOString(),
      color: data.value.hue?.toString(),
      notification: data.value.useNotification
        ? {
            title: task.value?.content || "",
            content: task.value?.description || "",
            notifyAt: data.value.range[0].toDate().toISOString(),
          }
        : null,
    },
  }).then((d) => {
    if (d) {
      props.dialog.finish({
        type: "update",
        data: d,
      });
    }
  });
}
</script>
