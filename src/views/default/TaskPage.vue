<template>
  <div
    v-if="isLoaded"
    class="h size-full items-stretch"
    v-motion
    :initial="{
      opacity: 0,
    }"
    :enter="{
      opacity: 1,
    }"
  >
    <div class="bg-light-2 v justify-between p-2">
      <div class="v gap-2" v-if="taskGroups.length">
        <!-- <ClickableIcon :icon="FolderOutlined"></ClickableIcon>
        <ClickableIcon :icon="RobotOutlined"></ClickableIcon> -->
        <ClickableIcon
          @click="isShowCalendarView = !isShowCalendarView"
          :icon="CalendarOutlined"
          :selected="isShowCalendarView"
          :tooltip="$t('calendar')"
          placement="right"
        ></ClickableIcon>
        <ClickableIcon
          @click="
            () => {
              isShowScheduleView = !isShowScheduleView;
            }
          "
          :icon="CalendarOutlined"
          :selected="isShowScheduleView"
          :tooltip="$t('schedule')"
          placement="right"
        ></ClickableIcon>
        <ClickableIcon
          :icon="PlayCircleOutlined"
          @click="backend.openDoingWindow()"
          :tooltip="$t('doing')"
          placement="right"
        ></ClickableIcon>

        <!-- :menus="[
            {
              name: '关闭正在做窗口',
              danger: true,
              icon: CloseOutlined,
              click: () => backend.closeDoingWindow(),
            },
          ]" -->
      </div>
      <div class="v gap-2" v-else>
        <ClickableIcon
          @click="dialogs.ArchivedTaskGroupsDialog()"
          :tooltip="$t('archivedTaskGroup')"
          :icon="FolderOutlined"
        ></ClickableIcon>
      </div>
      <div class="v gap-2">
        <ClickableIcon
          :tooltip="$t('restByClick')"
          :icon="SmileOutlined"
          placement="right"
          @click="
            async () => {
              await dialogs
                .DatePickerDialog({
                  title: $t('selectRestDate'),
                  content: $t('selectRestDateDescription'),
                  value: dayjs(),
                })
                .finishPromise(async (d) => {
                  if (d) {
                    await dialogs
                      .ConfirmDialog({
                        content: $t('selectRestDateConfirmMessage', {
                          date: d.format('YYYY-MM-DD'),
                        }),
                      })
                      .finishPromise();
                    return taskStore.restADay(
                      dayjs(d.toDate()).startOf('day').toISOString()
                    );
                  }
                });
            }
          "
        ></ClickableIcon>
        <ClickableIcon
          :icon="ReloadOutlined"
          :tooltip="$t('reloadPage')"
          @click="handleReload"
          placement="right"
        ></ClickableIcon>
        <ClickableIcon
          @click="dialogs.EditSystemSettingDialog()"
          :icon="SettingOutlined"
          :tooltip="$t('systemSetting')"
          placement="right"
        ></ClickableIcon>
      </div>
    </div>
    <div v-if="isLoaded" class="stretch">
      <DefineTaskListTemplate
        #default="{ tasks, currentView, disableOrder, hideGroupName }"
      >
        <!-- :task-dropdown-hide-delete="!!currentView" -->
        <TaskListWithTools
          :model-value="tasks"
          :padding-x-level="3"
          :disable-order
          :task-hide-group-name="hideGroupName"
        >
          <template
            #task-tools-before-delete="{ task }"
            v-if="!!currentView && currentView.type === 'ALTERNATIVE'"
          >
            <Tooltip :content="$t('removeFromTaskView')">
              <Button
                @click="
                  () => {
                    // 查找当前taskviewtask
                    const taskViewTask = task.taskViewTasks.find(
                      (tvt) => tvt.taskViewId === currentView.id
                    );
                    if (taskViewTask) {
                      taskViewStore.deleteTaskViewTaskByTaskViewTask(
                        taskViewTask
                      );
                    }
                  }
                "
                type="text"
                class="!text-danger"
              >
                <CloseOutlined></CloseOutlined>
              </Button>
            </Tooltip>
          </template>
        </TaskListWithTools>
      </DefineTaskListTemplate>
      <ResizeDiv
        class="h size-full items-stretch"
        v-if="taskGroups.length > 0"
        storage-key="task-page-sidebar-tasklist"
      >
        <template #1>
          <div
            :class="[
              'group bg-light border-light-3 v relative size-full border-l pt-3',
            ]"
          >
            <!-- <ResizeDiv
            v
            class="stretch"
            storage-key="task-page-sidebar-vertical"
            auto-min-size1
          > -->
            <!-- <template #1="{ setMinRef }"> -->
            <!-- :ref="setMinRef" -->
            <Scrollbar wrap-class="overflow-x-hidden" view-class="v gap-3 pb-3">
              <div :class="['v gap-2', sidebarPaddingX]">
                <div class="h items-center justify-between gap-2">
                  <CaretRightOutlined
                    v-if="taskViews.length > 0"
                    @click="isShowTaskViews = !isShowTaskViews"
                    :class="[
                      'duration-300',
                      isShowTaskViews ? 'rotate-90' : 'rotate-0',
                    ]"
                  ></CaretRightOutlined>
                  <div class="stretch font-semibold">{{ $t("taskView") }}</div>
                  <DefaultDropdownMenu
                    :menus="[
                      {
                        name: $t('today'),
                        click: () => {
                          return taskViewStore.createTaskView(
                            taskViewPresets.today
                          );
                        },
                      },
                      {
                        name: $t('tomorrow'),
                        click: () => {
                          return taskViewStore.createTaskView(
                            taskViewPresets.tomorrow
                          );
                        },
                      },
                      {
                        name: $t('dayAfterTomorrow'),
                        click: () => {
                          return taskViewStore.createTaskView(
                            taskViewPresets.dayAfterTomorrow
                          );
                        },
                      },
                      {
                        name: $t('thisWeek'),
                        click: () => {
                          return taskViewStore.createTaskView(
                            taskViewPresets.thisWeek
                          );
                        },
                      },
                      {
                        name: $t('thisMonth'),
                        click: () => {
                          return taskViewStore.createTaskView(
                            taskViewPresets.thisMonth
                          );
                        },
                      },
                      {
                        name: $t('custom'),
                        click: () => {
                          return handleCreateCustomTaskView();
                        },
                      },
                    ]"
                  >
                    <Button
                      type="text"
                      class="text-sm"
                      @click="handleCreateCustomTaskView"
                    >
                      <PlusOutlined></PlusOutlined>
                    </Button>
                  </DefaultDropdownMenu>
                  <!-- <DefaultDropdownMenu
                      :menus="[
                        {
                          name: '创建视图',
                          icon: PlusOutlined,
                          click: () =>
                            dialogs.EditTaskViewDialog().finishPromise((view) => {
                              if (view) {
                                return taskViewStore.createTaskView({
                                  ...view,
                                })
                              }
                            }),
                        },
                      ]"
                    >
                      <Button type="text" class="text-sm">
                        <MoreOutlined></MoreOutlined>
                      </Button>
                    </DefaultDropdownMenu> -->
                </div>
                <!-- class="gap-2" -->
                <OrderContainer
                  v-if="taskViews.length > 0 && isShowTaskViews"
                  class="order-container-gap-2 overflow-x-hidden"
                  :drop-channel="() => 'order-taskview'"
                  :drag-datas="
                    (d) => [
                      {
                        datas: [d],
                        type: 'order-taskview',
                      },
                    ]
                  "
                  @order="taskViewStore.changeOrders($event)"
                  :datas="taskViews.slice()"
                  #default="{
                    data: v,
                    setDragRef: setOrderContainerDragRef,
                    index,
                  }"
                >
                  <Scope
                    :d="{
                      isSelected:
                        currentType === 'taskView' && currentId === v.id,
                      pendingLeaveTasksFactor: calculatePendingLeaveTasksFactor(
                        taskViewTasksMap[v.id]?.tasks.slice() || []
                      ),
                      // totalLeaveTasksFactor: calculateTotalLeaveTasksFactor(
                      //   taskViewTasksMap[v.id]?.tasks.slice() || [],
                      // ),
                    }"
                    #default="{
                      isSelected,
                      pendingLeaveTasksFactor,
                      // totalLeaveTasksFactor,
                    }"
                  >
                    <BizDrop
                      channel="move-tasks"
                      #default="{ setRef, isDroppingActive }"
                      @drop="
                        (channel, d) =>
                          channel === 'move-tasks'
                            ? handleDropTaskView(d, v)
                            : undefined
                      "
                      :disabled="v.type === 'AUTO'"
                    >
                      <div
                        :ref="
                          (el) => {
                            setRef(el);
                            setOrderContainerDragRef(el);
                          }
                        "
                        :class="[
                          'drop-area',
                          isDroppingActive ? 'dropping-active' : '',
                        ]"
                        v-motion
                        :initial="{
                          opacity: 0,
                          x: motionTranslateX,
                        }"
                        :enter="{
                          opacity: 1,
                          x: 0,
                          transition: {
                            delay: motionDelay(index),
                          },
                        }"
                      >
                        <SelectableTag
                          :title="v.name"
                          :icon="v.icon || defaultTaskViewIcon(v.type)"
                          @click="
                            () => {
                              currentType = 'taskView';
                              currentId = v.id;
                            }
                          "
                          :progress="(v.finishedFactor / v.totalFactor) * 100"
                          :selected="isSelected"
                          :content="v.description"
                          :menus="[
                            {
                              name: $t('edit'),
                              icon: EditOutlined,
                              click: () => {
                                return dialogs
                                  .EditTaskViewDialog({ taskView: v })
                                  .finishPromise((d) => {
                                    if (d) {
                                      return taskViewStore.updateTaskViewById(
                                        v.id,
                                        d
                                      );
                                    }
                                  });
                              },
                            },
                            {
                              name: $t('delete'),
                              icon: DeleteOutlined,
                              danger: true,
                              click: () =>
                                dialogs
                                  .ConfirmDialog({
                                    content: $t('deleteTaskViewConfirm'),
                                  })
                                  .finishPromise(() => {
                                    return taskViewStore.deleteTaskViewById(
                                      v.id
                                    );
                                  }),
                            },
                          ]"
                        >
                          <template
                            v-if="pendingLeaveTasksFactor > 0"
                            #title-suffix
                          >
                            <Badge
                              :invert="isSelected"
                              :value="pendingLeaveTasksFactor"
                            ></Badge>
                            <!-- <span class="text-sm">
                                / {{ totalLeaveTasksFactor }}
                              </span> -->
                          </template>
                          <template #dropdown-suffix>
                            <Tooltip
                              :content="
                                $t('loadScriptFailed', {
                                  reason:
                                    taskViewStore.taskViewTasksMap[v.id]
                                      ?.scriptLoadedFailedReason,
                                })
                              "
                            >
                              <ExclamationCircleOutlined
                                v-if="
                                  taskViewStore.taskViewTasksMap[v.id]
                                    ?.isScriptLoadedFailed
                                "
                                :class="
                                  isSelected ? '!text-white' : '!text-error'
                                "
                              />
                            </Tooltip>
                          </template>
                        </SelectableTag>
                      </div>
                    </BizDrop>
                  </Scope>
                </OrderContainer>
              </div>
              <!-- </template>
              <template #2> -->
              <div class="v size-full gap-2 pt-2">
                <div
                  :class="[
                    'h items-center justify-between gap-2',
                    sidebarPaddingX,
                  ]"
                >
                  <CaretRightOutlined
                    v-if="taskGroups.length > 0"
                    @click="isShowGroups = !isShowGroups"
                    :class="[
                      'duration-300',
                      isShowGroups ? 'rotate-90' : 'rotate-0',
                    ]"
                  ></CaretRightOutlined>

                  <div class="stretch font-semibold">{{ $t("taskGroup") }}</div>
                  <Button
                    type="text"
                    class="text-sm"
                    @click="
                      dialogs.EditTaskGroupDialog({
                        taskGroup: {},
                      })
                    "
                  >
                    <PlusOutlined></PlusOutlined>
                  </Button>
                </div>
                <Scrollbar
                  class="stretch"
                  :view-class="[sidebarPaddingX, 'py-1']"
                >
                  <OrderContainer
                    v-if="taskGroups.length > 0 && isShowGroups"
                    class="stretch order-container-gap-2 overflow-x-hidden"
                    :datas="taskGroups.slice()"
                    #default="{
                      data: g,
                      setDragRef: setOrderContainerDragRef,
                      index,
                    }"
                    :drag-datas="
                      (d) => [
                        {
                          type: 'order-taskgroup',
                          datas: [d],
                        },
                      ]
                    "
                    :drop-channel="() => 'order-taskgroup'"
                    @order="taskGroupStore.changeOrders($event)"
                  >
                    <div :class="['v gap-2']">
                      <Scope
                        :d="{
                          isSelected:
                            currentType === 'taskGroup' &&
                            finalGroupId === g.id,
                          hasAnchors:
                            !!taskAnchorsGroupByTaskGroupId[g.id]?.length,
                        }"
                        #default="{ isSelected, hasAnchors }"
                      >
                        <BizDrop
                          channel="move-tasks"
                          #default="{ setRef, isDroppingActive }"
                          @drop="
                            (c, d) =>
                              c === 'move-tasks'
                                ? handleDropTaskGroup(d, g)
                                : undefined
                          "
                        >
                          <div
                            :ref="
                              (el) => {
                                setRef(el);
                                setOrderContainerDragRef(el);
                              }
                            "
                            :class="[
                              'drop-area',
                              isDroppingActive ? 'dropping-active' : '',
                            ]"
                            v-motion
                            :initial="{
                              opacity: 0,
                              x: motionTranslateX,
                            }"
                            :enter="{
                              opacity: 1,
                              x: 0,
                              transition: {
                                delay: motionDelay(index),
                              },
                            }"
                          >
                            <SelectableTag
                              :progress="
                                (g.finishedFactor / g.totalFactor) * 100
                              "
                              :selected="isSelected"
                              :icon="g.icon || defaultTaskGroupIcon"
                              :title="g.name"
                              :content="g.description"
                              :hue="g.color"
                              :menus="[
                                {
                                  name: $t('edit'),
                                  icon: EditOutlined,
                                  click: () => {
                                    return dialogs
                                      .EditTaskGroupDialog({ taskGroup: g })
                                      .finishPromise((d) => {
                                        if (d) {
                                          return taskGroupStore.updateTaskGroupById(
                                            g.id,
                                            d
                                          );
                                        }
                                      });
                                  },
                                },
                                {
                                  name: $t('archive'),
                                  icon: FolderOutlined,
                                  click: () => {
                                    return taskGroupStore.archiveTaskGroup(
                                      g.id
                                    );
                                  },
                                },
                                {
                                  name: $t('delete'),
                                  icon: DeleteOutlined,
                                  danger: true,
                                  click: () => {
                                    return dialogs
                                      .ConfirmDialog({
                                        content: $t('deleteTaskGroupConfirm'),
                                      })
                                      .finishPromise(() => {
                                        return taskGroupStore.deleteTaskGroupById(
                                          g.id
                                        );
                                      });
                                  },
                                },
                              ]"
                              @click="
                                () => {
                                  currentType = 'taskGroup';
                                  currentId = g.id;
                                }
                              "
                            >
                              <template #title-prefix>
                                <CaretRightOutlined
                                  v-if="hasAnchors"
                                  @click.stop="
                                    taskGroupStore.updateTaskGroupById(g.id, {
                                      isHideAnchors: !g.isHideAnchors,
                                    })
                                  "
                                  :class="[
                                    'transition-[rotate] duration-300',
                                    g.isHideAnchors ? 'rotate-0' : 'rotate-90',
                                  ]"
                                ></CaretRightOutlined>
                              </template>
                              <template #title-suffix>
                                <Badge
                                  v-if="g.totalFactor - g.finishedFactor > 0"
                                  :invert="isSelected"
                                  :value="g.totalFactor - g.finishedFactor"
                                  :hue="g.color"
                                >
                                </Badge>
                              </template>
                            </SelectableTag>
                          </div>
                        </BizDrop>
                      </Scope>
                      <OrderContainer
                        class="order-container-gap-2 pl-10 overflow-x-hidden"
                        :datas="taskAnchorsGroupByTaskGroupId[g.id]!.slice()"
                        :drag-datas="
                          (d) => [
                            {
                              type: `order-taskanchor-${g.id}`,
                              datas: [d],
                            },
                          ]
                        "
                        :drop-channel="() => `order-taskanchor-${g.id}`"
                        @order="taskAnchorStore.changeOrders($event)"
                        v-if="
                          taskAnchorsGroupByTaskGroupId[g.id]?.length &&
                          !g.isHideAnchors
                        "
                        #default="{
                          data: anchor,
                          setDragRef: setOrderContainerDragRef,
                          index,
                        }"
                      >
                        <Scope
                          :d="{
                            isSelected:
                              currentType === 'taskAnchor' &&
                              currentId === anchor.id,
                            pendingLeaveTasksFactor:
                              calculatePendingLeaveTasksFactor(
                                anchor.task.children.slice()
                              ),
                          }"
                          #default="{ isSelected, pendingLeaveTasksFactor }"
                        >
                          <BizDrop
                            channel="move-tasks"
                            #default="{ setRef, isDroppingActive }"
                            @drop="
                              (c, d) =>
                                c === 'move-tasks'
                                  ? handleDropTaskAnchor(d, g, anchor)
                                  : undefined
                            "
                          >
                            <div
                              :ref="
                                (el) => {
                                  setRef(el);
                                  setOrderContainerDragRef(el);
                                }
                              "
                              :class="[
                                'drop-area',
                                isDroppingActive ? 'dropping-active' : '',
                              ]"
                              v-motion
                              :initial="{
                                opacity: 0,
                                x: motionTranslateX,
                              }"
                              :enter="{
                                opacity: 1,
                                x: 0,
                                transition: {
                                  delay: motionDelay(index),
                                },
                              }"
                            >
                              <SelectableTag
                                @click="
                                  () => {
                                    currentType = 'taskAnchor';
                                    currentId = anchor.id;
                                  }
                                "
                                :title="anchor.task.content"
                                :selected="isSelected"
                                :hue="g.color"
                                :menus="[
                                  {
                                    icon: DeleteOutlined,
                                    danger: true,
                                    name: $t('removeAnchor'),
                                    click: () =>
                                      taskAnchorStore.deleteTaskAnchorByTaskId(
                                        anchor.taskId
                                      ),
                                  },
                                ]"
                                :progress="
                                  (calculateFinishLeaveTasksFactor(
                                    anchor.task.children.slice()
                                  ) /
                                    calculateTotalLeaveTasksFactor(
                                      anchor.task.children.slice()
                                    )) *
                                  100
                                "
                              >
                                <template
                                  v-if="pendingLeaveTasksFactor > 0"
                                  #title-suffix
                                >
                                  <Badge
                                    :invert="isSelected"
                                    :value="pendingLeaveTasksFactor"
                                    :hue="g.color"
                                  ></Badge>
                                </template>
                              </SelectableTag>
                            </div>
                          </BizDrop>
                        </Scope>
                      </OrderContainer>
                    </div>
                  </OrderContainer>
                </Scrollbar>
              </div>
              <!-- </template>
            </ResizeDiv> -->
            </Scrollbar>
            <TaskPageFooter>
              <ClickableIcon
                @click="dialogs.ArchivedTaskGroupsDialog()"
                :tooltip="$t('archivedTaskGroup')"
                :icon="FolderOutlined"
                :label="
                  taskGroupStore.archivedTaskGroups.length > 0
                    ? taskGroupStore.archivedTaskGroups.length
                    : undefined
                "
              ></ClickableIcon>
            </TaskPageFooter>
          </div>
        </template>
        <template #2>
          <ResizeDiv
            initial-width="50%"
            storage-key="task-page-main-right"
            :disable2="!isShowCalendarView && !isShowScheduleView"
          >
            <template #1>
              <div class="v size-full gap-3 overflow-auto py-3">
                <div
                  class="size-full stretch v gap-3"
                  v-if="currentType !== 'taskView'"
                  :key="currentId + currentType"
                >
                  <template
                    v-if="currentType === 'taskAnchor' && finalTaskAnchor"
                  >
                    <div
                      v-if="taskAnchorTask"
                      :key="taskAnchorTask.id"
                      class="px-3"
                    >
                      <Task
                        :model-value="taskAnchorTask"
                        dropdown-placement="bottomLeft"
                      ></Task>
                    </div>
                  </template>
                  <div class="px-3">
                    <Input
                      @focus="
                        () => {
                          if (isOnlyShowLeaves) {
                            isOnlyShowLeaves = false;
                          }
                          if (isShowFinishedTasks) {
                            isShowFinishedTasks = false;
                          }
                          if (Object.keys(filterEntity).length > 0) {
                            filterEntity = {};
                          }
                        }
                      "
                      v-model="inputTaskContent"
                      @enter="
                        () => {
                          createTask({
                            content: inputTaskContent,
                            ...(currentType === 'taskGroup'
                              ? {
                                  groupId: finalGroup!.id,
                                }
                              : {
                                  groupId: finalTaskAnchor!.taskGroupId,
                                  parentId: finalTaskAnchor!.taskId,
                                }),
                          });
                          inputTaskContent = '';
                        }
                      "
                      :placeholder="$t('taskContentInputPlaceholder')"
                    ></Input>
                  </div>
                  <div
                    class="size-full stretch"
                    :key="finalGroupId + currentType"
                    v-if="currentType === 'taskGroup'"
                  >
                    <TaskListTemplate
                      hide-group-name
                      :tasks="currentTreeTasks"
                    ></TaskListTemplate>
                  </div>
                  <div
                    class="size-full stretch"
                    v-else-if="currentType === 'taskAnchor' && taskAnchorTask"
                    :key="currentType"
                  >
                    <TaskListTemplate
                      :tasks="taskAnchorTask!.children.slice()"
                    ></TaskListTemplate>
                  </div>
                </div>
                <!-- taskview -->
                <div
                  class="stretch v size-full"
                  v-else-if="finalTaskView"
                  :key="finalTaskView.id"
                >
                  <TaskListTemplate
                    :tasks="(taskViewTasksMap[currentId]?.tasks || []).slice()"
                    :currentView="finalTaskView"
                    disable-order
                  >
                  </TaskListTemplate>
                </div>
              </div>
            </template>
            <template #2>
              <ResizeDiv
                v
                :disable2="!isShowScheduleView"
                :disable1="!isShowCalendarView"
                storage-key="task-page-main-right-calendar-schedule"
              >
                <template #1>
                  <TaskCalendar
                    :padding-x="3"
                    class="bg-light py-3"
                  ></TaskCalendar>
                </template>
                <template #2>
                  <TaskSchedule></TaskSchedule>
                </template>
              </ResizeDiv>
            </template>
          </ResizeDiv>
        </template>
      </ResizeDiv>
      <div v-else class="h size-full items-center justify-center">
        <div class="v gap-4 max-w-80">
          <div class="text-md leading-multi">
            {{ $t("createTutorialDescription") }}
          </div>
          <Input
            v-model="inputTaskGroupName"
            :placeholder="$t('inputTaskGroupNamePlaceholder')"
            @enter="handleCreateTaskGroup"
          ></Input>
          <Button type="primary" @click="handleCreateTaskGroup">{{
            $t("create")
          }}</Button>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="size-full v justify-center items-center text-[40px]">
    <LoadingOutlined></LoadingOutlined>
  </div>
