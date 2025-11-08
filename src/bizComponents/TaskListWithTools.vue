<template>
  <div class="v stretch size-full gap-3">
    <!-- <div class="pl-2">
      <DefaultTabs :tabs="tabs" v-model="currentTab"></DefaultTabs>
    </div> -->
    <div :class="['', `px-${paddingXLevel}`]">
      <div
        :class="[
          'h border-light-2 items-stretch justify-between gap-2 rounded border p-2',
          background ? `bg-light-${background + 1}` : 'bg-light',
        ]"
      >
        <div class="h items-center gap-2">
          <slot name="tools-prefix"></slot
          ><ClickableIcon
            :tooltip="$t('onlyShowLeaves')"
            :selected-tooltip="$t('showTreeStructure')"
            :selected-icon="ApartmentOutlined"
            :icon="UnorderedListOutlined"
            @click="isOnlyShowLeaves = !isOnlyShowLeaves"
            :selected="isOnlyShowLeaves"
          ></ClickableIcon>
          <!-- <ClickableIcon :icon="SearchOutlined" tooltip="搜索"></ClickableIcon> -->

          <TaskFilter
            :conditions="filterEntityKeysInTaskListWithTools"
            v-model="filterEntity"
          ></TaskFilter>
          <ClickableIcon
            :tooltip="
              isShowFinishedTasks
                ? $t('hideFinishedTasks')
                : $t('showFinishedTasks')
            "
            @click="isShowFinishedTasks = !isShowFinishedTasks"
            :icon="CheckCircleOutlined"
            :selected="isShowFinishedTasks"
          ></ClickableIcon>
          <ClickableIcon
            v-if="!finalDisableOrder"
            @click="
              () => {
                const newOrders = [...finalShowedTasks];
                newOrders.sort((a, b) => {
                  //优先 优先级
                  if (a.priority !== b.priority) {
                    return b.priority - a.priority;
                  } else {
                    return sortTasks(a, b, undefined);
                  }
                });
                return taskStore.changeOrders(newOrders);
              }
            "
            :tooltip="$t('sortByPriority')"
            :icon="ThunderboltOutlined"
          ></ClickableIcon>
          <slot name="tools-suffix"></slot>
        </div>
        <div class="h stretch items-stretch gap-2">
          <div class="stretch"></div>
          <!-- <FactorProgressBar
          class="stretch"
          :finish="finishedFactor"
          :total="totalFactor"
          hide-finish-total
        /> -->
          <!-- <Tooltip content="正在执行工作量">
          <div
            class="border-light-5 text-light h items-center gap-1 rounded border px-1 text-sm"
          >
            <AimOutlined></AimOutlined>
            <span>
              {{ pendingFactor }}
            </span>
          </div>
        </Tooltip> -->
          <Tooltip :content="$t('finishedFactor')">
            <Button
              type="text"
              @click="
                dialogs.TaskListDrawer({
                  title: $t('finishedTaskList'),
                  taskIds: finishedTasks.map((t) => t.id),
                })
              "
            >
              <div
                class="h bg-primary h-full items-center gap-1 rounded px-1 text-sm text-white"
              >
                <CheckOutlined></CheckOutlined>
                <span>
                  {{ finishedFactor }}
                </span>
              </div>
            </Button>
          </Tooltip>
          <Tooltip :content="$t('totalFactor')">
            <div
              class="border-light-5 text-light h items-center gap-1 rounded border px-1 text-sm"
            >
              <PieChartOutlined></PieChartOutlined>
              <span>
                {{ totalFactor }}
              </span>
            </div>
          </Tooltip>
          <Tooltip :content="$t('currentTaskCount')">
            <div
              class="h border-light-5 text-light items-center gap-1 rounded border px-1 text-sm"
            >
              <FileOutlined></FileOutlined>
              <div>
                {{ finalShowedTasks.length }}
              </div>
            </div>
          </Tooltip>
        </div>
      </div>
    </div>
    <div
      :class="['h items-stretch justify-between gap-2', `px-${paddingXLevel}`]"
      v-if="finalDisableOrder"
    >
      <TaskSort v-model="taskSort"></TaskSort>
      <Tooltip :content="$t('autoSortDescription')">
        <div
          :class="[
            'h border-success text-success-dark items-center gap-2 rounded border px-2 py-1 text-sm',
            `ml-${paddingXLevel}`,
          ]"
        >
          <InfoCircleOutlined></InfoCircleOutlined>
          <div>{{ $t("autoSort") }}</div>
        </div>
      </Tooltip>
    </div>
    <FilterEntityDesc
      v-model="filterEntity"
      :class="[`px-${paddingXLevel}`]"
    ></FilterEntityDesc>
    <Scrollbar
      v-if="finalShowedTasks?.length"
      class="stretch v"
      wrap-class="stretch"
      :view-class="[`px-${paddingXLevel}`]"
    >
      <TaskList
        :task-hide-group-name
        :background
        :model-value="finalShowedTasks?.slice() || []"
        :task-dropdown-hide-delete="taskDropdownHideDelete"
        @update:model-value="$emit('update:model-value', $event)"
        :disable-order="finalDisableOrder"
      >
        <template #task-tools-before-delete="d">
          <slot name="task-tools-before-delete" v-bind="d"></slot>
        </template>
      </TaskList>
    </Scrollbar>
    <Empty v-else></Empty>
  </div>
