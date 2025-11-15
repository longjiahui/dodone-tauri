<script setup lang="ts">
import {
  BatchEditTasksResult,
  DoingWindowType,
  ReadOnlyTaskInDayWithExtra,
  ReadOnlyTaskWithChildren,
  task2TaskLocal,
  task2TaskWithChildren,
} from "@/types";
import { backend } from "@/utils/backend";
import { dayjs, makeDayjsByDateTime } from "@/utils/time";
import { calculateTheme } from "@/utils/color";
import { themeHSColorL, themeHSColorS } from "@/const";
import { BackwardOutlined, ForwardOutlined } from "@ant-design/icons-vue";

const params = useUrlSearchParams<{
  type: DoingWindowType;
  // for specific-task
  taskId?: string;
}>("history", {
  initialValue: {
    type: "auto-task-in-day",
  },
});
const taskContentRef = ref<HTMLDivElement>();
const taskContentRefSize = useElementSize(taskContentRef);
function handleSetDoingWindowParams(t: DoingWindowType, taskId?: string): void {
  params.type = t;
  params.taskId = taskId;
}
async function handleBatchUpsertTasks(d: BatchEditTasksResult) {
  let { updated } = d || {};
  updated = updated.map((u) => task2TaskLocal(u));
  if (
    (
      await Promise.all(
        updated.map(async (update) => {
          if (update.state === "UNDONE") {
            const taskInDays = await backend.getTaskInDays({
              search: { taskId: update.id },
            });
            // 如果比现在晚、比current早、则刷新
            if (
              taskInDays.some((d) => {
                return (
                  dayjs(d.endTime).isAfter(dayjs()) &&
                  dayjs(d.startTime).isBefore(currentTaskInDay.value?.startTime)
                );
              })
            ) {
              refreshTasks();
              return true;
            }
          }
        })
      )
    ).every((d) => !d)
  ) {
    const updateIds = updated.map((u) => u.id);
    if (tasks.value.some((t) => updateIds.includes(t.id))) {
      refreshTasks();
    }
  }
}

const off_setDoingWindowParams = backend.on_setDoingWindowParams(
  handleSetDoingWindowParams
);
const off_updateTaskInDays = backend.on_updateTaskInDays(refreshTasks);
const off_deleteTaskInDay = backend.on_deleteTaskInDay(refreshTasks);
const off_batchUpsertTasks = backend.on_batchUpsertTasks(
  handleBatchUpsertTasks
);

onBeforeUnmount(() => {
  off_setDoingWindowParams.then((d) => d());
  off_updateTaskInDays.then((d) => d());
  off_deleteTaskInDay.then((d) => d());
  off_batchUpsertTasks.then((d) => d());
});

const tasks = ref<ReadOnlyTaskWithChildren[]>([]);
const taskInDays = ref<ReadOnlyTaskInDayWithExtra[]>([]);
const taskInDaysDict = computed(() => {
  const dict: Partial<Record<string, ReadOnlyTaskInDayWithExtra>> = {};
  taskInDays.value.forEach((tid) => {
    dict[tid.taskId] = tid;
  });
  return dict;
});

async function refreshTasks() {
  const val = params.type;
  if (val === "auto-task-in-day") {
    const today = dayjs();
    taskInDays.value = [
      ...(await backend.getTaskInDays({
        search: {
          startDate: today.startOf("date").toDate().toISOString(),
          endDate: today.endOf("date").toDate().toISOString(),
          isTaskDone: false,
        },
      })),
      // 查找未来的一个任务
      ...(await backend.getTaskInDays({
        search: {
          startDate: today.add(1, "day").startOf("date").toDate().toISOString(),
          isTaskDone: false,
          take: 1,
        },
      })),
    ];
    tasks.value = (
      await Promise.all(
        taskInDays.value.map((d) => backend.getTaskById({ id: d.taskId }))
      )
    )
      .filter((t) => !!t)
      .map((t) => task2TaskWithChildren(t!));
    console.debug(taskInDays.value, "hello world");
  } else if (val === "specific-task" && params.taskId) {
    tasks.value = [await backend.getTaskById({ id: params.taskId })]
      .filter((d) => !!d)
      .map((d) => task2TaskWithChildren(d!));
  }
}
watch(
  () => params.type,
  async () => {
    await refreshTasks();
  },
  { immediate: true }
);

const now = ref(dayjs());
const inst = setInterval(() => (now.value = dayjs()), 1000);
const currentTaskInDay = computed(() => {
  if (params.type === "auto-task-in-day") {
    return taskInDays.value.find((d) =>
      now.value.isBetween(d.startTime, d.endTime)
    );
  } else {
    return null;
  }
});
const nextTaskInDay = computed(() => {
  if (params.type === "auto-task-in-day") {
    const futureTasks = taskInDays.value.filter((d) =>
      dayjs(d.startTime).isAfter(now.value)
    );
    futureTasks.sort((a, b) =>
      makeDayjsByDateTime(a.date, a.startTime).isAfter(
        makeDayjsByDateTime(b.date, b.startTime)
      )
        ? 1
        : -1
    );
    return futureTasks.length ? futureTasks[0] : null;
  } else {
    return null;
  }
});
onBeforeUnmount(() => clearInterval(inst));
const currentTask = computed<ReadOnlyTaskWithChildren | null>(() => {
  if (params.type === "auto-task-in-day") {
    return (
      tasks.value.find((t) => t.id === currentTaskInDay.value?.taskId) || null
    );
  } else if (params.type === "specific-task" && params.taskId) {
    return tasks.value.find((t) => t.id === params.taskId) || null;
  }
  return null;
});
const nextTask = computed<ReadOnlyTaskWithChildren | null>(() => {
  if (params.type === "auto-task-in-day") {
    return (
      tasks.value.find((t) => t.id === nextTaskInDay.value?.taskId) || null
    );
  } else {
    return null;
  }
});
const finalTask = computed(() => currentTask.value || nextTask.value);
onMounted(() => {
  watch(
    [params, finalTask],
    () => {
      if (finalTask.value) {
        nextTick(() => {
          setTimeout(() => {
            return backend.resizeDoingWindow({
              width: taskContentRefSize.width.value + 64,
              height: taskContentRefSize.height.value + 48,
            });
          }, 200);
        });
      }
    },
    { immediate: true }
  );
});
const finalTaskGroup = computedAsync(async () =>
  finalTask.value?.groupId
    ? await backend.getTaskGroupById({ id: finalTask.value.groupId })
    : null
);

