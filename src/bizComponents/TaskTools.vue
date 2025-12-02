<template>
  <Tools v-if="realTask">
    <slot name="start"></slot>
    <div class="h items-center gap-2">
      <Tooltip
        :content="$t('editContent')"
        :visible-disable-controller="tooltipVisibleDisabledController"
      >
        <Button
          type="text"
          @click="
            dialogs
              .TextareaDialog({
                title: $t('editContent'),
                value: realTask.content,
              })
              .finishPromise((d) => {
                return taskStore.updateTaskById(realTask!.id, {
                  content: d,
                });
              })
          "
        >
          <EditOutlined></EditOutlined>
        </Button>
      </Tooltip>
      <Tooltip
        :content="$t('editSubTask')"
        :visible-disable-controller="tooltipVisibleDisabledController"
      >
        <Button
          type="text"
          @click="dialogs.EditSubTaskDialog({ taskId: realTask.id })"
        >
          <UnorderedListOutlined></UnorderedListOutlined>
        </Button>
      </Tooltip>
      <Tooltip
        :content="$t('editDescription')"
        :visible-disable-controller="tooltipVisibleDisabledController"
      >
        <Button type="text" @click="handleEditDescription(task)">
          <BookOutlined></BookOutlined>
        </Button>
      </Tooltip>

      <!-- <Tooltip content="编辑时间"> -->
      <DefaultDropdownMenu
        :menus="[
          {
            name: $t('today'),
            click: () =>
              taskStore.updateTaskById(realTask!.id, {
                startAt: dayjs().startOf('day').toDate().toISOString(),
                endAt: realTask?.endAt ? null : undefined,
              }),
          },
          {
            name: $t('tomorrow'),
            click: () =>
              taskStore.updateTaskById(realTask!.id, {
                startAt: dayjs()
                  .add(1, 'day')
                  .startOf('day')
                  .toDate()
                  .toISOString(),
              }),
          },
          {
            name: $t('dayAfterTomorrow'),
            click: () =>
              taskStore.updateTaskById(realTask!.id, {
                startAt: dayjs()
                  .add(2, 'day')
                  .startOf('day')
                  .toDate()
                  .toISOString(),
              }),
          },
          {
            name: $t('clearDate'),
            danger: true,
            click: () =>
              taskStore.updateTaskById(realTask!.id, {
                startAt: null,
                endAt: null,
              }),
          },
        ]"
      >
        <Button type="text" @click="handleEditDateRange(task)">
          <ClockCircleOutlined></ClockCircleOutlined>
        </Button>
      </DefaultDropdownMenu>
      <!-- </Tooltip> -->

      <Tooltip
        :title="$t('factor')"
        v-if="canEditFactor"
        :visible-disable-controller="tooltipVisibleDisabledController"
      >
        <DefaultDropdownMenu
          :menus="
            [defaultTaskFactor, 2, 3, 4, 5].map((d) => ({
              name:
                d.toString() +
                (d === defaultTaskFactor ? `(${$t('default')})` : ''),
              click: () => updateFactor(task, d),
              icon: PieChartOutlined,
            }))
          "
        >
          <Button type="text" @click="handleEditFactor(task)">
            <PieChartOutlined></PieChartOutlined>
          </Button>
        </DefaultDropdownMenu>
      </Tooltip>
      <Tooltip
        :title="$t('priority')"
        :visible-disable-controller="tooltipVisibleDisabledController"
      >
        <DefaultDropdownMenu
          :menus="[
            {
              name: `${$t('high')} (${highTaskPriority})`,
              click: () => updatePriority(task, highTaskPriority),
              icon: ThunderboltOutlined,
              danger: true,
            },
            {
              name: `${$t('medium')} (${defaultTaskPriority} ${$t('default')})`,
              click: () => updatePriority(task, defaultTaskPriority),
              icon: ThunderboltOutlined,
            },
            {
              name: `${$t('low')} (0)`,
              click: () => updatePriority(task, 0),
              icon: ThunderboltOutlined,
            },
          ]"
        >
          <Button type="text" @click="handleEditPriority(task)">
            <ThunderboltOutlined></ThunderboltOutlined>
          </Button>
        </DefaultDropdownMenu>
      </Tooltip>
      <ToolItem
        :tooltip="$t('targetValue')"
        :icon="AimOutlined"
        :visible-disable-controller="tooltipVisibleDisabledController"
        @click="handleEditTaskTarget(task)"
        :menus="[
          {
            name: $t('autoSetTargetByContent'),
            click: () => {
              let ret = /\d+/.exec(realTask?.content || '')?.[0];
              let finalRet = !isNaN(+ret!) ? +ret! : undefined;
              if (finalRet) {
                return taskStore.updateTaskById(realTask!.id, {
                  target: finalRet.toString(),
                });
              } else {
                dialogs.MessageDialog({
                  content: $t('detectTargetFailed'),
                });
              }
            },
          },
        ]"
      ></ToolItem>
      <!-- <Tooltip
        :title="$t('targetValue')"
        :visible-disable-controller="tooltipVisibleDisabledController"
      >
        <Button type="text" @click="handleEditTaskTarget(task)">
          <AimOutlined></AimOutlined>
        </Button>
      </Tooltip> -->
      <Tooltip
        :content="$t('moveTo')"
        :visible-disable-controller="tooltipVisibleDisabledController"
      >
        <Button
          type="text"
          @click="
            dialogs
              .SelectTaskDialog({
                groupSelectable: true,
                self: realTask,
              })
              .finishPromise((d) => {
                if (d) {
                  return taskStore.updateTaskParent(realTask!.id, d.taskId, {
                    groupId: d.groupId,
                  });
                }
              })
          "
        >
          <DragOutlined></DragOutlined>
        </Button>
      </Tooltip>
      <ToolItem
        :tooltip="$t('setDoingWindow')"
        :icon="PlayCircleOutlined"
        @click="backend.openDoingWindow({ search: { taskId: realTask.id } })"
        :visible-disable-controller="tooltipVisibleDisabledController"
      ></ToolItem>
      <!-- :menus="[
          {
            name: '30分钟',
            click: () => {
              return createTaskInDay({
                type: 'TASK',
                taskId: task.id,
                date: dayjs().startOf('day').toDate(),
                startTime: dayjs().toDate(),
                endTime: dayjs().add(30, 'minute').toDate(),
              })
            },
          },
        ]" -->
    </div>

    <Tooltip
      :content="
        taskAnchorStore.isTaskAnchorCreated(realTask.id)
          ? $t('removeAnchor')
          : $t('createAnchor')
      "
      :visible-disable-controller="tooltipVisibleDisabledController"
    >
      <Button
        type="text"
        @click="taskAnchorStore.toggleTaskAnchor(realTask.id)"
      >
        <StarOutlined
          v-if="!taskAnchorStore.isTaskAnchorCreated(realTask.id)"
        ></StarOutlined>
        <StarFilled v-else></StarFilled>
      </Button>
    </Tooltip>
    <Tooltip
      :content="$t('taskView')"
      :visible-disable-controller="tooltipVisibleDisabledController"
    >
      <Button
        type="text"
        @click="
          dialogs.EditTaskViewTaskDialog({
            taskId: realTask.id,
          })
        "
      >
        <TagOutlined />
      </Button>
      <!-- <DefaultDropdown>
              <template #body>
                <Scope
                  v-for="taskView in taskViewStore.taskViews"
                  :d="{
                    taskViewTask: (realTask.taskViewTasks || []).find(
                      (d) => d.taskViewId === taskView.id,
                    ),
                    isAdded: (realTask.taskViewTasks || []).find(
                      (d) => d.taskViewId === taskView.id,
                    ),
                  }"
                  #default="{ isAdded, taskViewTask }"
                >
                  <div
                    @click="
                      () => {
                        if (isAdded) {
                          return taskViewStore.deleteTaskViewTaskByTaskViewTask(
                            taskViewTask!,
                          )
                        } else {
                          return taskViewStore.createTaskViewTask({
                            sortOrder: 0,
                            taskId: realTask.id,
                            taskViewId: taskView.id,
                          })
                        }
                      }
                    "
                    class="h cursor-pointer items-center gap-2 p-1 px-2"
                  >
                    <Button type="text" class="text-xs">
                      <CheckOutlined v-if="isAdded"></CheckOutlined>
                      <PlusOutlined v-else></PlusOutlined>
                    </Button>
                    <div class="stretch">
                      {{ taskView.name }}
                    </div>
                  </div>
                </Scope>
              </template>
            </DefaultDropdown> -->
    </Tooltip>
    <Tooltip
      :content="isFinished ? $t('cancelFinish') : $t('finish')"
      :visible-disable-controller="tooltipVisibleDisabledController"
    >
      <!-- <Button
          type="text"
          class="text-success"
          @click="
            isFinished
              ? taskStore.cancelFinishTask(realTask.id)
              : taskStore.finishTask(realTask.id)
          "
        >
          <CheckOutlined v-if="!isFinished"></CheckOutlined>
          <CheckSquareOutlined v-else> </CheckSquareOutlined>
        </Button> -->
      <Checkbox
        :model-value="isFinished"
        @update:model-value="taskStore.toggleTaskState(realTask.id)"
      ></Checkbox>
    </Tooltip>

    <Tooltip
      :content="$t('setNextTask')"
      :visible-disable-controller="tooltipVisibleDisabledController"
    >
      <Button type="text" @click="handleEditNextTask(realTask)">
        <ReloadOutlined></ReloadOutlined>
      </Button>
    </Tooltip>
    <slot name="before-delete" v-bind="{ task }"></slot>
    <Tooltip
      :content="$t('delete')"
      v-if="!hideDelete"
      :visible-disable-controller="tooltipVisibleDisabledController"
    >
      <PopConfirm
        @confirm="
          async () => {
            if (realTask?.children.length) {
              await dialogs
                .ConfirmDialog({
                  content: $t('deleteTaskWithSubTasksConfirm'),
                })
                .finishPromise();
            }
            return taskStore.deleteTaskById(realTask!.id);
          }
        "
      >
        <Button type="text" danger>
          <DeleteOutlined></DeleteOutlined>
        </Button>
      </PopConfirm>
    </Tooltip>
  </Tools>
