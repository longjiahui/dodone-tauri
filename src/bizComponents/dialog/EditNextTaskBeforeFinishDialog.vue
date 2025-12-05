<template>
  <Dialog :dialog :title="$t('editNextTaskBeforeFinishDialogTitle')">
    <template #autoPadding>
      <div class="text-lighter text-sm">
        {{ $t("editNextTaskBeforeFinishDialogDescription") }}
      </div>
      <Input v-model="task.content"></Input>
      <Textarea v-model="task.description!"> </Textarea>
      <div
        @click="
          dialogs
            .OptionalDateRangePickerDialog({
              value: [
                task.startAt ? dayjs(task.startAt) : null,
                task.endAt ? dayjs(task.endAt) : null,
              ],
            })
            .finishPromise((d) => {
              task.startAt = d?.[0]?.toDate() || null;
              task.endAt = d?.[1]?.toDate() || null;
            })
        "
        class="cursor-pointer self-end"
      >
        <DateRangeDesc
          v-if="task.startAt || task.endAt"
          :startAt="task.startAt"
          :endAt="task.endAt"
        ></DateRangeDesc>
        <Button v-else type="text">{{ $t("setStartDate") }}</Button>
      </div>
    </template>
    <template #footer>
      <Button @click="dialog.close()">{{ $t("cancel") }}</Button>
      <Button
        type="primary"
        @click="
          () =>
            dialog.finish({
              ...task,
              startAt: task.startAt?.toISOString() || null,
              endAt: task.endAt?.toISOString() || null,
            })
        "
      >
        {{ $t("resolve") }}
      </Button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { DialogType } from "@/components/dialog/dialog";
// import {} from "@/store/fetchData"
import { dayjs } from "@/utils/time";
import { toNumber } from "@/utils/number";
import { dialogs } from "@/components/dialog";
import { ReadOnlyTaskWithChildren } from "@/types";
import { useTaskStore } from "@/store/task";
import {
  getNextTaskCustomContent,
  getNextTaskDate,
} from "./EditNextTaskDialog.vue";

const props = defineProps<{
  dialog: DialogType<any, ReadOnlyTaskWithChildren>;
  finishTaskId: string;
  //   nextTask: Partial<Task> & Pick<Task, "content">
}>();

const taskStore = useTaskStore();
const t = taskStore.tasksDict[props.finishTaskId]!;

const nextTask = t.nextTask!;
// if (nextTask.mode === "SIMPLE") {
// let { a, b } = nextTask;
// a = toNumber(a) || 1;
// b = toNumber(b) || 1;
// const counter = toNumber(t.createIndex);
const nextStartDate = nextTask.mode === "SIMPLE" ? getNextTaskDate(t) : null;
// }
const duration =
  !t.endAt || !t.startAt ? 0 : dayjs(t.endAt).diff(t.startAt, "day");
console.debug(duration, nextStartDate);
const task = ref({
  ...t,
  // 如果原来任务都没设置startAt和endAt 则设置一个startAt
  startAt: nextStartDate?.toDate() || null,
  // ? t.startAt || (!t.startAt && !t.endAt)
  //   ? nextStartDate.toDate()
  //   : null
  // : null,
  endAt:
    // nextStartDate,
    // ? t.endAt ?
    nextStartDate?.add(duration, "day").toDate() || null,
  //   : null
  // : null,
  content:
    (nextTask.repeatContent
      ? getNextTaskCustomContent(t, nextTask.repeatContent)
      : t.content) || "",
});
</script>