</template>
<script setup lang="ts">
import { dialogs } from "@/components/dialog";
import type { GetAPIParams, protocols } from "@/protocol";
import {
  CalendarOutlined,
  CaretRightOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  FolderOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SettingOutlined,
  SmileOutlined,
} from "@ant-design/icons-vue";
import { useTaskStore } from "@/store/task";
import { useTaskAnchorStore } from "@/store/taskAnchor";
import { useTaskGroupStore } from "@/store/taskGroup";
import { useTaskViewStore } from "@/store/taskView";
import { useFetchDataStore } from "@/store/fetchData";
import {
  calculateFinishLeaveTasksFactor,
  calculatePendingLeaveTasksFactor,
  calculateTotalLeaveTasksFactor,
  sortTaskGroups,
  sortTaskViews,
  useTaskListToolsOptions,
} from "@/utils/biz";
import {
  ReadOnlyTaskViewWithExtra,
  ReadOnlyTaskWithChildren,
  TaskAnchorWithTaskGroupId,
  TaskGroupWithExtra,
} from "@/types";
import { DragData } from "@/bizComponents/drag/drag";
import {
  defaultPrimaryHue,
  defaultSortOrder,
  defaultTaskGroupIcon,
  defaultTaskViewIcon,
  motionDelay,
  motionTranslateX,
  sidebarPaddingX,
  taskViewPresets,
} from "@/const";
import { backend } from "@/utils/backend";
import { dayjs } from "@/utils/time";