const progressTotal = computed(() => {
  if (params.type === "auto-task-in-day") {
    return dayjs(currentTaskInDay.value?.endTime).diff(
      currentTaskInDay.value?.startTime,
      "minute"
    );
  } else {
    return null;
  }
});
const progressCurrent = computed(() => {
  if (params.type === "auto-task-in-day") {
    return now.value.diff(currentTaskInDay.value?.startTime, "minute");
  } else {
    return null;
  }
});

const isShowNextTaskTimeInfo = computed(
  () => !currentTask.value && nextTask.value
);
</script>

<template>
  <AntdProvider>
    <div
      class="v bg-bg/80 text-default relative size-full items-stretch justify-center gap-1.5 overflow-hidden rounded-lg"
      :style="
        finalTaskGroup?.color
          ? calculateTheme(finalTaskGroup.color, {
              a: 1,
              s: themeHSColorS,
              l: themeHSColorL,
            }).cssVariables
          : {}
      "
    >
      <div
        class="absolute top-0 left-0 size-full"
        v-if="progressCurrent && progressTotal"
      >
        <div
          class="bg-primary/35 absolute h-full"
          :style="{ width: (progressCurrent / progressTotal) * 100 + '%' }"
        ></div>
      </div>
      <!-- close buttons -->
      <div
        class="h absolute top-0 left-0 z-20 w-full items-center justify-between p-1 text-sm"
      >
        <div></div>
        <!-- <div
          v-if="params.type === 'auto-task-in-day'"
          class="bg-primary rounded px-1 text-white"
        >
          <RobotOutlined></RobotOutlined>
          auto
        </div>
        <div v-else></div> -->
        <div class="h items-stretch gap-2 stretch">
          <div
            class="fixed top-0 left-0 size-full"
            data-tauri-drag-region
          ></div>
          <div class="stretch"></div>
          <!-- @click="backend.popupDoingWindowMoreMenu()" -->
          <!-- <div
            class="relative z-10 bg-light-2 h hover:bg-light-3 cursor-pointer items-center rounded-lg p-1 text-sm duration-300"
          >
            <Tooltip :content="$t('switchToAutoMode')">
              <ForwardOutlined></ForwardOutlined>
            </Tooltip>
          </div> -->
          <ClickableIcon
            v-if="params.type !== 'auto-task-in-day'"
            @click="params.type = 'auto-task-in-day'"
            class="relative z-10"
            :icon="ForwardOutlined"
            :label="$t('switchToAutoMode')"
          ></ClickableIcon>
        </div>
      </div>
      <div class="stretch v z-10 items-start justify-center px-4 pb-2">
        <div
          ref="taskContentRef"
          class="v relative top-2 max-w-[240px] gap-1.5"
        >
          <template v-if="finalTask">
            <div
              v-if="!currentTask && nextTask"
              class="bg-primary self-start rounded px-2 text-sm text-white"
            >
              {{
                dayjs(nextTaskInDay!.startTime).diff(now, "minute") > 60
                  ? dayjs(nextTaskInDay!.startTime).diff(now, "hour") + "小时"
                  : dayjs(nextTaskInDay!.startTime).diff(now, "minute") + "分钟"
              }}
              后开始
            </div>
            <div class="h w-full items-center justify-between gap-2 text-sm">
              <div class="h items-center gap-2">
                <!-- <div
                  v-if="finalTaskGroup"
                  class="self-start rounded bg-[var(--theme-text-background)] px-1 text-[var(--theme-text-color)]"
                >
                  {{ finalTaskGroup.name }}
                </div> -->
                <div
                  v-if="
                    progressCurrent != null &&
                    progressTotal != null &&
                    !isShowNextTaskTimeInfo
                  "
                  class="font-semibold"
                >
                  {{ progressCurrent }} / {{ progressTotal }} min
                </div>
              </div>
              <div
                v-if="
                  progressCurrent != null &&
                  progressTotal != null &&
                  !isShowNextTaskTimeInfo
                "
              >
                {{ progressTotal - progressCurrent }}min
              </div>
            </div>
            <div class="h items-center gap-2">
              <div
                :class="[
                  'stretch',
                  finalTask.description ? 'font-semibold' : '',
                ]"
              >
                {{ finalTask.content }}
              </div>
              <!-- <div class="window-no-drag h items-center gap-1">
                <Button type="text">
                  <CheckOutlined></CheckOutlined>
                </Button>
                <div
                  @click="backend.popupDoingWindowMoreMenu(currentTask.id)"
                >
                  <MoreOutlined></MoreOutlined>
                </div>
              </div> -->
            </div>
            <TaskDescription
              v-if="finalTask.description"
              :model-value="finalTask.description"
              class="text-sm"
            >
            </TaskDescription>
          </template>
          <template v-else>
            <div class="pt-5 pl-5">任务都完成啦 ！🎉</div>
          </template>
        </div>
      </div>
    </div>
  </AntdProvider>
</template>

<style scoped></style>
