<template>
  <div class="stretch v size-full">
    <!-- <div :class="[`px-${paddingX} h justify-between text-sm`]">
      <div>
        <MonthPicker v-model="month"> </MonthPicker>
      </div>
      <div class="h items-center gap-2">
        <Button>hello</Button>
      </div>
    </div> -->
    <div class="v stretch gap-3">
      <div :class="[`px-${paddingX}`, 'h items-center justify-between gap-2']">
        <div class="w-[160px]">
          <MonthPicker v-model="month"> </MonthPicker>
          <!-- {{ month.format("YYYY 年 MM 月") }} -->
        </div>
        <div class="h items-center gap-2">
          <FilterEntityDesc
            :model-value="filterEntity"
            :class="[`px-${paddingX}`]"
          ></FilterEntityDesc>
          <TaskFilter
            v-model="filterEntity"
            :conditions="[
              'group',
              'view',
              'hasChildren',
              'contentAndDescription',
              // 'priority',
            ]"
          ></TaskFilter>
          <TaskSort v-model="taskSort"> </TaskSort>
        </div>
      </div>
      <Scrollbar class="stretch" :view-class="[`px-${paddingX}`]">
        <Calendar :month="month" class="bg-light-2">
          <template #weekday="{ weekdayCH }">
            <div :class="['bg-light-3 p-2 text-center']">
              {{ weekdayCH }}
            </div>
          </template>
          <template #default="{ date, isToday, d }">
            <BizDrop
              channel="move-tasks"
              @drop="(c, data) => c === 'move-tasks' && handleDrop(data, d)"
              #default="{ isDroppingActive, isDragging, setRef }"
            >
              <div
                :ref="setRef"
                :class="[
                  'drop-area relative flex h-full min-h-[104px] flex-col',
                  isDroppingActive ? 'dropping-active' : '',
                ]"
                @mouseenter="handleModifyingDate(d)"
              >
                <div
                  :class="[
                    'relative p-1 px-4 text-center text-sm',
                    isToday ? 'bg-primary text-white' : 'bg-light-3',
                  ]"
                >
                  <div
                    :class="[
                      'absolute top-0 left-0 h-full w-1',
                      isToday ? '' : 'bg-light-4',
                    ]"
                  ></div>
                  {{ date }}
                  <!-- {{ isToday ? $t("day.today") : "" }} -->
                </div>
                <div
                  :class="[
                    'stretch flex flex-col gap-1 py-1',
                    //   isToday ? 'bg-light-4' : '',
                  ]"
                >
                  <Scope
                    v-for="(_, i) in new Array(
                      Math.max(
                        ...Object.keys(tasksInDate[date] || { 0: '' }).map(
                          (d) => (isNaN(+d) ? 0 : +d)
                        )
                      ) + 1
                    ).fill(0)"
                    :key="i"
                    :d="{
                      ...tasksInDate[date]?.[i],
                      taskGroup:
                        taskGroupStore.taskGroupsDict[
                          tasksInDate[date]?.[i]?.task.groupId!
                        ],
                    }"
                    v-slot:default="{
                      task,
                      startDate,
                      isDone,
                      endDate,
                      taskGroup,
                    }"
                  >
                    <BizDrag
                      :drag-datas="
                        () => [
                          {
                            type: 'move-tasks',
                            datas: [task],
                          },
                          {
                            type: `move-tasks-${task?.groupId}`,
                            datas: [task],
                          },
                        ]
                      "
                      #default="{ setRef }"
                    >
                      <TaskToolsDropdown :task hide-delete>
                        <!-- <template #start>
                          <ToolItem
                            :icon="AimOutlined"
                            tooltip="在列表中定位到这个任务"
                            @click="defaultEvent.emit('focusTask', task!)"
                          ></ToolItem>
                        </template> -->
                        <template v-if="task" #before-delete>
                          <ToolItem
                            @click="
                              () =>
                                taskStore.updateTaskById(task.id, {
                                  startAt: null,
                                  endAt: null,
                                })
                            "
                            :tooltip="$t('removeFromCalendar')"
                            :icon="CloseOutlined"
                            danger
                          ></ToolItem>
                        </template>
                        <template #default>
                          <!-- <Tooltip
                            :content="
                              isModifying || isDragging ? '' : task?.content
                            "
                          > -->
                          <div
                            :ref="setRef"
                            :title="task?.content"
                            @mouseenter="currentHover = task?.id"
                            @mouseleave="currentHover = undefined"
                            :class="[
                              'relative h-[32px] overflow-hidden px-4 text-sm leading-[32px] duration-300',
                              task?.state === 'UNDONE' ? '' : 'opacity-30!',
                              isModifying && isModifyingId !== task?.id
                                ? 'opacity-30'
                                : '',
                              currentHover && currentHover !== task?.id
                                ? 'opacity-75'
                                : '',
                              // 圆角
                              // date === startDate || date === 1
                              // 	? 'rounded-tl rounded-bl'
                              // 	: '',
                              // date === endDate ? 'rounded-tr rounded-br' : '',
                            ]"
                            :style="{
                              ...(taskGroup?.color
                                ? calculateTheme(taskGroup.color, {
                                    a: 1,
                                    s: themeHSColorS,
                                    l: themeHSColorL,
                                  }).cssVariables
                                : {}),
                              ...(task?.id
                                ? {
                                    // '--color': 'hsl(var(--value), 45%, 85%)',
                                    background: 'var(--bg)',
                                    color: 'var(--text-default)',
                                    cursor: 'pointer',
                                  }
                                : {}),
                              // ...(task?.id &&
                              // (currentHover === task?.id ||
                              //   task.id === isModifyingId)
                              //   ? {
                              //       background: 'var(--bg-a60)',
                              //       // color: 'white',
                              //     }
                              //   : {}),
                            }"
                          >
                            <!-- 调整长短pplaceholder -->
                            <div
                              v-if="task && date === startDate"
                              @mousedown="
                                handleStartModifyStartDate($event, task)
                              "
                              class="absolute top-0 left-0 h-full w-3 cursor-w-resize"
                            ></div>
                            <!-- @mousemove="handleModifyingEndDate($event, task)" -->
                            <div
                              v-if="task && date === endDate"
                              @mousedown="
                                handleStartModifyEndDate($event, task)
                              "
                              class="absolute top-0 right-0 h-full w-2 cursor-e-resize"
                            ></div>
                            <div
                              v-if="date === startDate"
                              class="flex items-center gap-2"
                            >
                              <div
                                class="absolute top-1/2 left-0 h-full w-1 translate-y-[-50%] bg-[var(--theme)]"
                              ></div>
                              <div
                                :class="[
                                  'truncate',
                                  isDone ? 'line-through' : '',
                                ]"
                              >
                                {{ task?.content }}
                              </div>
                            </div>
                            <!-- 上面是连续多天的任务的头部、后面是尾部、然后如果跨周了，头部需要显示任务的内容 -->
                            <div
                              v-else-if="
                                d.week() !== dayjs(startDate).week() &&
                                // 国际惯例 0 是周日
                                // 如果是周日开始，则是0 周一开始则是1
                                d.day() === 1
                              "
                              class="flex items-center gap-2"
                            >
                              <div
                                :class="[
                                  'truncate',
                                  isDone ? 'line-through' : '',
                                ]"
                              >
                                {{ task?.content }}
                              </div>
                            </div>
                          </div>
                          <!-- </Tooltip> -->
                        </template>
                      </TaskToolsDropdown>
                    </BizDrag>
                  </Scope>
                </div>
              </div>
            </BizDrop>
          </template>
        </Calendar>
      </Scrollbar>
    </div>
    <!-- <TaskPageFooter>
      <ClickableIcon :icon="SettingOutlined"></ClickableIcon>
    </TaskPageFooter> -->
  </div>