const inputTaskContent = ref("");

const fetchDataStore = useFetchDataStore();
const taskStore = useTaskStore();
const taskAnchorStore = useTaskAnchorStore();
const taskGroupStore = useTaskGroupStore();
const taskViewStore = useTaskViewStore();

const isLoading = computed(() => fetchDataStore.isLoading);
const isLoaded = computed(() => fetchDataStore.isLoaded);
const taskGroups = computed(() => {
  const ds = taskGroupStore.nonArchivedTaskGroups.slice();
  ds.sort(sortTaskGroups);
  return ds;
});
const taskViews = computed(() => {
  const ds = taskViewStore.taskViews.slice();
  ds.sort(sortTaskViews);
  return ds;
});
const taskViewTasksMap = computed(() => taskViewStore.taskViewTasksMap);
const taskanchors = computed(() => taskAnchorStore.taskAnchors);
const taskAnchorsGroupByTaskGroupId = computed(
  () => taskAnchorStore.taskAnchorsGroupByTaskGroupId
);
// const flatTasks = computed(() => dataStore.flatTasks)
const tasksDict = computed(() => taskStore.tasksDict);
const treeTasksGroupByGroupId = computed(
  () => taskStore.treeTasksGroupByTaskGroupId
);

// type CalendarViewType = "calendar" | "Schedule"
const isShowCalendarView = useLocalStorage<boolean>(
  "task-page-isShowCalendarView",
  false
);
const isShowScheduleView = useLocalStorage<boolean>(
  "task-page-isShowScheduleView",
  false
);

