<template>
  <TaskToolsDropdown
    :task="modelValue"
    :placement="dropdownPlacement"
    :hide-delete="dropdownHideDelete"
  >
    <template #default>
      <div
        :class="[
          'group relative rounded border p-2 pr-1 pl-3',
          modelValue.priority >= highTaskPriority
            ? 'outline-urgent outline-2 -outline-offset-2 outline-dashed'
            : '',
          modelValue.state === 'DONE'
            ? `border-light-${background + 2} bg-bg rounded hover:${bgColor1}`
            : `${bgColor1} hover:${bgColor2} border-light-${background + 1}`,
          isFinished ? 'opacity-60' : '',
        ]"
        :style="theme.cssVariables"
      >
        <div class="v gap-1">
          <div
            v-if="(taskGroup && !hideGroupName) || parents.length > 0"
            :class="['text-light self-start rounded px-1 py-0.5 text-xs']"
          >
            <template v-if="taskGroup && !hideGroupName">
              <span
                class="mr-1 rounded bg-[var(--theme-text-background)] px-1.5 text-[var(--theme-text-color)]"
              >
                {{ taskGroup.name }}
              </span>
              <template v-if="!!parents.length">/</template>
            </template>
            {{ parents.map((p) => p.content).join(" / ") }}
          </div>
          <div class="h size-full items-stretch gap-2">
            <div class="v stretch z-10 items-stretch gap-2">
              <div class="v gap-1">
                <div class="h items-center gap-2">
                  <slot v-if="$slots.beforeContent" name="beforeContent"></slot>
                  <!-- <MoreOutlined
                  class="cursor-pointer opacity-0 group-hover:opacity-100"
                ></MoreOutlined> -->
                  <div
                    :class="[
                      'h leading-multi cursor-pointer items-stretch gap-2 text-lg',
                      modelValue.description ? 'font-semibold' : '',
                      isFinished ? 'line-through' : '',
                    ]"
                  >
                    <Checkbox
                      @click.stop
                      class="relative -top-[1px]"
                      :model-value="modelValue.state === 'DONE'"
                      @update:model-value="
                        taskStore.toggleTaskState(modelValue.id)
                      "
                    ></Checkbox>
                    <div>
                      {{ modelValue.content }}
                    </div>
                  </div>
                </div>
                <div
                  @click.stop="handleEditDescription(modelValue)"
                  v-if="modelValue.description"
                  class="_default-attr"
                >
                  <!-- <Button type="text">
                  <BookOutlined></BookOutlined>
                </Button> -->
                  <TaskDescription
                    :title="modelValue.description"
                    :model-value="modelValue.description"
                    class="line-clamp-6"
                  >
                  </TaskDescription>
                </div>
              </div>
              <!-- modelValue.description || -->
              <div
                class="v items-stretch gap-0.5"
                v-if="
                  modelValue.taskViewTasks.length ||
                  modelValue.target ||
                  modelValue.factor > defaultTaskFactor ||
                  modelValue.priority !== defaultTaskPriority ||
                  modelValue.startAt ||
                  modelValue.endAt ||
                  modelValue.nextTask ||
                  hasRealChildren
                "
              >
                <!-- 任务添加到的视图 -->
                <div
                  v-for="t in modelValue.taskViewTasks"
                  class="_default-attr"
                >
                  <Button type="text">
                    <icon
                      :icon="
                        taskViewStore.viewsDict[t.taskViewId]?.icon ??
                        defaultTaskViewIcon('ALTERNATIVE')
                      "
                    ></icon>
                  </Button>
                  <div>{{ taskViewStore.viewsDict[t.taskViewId]?.name }}</div>
                </div>
                <!-- 任务target -->
                <div
                  v-if="modelValue.target != null"
                  @click.stop="handleEditTaskTarget(modelValue)"
                  class="_default-attr"
                >
                  <Button type="text">
                    <AimOutlined></AimOutlined>
                  </Button>

                  <div class="w-[64px]" v-if="taskRecords.length > 1">
                    <FactorProgressBar
                      :finish="targetFinished"
                      :total="targetTotal"
                      hide-finish-total
                      :hue="taskGroup?.color"
                    ></FactorProgressBar>
                  </div>
                  <div>
                    {{ isNaN(latestRecordValue) ? "_" : latestRecordValue }}
                    /
                    {{ modelValue.target }}
                  </div>
                </div>
                <div
                  v-if="modelValue.factor > defaultTaskFactor && canEditFactor"
                  @click.stop="handleEditFactor(modelValue)"
                  class="_default-attr"
                >
                  <Button type="text">
                    <PieChartOutlined></PieChartOutlined>
                  </Button>
                  <div class="text-light">
                    {{ modelValue.factor }}
                  </div>
                </div>
                <div
                  v-if="modelValue.priority !== defaultTaskPriority"
                  @click.stop="handleEditPriority(modelValue)"
                  :class="[
                    '_default-attr',
                    modelValue.priority >= highTaskPriority
                      ? '!text-urgent'
                      : '',
                  ]"
                >
                  <Button
                    type="text"
                    :class="[
                      modelValue.priority >= highTaskPriority
                        ? '!text-urgent'
                        : '',
                    ]"
                  >
                    <ThunderboltOutlined></ThunderboltOutlined>
                  </Button>
                  <div>
                    {{ modelValue.priority }}
                  </div>
                </div>
                <!-- 子任务factor完成进度 -->
                <Scope
                  v-if="hasRealChildren"
                  :d="{
                    finish: calculateFinishLeaveTasksFactor(
                      // 如果使用modelValue.children可能数据不正确、因为modelValue不一定是原始数据，可能有不一样的children值
                      realChildren.slice()
                    ),
                    total: calculateTotalLeaveTasksFactor(realChildren.slice()),
                  }"
                  #default="{ finish, total }"
                >
                  <FactorProgressBar
                    v-if="taskGroup"
                    :hue="taskGroup.color"
                    class="self-stretch"
                    :total
                    :finish
                  >
                  </FactorProgressBar>
                </Scope>
                <div
                  class="_default-attr group/date-range"
                  v-if="modelValue.startAt || modelValue.endAt"
                  @click.stop="handleEditDateRange(modelValue)"
                >
                  <Button type="text">
                    <ClockCircleOutlined></ClockCircleOutlined>
                  </Button>
                  <DateRangeDesc
                    :start-at="modelValue.startAt"
                    :end-at="modelValue.endAt"
                    :hide-countdown="isFinished"
                  ></DateRangeDesc>
                  <Tooltip content="清空日期">
                    <Button
                      @click.stop="
                        taskStore.updateTaskById(modelValue.id, {
                          startAt: null,
                          endAt: null,
                        })
                      "
                      type="text"
                      danger
                      class="opacity-0 duration-300 group-hover/date-range:opacity-100"
                    >
                      <DeleteOutlined></DeleteOutlined>
                    </Button>
                  </Tooltip>
                </div>
                <div
                  v-if="modelValue.nextTask"
                  class="_default-attr"
                  @click.stop="handleEditNextTask(modelValue)"
                >
                  <Button type="text">
                    <ReloadOutlined></ReloadOutlined>
                  </Button>
                  <div>
                    每{{ modelValue.nextTask.a }}天
                    <template v-if="modelValue.nextTask.b > 1">
                      （休息间隔 {{ modelValue.nextTask.b }}）
                    </template>
                    <span class="text-sm">
                      已循环 {{ modelValue.createIndex }} 次
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div class="relative top-0.5">
              <div
                :class="[
                  'cursor-pointer rounded px-0.5 opacity-0 duration-300 group-hover:opacity-100',
                  background === 1 ? 'hover:bg-light-3' : '',
                  background === 2 ? 'hover:bg-light-4' : '',
                  background === 3 ? 'hover:bg-light-5' : '',
                  background === 4 ? 'hover:bg-light-6' : '',
                ]"
              >
                <MoreOutlined></MoreOutlined>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template #before-delete="d">
      <slot name="task-tools-before-delete" v-bind="d"></slot>
    </template>
  </TaskToolsDropdown>