</template>
<script setup lang="ts">
import {
  motionDelay,
  motionTranslateX,
  themeHSColorL,
  themeHSColorS,
} from "@/const";
import { useTaskStore } from "@/store/task";
import { useTaskGroupStore } from "@/store/taskGroup";
import { ReadOnlyTaskWithChildren, StringArrayToUnion } from "@/types";
import { calculateTheme } from "@/utils/color";
import { CloseOutlined } from "@ant-design/icons-vue";
import type { Task } from "@/types";
import dayjs, { Dayjs } from "dayjs";
import { DragData } from "./drag/drag";
import {
  DefinedConditionKey,
  GetTaskFilterModelValueType,
  useValidateTaskByFilterEntity,
} from "./filter/conditions";
import { type TaskSort } from "./sort";
import { sortTasks } from "@/utils/biz";

defineProps<{
  paddingX?: number;
}>();

const month = ref(dayjs());
const taskSort = ref<TaskSort>({
  field: "groupId",
  order: "asc",
});

const filterKeys = [
  "group",
  "view",
  "hasChildren",
  "contentAndDescription",
  // "priority",
] satisfies DefinedConditionKey[];
const filterEntity = useLocalStorage<
  GetTaskFilterModelValueType<StringArrayToUnion<typeof filterKeys>>