const isShowTaskViews = useLocalStorage<boolean>(
  "task-page-isShowTaskViews",
  true
);
const isShowGroups = useLocalStorage<boolean>("task-page-isShowGroups", true);

watch(
  [isShowCalendarView, isShowScheduleView],
  async ([a, b]) => {
    const value = a || b;
    const [width, height] = (await backend.getWindowSize()) || [];
    if (!!value && width < 900 * devicePixelRatio) {
      await backend.setWindowSize({
        width: 1280 * devicePixelRatio,
        height,
      });
    } else if (!value && width >= 900 * devicePixelRatio) {
      await backend.setWindowSize({
        width: 720 * devicePixelRatio,
        height,
      });
    }
  },
  { immediate: true }
);

const pageDomain = (d: string) => `taskpage-${d}`;
const currentId = useLocalStorage<string>(pageDomain("currentId"), "");
const currentType = useLocalStorage<"taskAnchor" | "taskGroup" | "taskView">(
  pageDomain("currentType"),
  "taskGroup"
);
const { isShowFinishedTasks, isOnlyShowLeaves, filterEntity } =
  useTaskListToolsOptions();

const finalGroupId = computed(() =>
  currentType.value === "taskGroup"
    ? (taskGroups.value.find((g) => g.id === currentId.value)?.id ??
      taskGroups.value[0]?.id)
    : undefined
);
const finalTaskAnchorId = computed(() =>
  currentType.value === "taskAnchor"
    ? taskanchors.value.find((tv) => tv.id === currentId.value)?.id
    : undefined
);
const finalTaskAnchor = computed(() =>
  currentType.value === "taskAnchor"
    ? taskanchors.value.find((tv) => tv.id === currentId.value)
    : undefined
);
const taskAnchorTask = computed(() => {
  return finalTaskAnchor.value?.taskId
    ? tasksDict.value[finalTaskAnchor.value.taskId]
    : undefined;
});
const finalTaskView = computed(() =>
  currentType.value === "taskView"
    ? taskViews.value.find((tv) => tv.id === currentId.value)
    : undefined
);

