<template>
  <div class="stretch bg-light flex size-full flex-col p-3">
    <ScheduleChart
      ref="scheduleChartRef"
      @create="handleCreateTaskInDay"
      @click-data="handleClickData"
      class="stretch overflow-hidden rounded"
      :request-datas="handleRequestDatas"
    ></ScheduleChart>
  </div>
</template>

<script setup lang="ts">
import { backend } from "@/utils/backend";
import ScheduleChart, {
  type ChartData,
} from "@/bizComponents/ScheduleChart.vue";
import { task2ChartData } from "@/utils/biz";
import { dialogs } from "@/components/dialog";

const scheduleChartRef = ref<InstanceType<typeof ScheduleChart>>();

function handleRequestDatas(start: Date, end: Date) {
  return backend
    .getTaskInDays({ search: { startDate: start, endDate: end } })
    .then((d) => {
      return d.map((d) => {
        return task2ChartData(d);
      });
    });
}

async function handleCreateTaskInDay(_date: Date, start: Date) {
  //   return dialogs
  //     .EditTaskInDayDialog({
  //       startTime: start,
  //       endTime: dayjs(start).add(1, "hour").toDate(),
  //     })
  //     .finishPromise(() => scheduleChartRef.value?.refetchDatas())
}

function handleClickData(data: ChartData) {
  return dialogs
    .EditTaskScheduleDialog({
      taskSchedule: data,
    })
    .finishPromise(() => scheduleChartRef.value?.refetchDatas());
}
</script>