</template>
<script setup lang="ts">
import { copy } from "fast-copy";
import { dialogs } from "@/components/dialog";
import { useTaskStore } from "@/store/task";
import { ReadOnlyTaskWithChildren } from "@/types";
import {
  calculateFinishLeaveTasksFactor,
  calculatePendingLeaveTasksFactor,
  calculateTotalLeaveTasksFactor,
  filterEntityKeysInTaskListWithTools,
  sortTasks,
  useTaskListToolsOptions,
} from "@/utils/biz";
import { flatMapTree, mapTree, searchTreeAsync } from "@/utils/traverse";
import {
  ApartmentOutlined,
  CheckCircleOutlined,
  FileOutlined,
  InfoCircleOutlined,
  InfoOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
  WarningOutlined,
} from "@ant-design/icons-vue";
import {
  DefinedConditionKey,
  GetTaskFilterModelValueType,
  useValidateTaskByFilterEntity,
} from "./filter/conditions";
import { backend } from "@/utils/backend";
import { type TaskSort } from "./sort";
import { queueAsyncCall } from "@/utils/promise";

const props = defineProps<{
  modelValue: ReadOnlyTaskWithChildren[];
  background?: number;

  paddingXLevel?: number;
  taskDropdownHideDelete?: boolean;
  disableOrder?: boolean;
  taskHideGroupName?: boolean;
}>();

const _placeholder =
  "px-1 px-2 px-3 px-4 px-5 px-6 px-7 px-8 px-9 px-10 ml-1 ml-2 ml-3 ml-4 ml-5 ml-6 ml-7 ml-8 ml-9 ml-10"; // for tailwindcss class scanning

defineEmits<{
  (e: "update:model-value", val: ReadOnlyTaskWithChildren[]): void;
}>();

const validateTaskByFilterEntity = useValidateTaskByFilterEntity();

const taskSort = useLocalStorage<TaskSort>("taskListWithTools-taskSort", {
  field: "priority",
  order: "desc",
});

const taskStore = useTaskStore();
const finishedTasks = computed(() => {
  return flatMapTree(
    props.modelValue.slice(),
    (t) => ({ ...t }),
    (t) => {
      return (
        t.state === "DONE" &&
        (!t.parentId ||
          !taskStore.tasksDict[t.parentId!] ||
          taskStore.tasksDict[t.parentId!]?.state !== "DONE")
      );
    }
  );
});

const { isShowFinishedTasks, isOnlyShowLeaves, filterEntity } =
  useTaskListToolsOptions();

const showedTasks = ref<ReadOnlyTaskWithChildren[]>([]);
const refreshShowedTasks = queueAsyncCall(async function () {
  const originDatas = copy(props.modelValue);
  let finalDatas: ReadOnlyTaskWithChildren[] = [];
  // 这里的过滤顺序是matter的，要注意顺序，因为过滤后children会变，如果要判断children则可能不准确了，可能需要重新找到原来的树数据
  if (isOnlyShowLeaves.value) {
    finalDatas = flatMapTree(
      originDatas,
      (t) => ({ ...t }),
      (t) => {
        return !t.children.length;
      }
    );
  } else {
    finalDatas = originDatas;
  }
  if (!isShowFinishedTasks.value) {
    finalDatas = mapTree(finalDatas.slice(), (t) => ({ ...t }), {
      preFilter: (t) => t.state !== "DONE",
    });
  }
  // 最后需要过滤filterEntity, children会变
  showedTasks.value = await searchTreeAsync(finalDatas.slice(), async (t) =>
    validateTaskByFilterEntity(t, filterEntity.value)
  );
});

const finalShowedTasks = computed(() => {
  const tasks = showedTasks.value.slice();
  tasks.sort((a, b) =>
    sortTasks(a, b, finalDisableOrder.value ? taskSort.value : undefined)
  );
  return tasks;
});

watch(
  [() => props.modelValue, isOnlyShowLeaves, isShowFinishedTasks, filterEntity],
  () => {
    refreshShowedTasks();
  },
  { immediate: true, deep: true }
);

// 补充任务的更新、上面是array的更新
// backend.on_batchUpsertTasks((_, updates) => {
//   updates.forEach((u) => {
//     const t = showedTasks.value.find((t) => t.id === u.id)
//     if (t) {
//       Object.assign(t, { ...u, children: t.children })
//     }
//   })
// })
(async () => {
  const off_updateTaskInDays =
    await backend.on_updateTaskInDays(refreshShowedTasks);
  const off_deleteTaskInDay =
    await backend.on_deleteTaskInDay(refreshShowedTasks);
  const off_createTaskInDay =
    await backend.on_createTaskInDay(refreshShowedTasks);
  onBeforeUnmount(() => {
    off_updateTaskInDays();
    off_deleteTaskInDay();
    off_createTaskInDay();
  });
})();

const pendingFactor = computed(() =>
  calculatePendingLeaveTasksFactor(props.modelValue.slice())
);
const finishedFactor = computed(() =>
  calculateFinishLeaveTasksFactor(props.modelValue.slice())
);
const totalFactor = computed(() =>
  calculateTotalLeaveTasksFactor(props.modelValue.slice())
);

const finalDisableOrder = computed(() => {
  return (
    props.disableOrder ||
    isShowFinishedTasks.value ||
    isOnlyShowLeaves.value ||
    !!Object.keys(filterEntity.value).length
  );
});
</script>