</template>
<script setup lang="ts">
import {
  defaultTaskFactor,
  defaultTaskPriority,
  defaultTaskViewIcon,
  highTaskPriority,
  themeHSColorL,
  themeHSColorS,
} from "@/const";
import { useTaskStore } from "@/store/task";
import {
  DropdownPlacement,
  ReadOnlyTaskWithChildren,
  TaskTargetRecord,
} from "@/types";
import {
  calculateFinishLeaveTasksFactor,
  calculateTotalLeaveTasksFactor,
} from "@/utils/biz";
import {
  AimOutlined,
  BookOutlined,
  ClockCircleOutlined,
  MoreOutlined,
  PieChartOutlined,
  ReloadOutlined,
  TagOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons-vue";
import {
  handleEditDateRange,
  handleEditDescription,
  handleEditFactor,
  handleEditNextTask,
  handleEditPriority,
  handleEditTaskTarget,
  useTaskState,
} from "@/types/biz/task";
import { useTaskViewStore } from "@/store/taskView";
import { useTaskGroupStore } from "@/store/taskGroup";
import { useTheme } from "@/utils/color";
import { backend } from "@/utils/backend";

const props = withDefaults(
  defineProps<{
    modelValue: ReadOnlyTaskWithChildren;

    background?: number;
    dropdownPlacement?: DropdownPlacement;
    dropdownHideDelete?: boolean;
    hideGroupName?: boolean;
  }>(),
  {
    background: 1,
    dropdownPlacement: "topLeft",
  }
);

const taskStore = useTaskStore();
const taskGroupStore = useTaskGroupStore();
const parents = computed(() => {
  const ps = [];
  let p = taskStore.tasksDict[props.modelValue.parentId!];
  while (p) {
    ps.unshift(p);
    p = taskStore.tasksDict[p.parentId!];
  }
  return ps;
});
const taskGroup = computed(
  () => taskGroupStore.taskGroupsDict[props.modelValue.groupId]
);

const bgColor1 = computed(() => `bg-light-${props.background}`);
const bgColor2 = computed(() => `bg-light-${props.background + 1}`);
const bgColor3 = computed(() => `bg-light-${props.background + 2}`);

// 确保会编译上
const _ =
  "bg-light-1 bg-light-2 bg-light-3 bg-light-4 bg-light-5 bg-light-6 hover:bg-light-1 hover:bg-light-2 hover:bg-light-3 hover:bg-light-4 hover:bg-light-5 hover:bg-light-6";
const __ =
  "border-light-1 border-light-2 border-light-3 border-light-4 border-light-5 border-light-6 hover:border-light-1 hover:border-light-2 hover:border-light-3 hover:border-light-4 hover:border-light-5 hover:border-light-6";

const taskViewStore = useTaskViewStore();
const { canEditFactor } = useTaskState(computed(() => props.modelValue));
const isFinished = computed(() => props.modelValue.state === "DONE");
const realChildren = computed(
  () => taskStore.tasksDict[props.modelValue.id]?.children || []
);
const hasRealChildren = computed(() => !!realChildren.value.length);

const theme = useTheme(
  computed(() => taskGroup.value?.color),
  {
    a: 1,
    s: themeHSColorS,
    l: themeHSColorL,
  }
);

const taskRecords = ref<TaskTargetRecord[]>([]);
async function refreshTaskRecords() {
  if (props.modelValue.target != null) {
    taskRecords.value = await backend.getTaskTargetRecords({
      search: { taskId: props.modelValue.id },
    });
  } else {
    taskRecords.value = [];
  }
}
watch(() => props.modelValue.id, refreshTaskRecords, { immediate: true });
const off_batchUpsertTaskTargetRecords =
  backend.on_batchUpsertTaskTargetRecords(refreshTaskRecords);
const off_deleteTaskTargetRecords =
  backend.on_deleteTaskTargetRecords(refreshTaskRecords);
onBeforeUnmount(() => {
  off_batchUpsertTaskTargetRecords.then((d) => d());
  off_deleteTaskTargetRecords.then((d) => d());
});
const latestRecordValue = computed(() => {
  if (props.modelValue.targetType === "DEFAULT") {
    return +taskRecords.value?.[0]?.value;
  } else {
    return taskRecords.value.reduce((sum, r) => sum + +r.value, 0);
  }
});
const targetTotal = computed(() => {
  if (props.modelValue.target) {
    if (props.modelValue.targetType === "DEFAULT") {
      return Math.max(
        ...taskRecords.value.map((r) =>
          Math.abs(+r.value - +props.modelValue.target!)
        )
      );
    } else {
      // 增量
      return +props.modelValue.target;
    }
  } else {
    return 0;
  }
});
const targetFinished = computed(() => {
  if (props.modelValue.target) {
    if (props.modelValue.targetType === "DEFAULT") {
      return (
        targetTotal.value -
        Math.abs(latestRecordValue.value - +props.modelValue.target!)
      );
    } else {
      return latestRecordValue.value;
    }
  } else {
    return 0;
  }
});
</script>

<style scoped>
@reference "../styles/index.css";

._default-attr {
  @apply text-light flex cursor-pointer items-center gap-2 self-start text-sm;
}
</style>