>("taskCalendar-filterEntity", {});

const taskStore = useTaskStore();
const taskGroupStore = useTaskGroupStore();
const validateTaskByFilterEntity = useValidateTaskByFilterEntity();

const inMonthTasks = computed(() => {
  return taskStore.flatTasks.filter((t) => {
    // !t.children.length &&
    return (
      dayjs(t.startAt).startOf("month").isSame(month.value.startOf("month")) ||
      dayjs(t.endAt).startOf("month").isSame(month.value.startOf("month"))
    );
  });
});

const { state: tasks, execute: refreshTasks } = useAsyncState(async () => {
  const ret = await Promise.all(
    inMonthTasks.value.map(async (t) => {
      // 应用过滤
      if (Object.keys(filterEntity.value).length > 0) {
        const isValid = await validateTaskByFilterEntity(t, filterEntity.value);
        return isValid ? t : null;
      } else {
        return t;
      }
    })
  ).then((datas) => datas.filter((d) => !!d).map((d) => d!));
  return ret;
}, []);

watch(inMonthTasks, () => refreshTasks());
// month改变时需要tasks清空、否则在切换月份时因为要渲染上个月的任务而导致卡顿。
watch([month, filterEntity], () => refreshTasks(), {
  immediate: true,
  deep: true,
});

const monthBeginDate = computed(() => month.value.startOf("month"));
const monthEndDate = computed(() => month.value.endOf("month"));
const maxDate = computed(() => monthEndDate.value.date());
const tasksInDate = computed(() => {
  const map: Partial<
    Record<
      number,
      Partial<
        Record<
          number,
          {
            task: ReadOnlyTaskWithChildren;
            startDate: number;
            endDate: number;
            isDone: boolean;
          }
        >
      >
    >
  > = {};

  tasks.value.sort((a, b) => {
    // 先对state进行排序
    // const stateA = a.state
    // const stateB = b.state
    // if (stateA !== stateB) {
    //   return stateA === "UNDONE" ? 1 : -1
    // } else {
    return sortTasks(a, b, taskSort.value);
    // }
  });
  tasks.value.forEach((t) => {
    if (t.startAt || t.endAt) {
      const startDate = t.startAt
        ? dayjs(t.startAt).isAfter(monthBeginDate.value)
          ? dayjs(t.startAt).startOf("day").date()
          : 1
        : dayjs(t.endAt).startOf("day").date();
      const isEndDateInMonth = dayjs(t.endAt).month() === month.value.month();
      const endDate = t.endAt
        ? isEndDateInMonth
          ? dayjs(t.endAt).endOf("day").date()
          : isEndDateInMonth
            ? dayjs().startOf("day").date()
            : maxDate.value
        : startDate;
      const offset = endDate - startDate + 1;
      if (offset > 0) {
        const searchLayer = (start: number, end: number, current = 0) => {
          if (
            new Array(offset).fill(0).every((_, ind) => {
              const i = startDate + ind;
              if (!map[i]) {
                map[i] = {};
              } else {
                return !map[i][current];
              }
              return true;
            })
          ) {
            return current;
          } else {
            return searchLayer(start, end, current + 1);
          }
        };
        const layer = searchLayer(startDate, endDate);
        new Array(offset).fill(0).forEach((_, ind) => {
          const i = startDate + ind;
          if (!map[i]) {
            map[i] = {};
          }
          map[i][layer] = {
            task: t,
            startDate,
            endDate,
            isDone: t.state === "DONE",
          };
        });
      } else {
        console.warn("offset < 0: ", offset, t, startDate, endDate);
      }
    }
  });
  return map;
});

const currentHover = ref<string>();

let originalDate: Date | null | undefined = undefined;
// 如果调整startDate 时候endDate为空、则设置endDate为当天
let isOriginalEndDateNull = false;
// 结束的时候是异步的，所以需要一个同步的判断符
let _isModifyingDate = false;
const isModifyingEndDateTask = ref<Task>();
const isModifyingStartDateTask = ref<Task>();
const isModifying = computed(
  () => !!(isModifyingEndDateTask.value || isModifyingStartDateTask.value)
);
const isModifyingId = computed(
  () => isModifyingEndDateTask.value?.id || isModifyingStartDateTask.value?.id
);