const currentTreeTasks = computed(() =>
  (
    (finalGroupId.value
      ? treeTasksGroupByGroupId.value[finalGroupId.value]
      : []) || []
  ).slice()
);

const finalGroup = computed(() =>
  taskGroups.value.find((f) => f.id === finalGroupId.value)
);

async function createTask(
  task: GetAPIParams<typeof protocols.createTask>[0]["data"]
) {
  await taskStore.createTask(task.content, task.groupId, task);
}

const inputTaskGroupName = ref("");
function handleCreateTaskGroup() {
  const name = inputTaskGroupName.value.trim();
  if (name) {
    return taskGroupStore
      .createTaskGroup({
        data: {
          name,
          color: defaultPrimaryHue,
          sortOrder: defaultSortOrder,
        },
      })
      .then(() => {
        inputTaskGroupName.value = "";
      });
  } else {
    console.warn("Task group name is empty");
  }
}

watch(
  [currentType, currentId],
  ([type, id]) => {
    Promise.all([fetchDataStore.loadingPromise()]).then(() => {
      if (type === "taskView" && taskViews.value.find((v) => v.id === id)) {
        taskViewStore.loadTasks(currentId.value);
      }
    });
  },
  { immediate: true }
);

const [DefineTaskListTemplate, TaskListTemplate] = createReusableTemplate<{
  tasks: ReadOnlyTaskWithChildren[];
  currentView?: ReadOnlyTaskViewWithExtra;
  disableOrder?: boolean;
  hideGroupName?: boolean;
}>();