</template>
<script setup lang="ts">
import { dialogs } from "@/components/dialog";
import {
  defaultTaskFactor,
  defaultTaskPriority,
  highTaskPriority,
} from "@/const";
import { useTaskStore } from "@/store/task";
import { useTaskAnchorStore } from "@/store/taskAnchor";
import { ReadOnlyTaskWithChildren } from "@/types";
import {
  handleEditNextTask,
  handleEditPriority,
  useTaskState,
  updateFactor,
  handleEditFactor,
  updatePriority,
  handleEditDateRange,
  handleEditDescription,
  handleEditTaskTarget,
} from "@/types/biz/task";
import { createTaskInDay } from "@/utils/biz";
import { backend } from "@/utils/backend";
import {
  AimOutlined,
  PieChartOutlined,
  PlayCircleOutlined,
  TagOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons-vue";
import dayjs from "dayjs";

const props = defineProps<{
  task: ReadOnlyTaskWithChildren;
  hideDelete?: boolean;
  tooltipVisibleDisabledController?: boolean;
}>();
const taskStore = useTaskStore();
const taskAnchorStore = useTaskAnchorStore();

const realTask = computed(() => {
  return taskStore.tasksDict[props.task.id];
});
const { canEditFactor, isFinished } = useTaskState(computed(() => props.task));
</script>