function handleStartModifyEndDate(e: MouseEvent, task: Task) {
  _isModifyingDate = true;
  isModifyingEndDateTask.value = task;
  originalDate = task.endAt ? new Date(task.endAt) : undefined;
  e.preventDefault();
}
function handleStartModifyStartDate(e: MouseEvent, task: Task) {
  _isModifyingDate = true;
  isModifyingStartDateTask.value = task;
  originalDate = task.startAt ? new Date(task.startAt) : undefined;
  isOriginalEndDateNull = !task.endAt;
  task.endAt =
    (isOriginalEndDateNull ? originalDate?.toISOString() : task.endAt) ?? null;
  e.preventDefault();
}
function handleModifyingDate(toD: Dayjs) {
  if (_isModifyingDate) {
    if (isModifyingEndDateTask.value) {
      const startAtDate = isModifyingEndDateTask.value.startAt
        ? dayjs(isModifyingEndDateTask.value.startAt).startOf("day")
        : null;
      if (
        (startAtDate && toD.isSame(startAtDate)) ||
        toD.isAfter(startAtDate)
      ) {
        isModifyingEndDateTask.value.endAt = toD.toDate().toISOString();
      }
    }
    if (isModifyingStartDateTask.value) {
      const endAtDate = isModifyingStartDateTask.value.endAt
        ? dayjs(isModifyingStartDateTask.value.endAt).startOf("day")
        : null;
      if (endAtDate && (toD.isSame(endAtDate) || toD.isBefore(endAtDate))) {
        isModifyingStartDateTask.value.startAt = toD.toDate().toISOString();
      }
    }
  }
}

async function handleEndModifyDate() {
  if (
    _isModifyingDate &&
    isModifyingEndDateTask.value &&
    (isModifyingEndDateTask.value.endAt
      ? new Date(isModifyingEndDateTask.value.endAt).getDate()
      : undefined) !== originalDate?.getDate()
  ) {
    _isModifyingDate = false;
    await taskStore
      .updateTaskById(isModifyingEndDateTask.value.id, {
        endAt: isModifyingEndDateTask.value.endAt,
      })
      .catch((err) => {
        console.error(err);
        isModifyingEndDateTask.value!.endAt =
          originalDate?.toISOString() ?? null;
      });
  }
  if (
    isModifyingStartDateTask.value &&
    (isModifyingStartDateTask.value.startAt
      ? new Date(isModifyingStartDateTask.value.startAt).getDate()
      : undefined) !== originalDate?.getDate()
  ) {
    _isModifyingDate = false;
    await taskStore
      .updateTaskById(isModifyingStartDateTask.value.id, {
        startAt: isModifyingStartDateTask.value.startAt,
        ...(isOriginalEndDateNull
          ? {
              endAt: isModifyingStartDateTask.value.endAt,
            }
          : {}),
      })
      .catch((err) => {
        console.error(err);
        isModifyingStartDateTask.value!.startAt =
          originalDate?.toISOString() ?? null;
        if (isOriginalEndDateNull) {
          isModifyingStartDateTask.value!.endAt = null;
        }
      });
  }
  isModifyingEndDateTask.value = undefined;
  isModifyingStartDateTask.value = undefined;
  originalDate = undefined;
  isOriginalEndDateNull = false;
}
window.addEventListener("mouseup", handleEndModifyDate);
onUnmounted(() => window.removeEventListener("mouseup", handleEndModifyDate));

function handleDrop(data: DragData<any>, d: Dayjs) {
  return Promise.all(
    (data.datas as ReadOnlyTaskWithChildren[]).slice().map(async (t) => {
      let startAt = d.toDate();
      const offset = t.startAt ? d.diff(t.startAt, "day") : 0;
      let endAt = !t.endAt
        ? d.toDate()
        : dayjs(t.endAt).add(offset, "day").toDate();
      await taskStore.updateTaskById(t.id, {
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
      });
    })
  );
}
// const { t } = useI18n()
// const sidebarTabs = computed(() =>
//   getTabs({
//     pending: t("calendarPage.pendingTasks"),
//     expired: t("calendarPage.expiredTasks"),
//   }),
// )
// const currentSidebarTab =
//   ref<(typeof sidebarTabs.value)[number]["id"]>("pending")
</script>

<style lang="css" scoped>
/* @reference "../styles/index.css"; */
</style>