function handleDropTaskGroup(d: DragData, taskGroup: TaskGroupWithExtra) {
  const tasks = d.datas as ReadOnlyTaskWithChildren[];
  return Promise.all(
    tasks.map(async (t) => {
      return taskStore.updateTaskParent(t.id, null, {
        groupId: taskGroup.id,
      });
    })
  );
}

function handleDropTaskAnchor(
  d: DragData,
  taskGroup: TaskGroupWithExtra,
  taskAnchor: TaskAnchorWithTaskGroupId
) {
  const tasks = d.datas as ReadOnlyTaskWithChildren[];
  return Promise.all(
    tasks.map(async (t) => {
      return taskStore.updateTaskParent(t.id, taskAnchor.taskId, {
        groupId: taskGroup.id,
      });
    })
  );
}
function handleDropTaskView(d: DragData, taskView: ReadOnlyTaskViewWithExtra) {
  const tasks = d.datas as ReadOnlyTaskWithChildren[];
  return Promise.all(
    tasks.map(async (t) => {
      // return taskStore.updateTaskParent(t.id, null, {
      //   groupId: taskView.id,
      // })
      return taskViewStore.createTaskViewTask({
        taskId: t.id,
        taskViewId: taskView.id,
      });
    })
  );
}

function handleReload() {
  window.location.reload();
}

function handleCreateCustomTaskView() {
  return dialogs.EditTaskViewDialog().finishPromise((view) => {
    if (view) {
      return taskViewStore.createTaskView({
        ...view,
      });
    }
  });
}
</script>
