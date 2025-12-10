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
          :icon="TableOutlined"
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
                <HeightTransition>
                  <OrderContainer
                    v-if="taskViews.length > 0 && isShowTaskViews"
                    class="order-container-gap-2"
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
                          finalType === 'taskView' && finalId === v.id,
                        pendingLeaveTasksFactor:
                          calculatePendingLeaveTasksFactor(
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
                </HeightTransition>
              </div>
              <div class="v size-full gap-2 pt-2">
                <div
                  :class="[
                    'h items-center justify-between gap-2',
                    sidebarPaddingX,
                  ]"
                >
                  <ExpandIcon
                    v-if="taskGroups.length > 0"
                    :is-expand="isShowGroups"
                    @click="
                      (e: GlobalTypes['MouseEvent']) => {
                        if (e.ctrlKey || e.metaKey) {
                          const toState = !isShowGroups;
                          if (toState) {
                            isShowGroups = toState;
                            $nextTick(() => {
                              groupDraggableTreeRef?.toggleAll(toState);
                            });
                          } else {
                            groupDraggableTreeRef?.toggleAll(toState);
                            $nextTick(() => {
                              isShowGroups = toState;
                            });
                          }
                        } else {
                          isShowGroups = !isShowGroups;
                        }
                      }
                    "
                  ></ExpandIcon>
                  <div class="stretch font-semibold">{{ $t("taskGroup") }}</div>
                  <div class="h items-center gap-2">
                    <DefaultDropdownMenu
                      :title="$t('colorPreset')"
                      :menus="
                        [
                          {
                            name: $t('rainbow'),
                            hues: new Array(taskGroups.length)
                              .fill(0)
                              .map((_, i) =>
                                Math.floor((i * 360) / taskGroups.length)
                              ),
                          },
                        ].map((d) => ({
                          name: d.name,
                          click() {
                            return getWindow().Promise.all(
                              taskGroups.map(async (t, i) => {
                                await taskGroupStore.updateTaskGroupById(t.id, {
                                  color: d.hues[i % d.hues.length].toString(),
                                });
                              })
                            );
                          },
                        }))
                      "
                    >
                      <Button type="text">
                        <div><BgColorsOutlined /></div>
                      </Button>
                    </DefaultDropdownMenu>
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
                </div>
                <Scrollbar
                  class="stretch"
                  :view-class="[sidebarPaddingX, 'py-1']"
                >
                  <HeightTransition>
                    <div v-if="isShowGroups">
                      <DraggableTree
                        ref="groupDraggableTreeRef"
                        :model-value="taskGroupTree"
                        tree-expand-strategy="all"
                        tree-custom-expand-element
                        tree-expands-storage-key="taskpage-taskgrouporanchor-tree-expands"
                        #default="{
                          item: d,
                          toggle,
                          hasChildren,
                          isExpand,
                          index,
                        }"
                        :change-parent-channel="() => `move-tasks`"
                        :drag-datas="
                          (d) => () => [
                            ...(d.data.type === 'group'
                              ? [
                                  {
                                    type: 'order-taskgroup' as const,
                                    datas: [d],
                                  },
                                ]
                              : [
                                  {
                                    type: 'order-taskanchor' as const,
                                    datas: [d],
                                  },
                                ]),
                            ...(d.data.type === 'anchor' &&
                            taskStore.tasksDict[d.data.anchor?.task.id!]
                              ? [
                                  {
                                    type: 'move-tasks' as const,
                                    datas: [
                                      taskStore.tasksDict[
                                        d.data.anchor?.task.id!
                                      ]! as GetDragDataType<'move-tasks'>[number],
                                    ],
                                  },
                                  {
                                    type: 'order-task' as const,
                                    datas: [
                                      taskStore.tasksDict[
                                        d.data.anchor?.task.id!
                                      ]! as GetDragDataType<'order-task'>[number],
                                    ],
                                  },
                                ]
                              : []),
                          ]
                        "
                        :order-channel="
                          (d) => [
                            // 禁止这个移动
                            ...(d.data.type === 'anchor'
                              ? ['move-tasks' as const]
                              : []),
                            d.data.type === 'anchor'
                              ? 'order-taskanchor'
                              : 'order-taskgroup',
                          ]
                        "
                        :change-parent-channel-data-adapter="
                          (channel, d) => {
                            if (channel === 'move-tasks') {
                              return {
                                dragData:
                                  d as GetDragDataType<'move-tasks'>[number],
                              };
                              // as TaskGroupOrAnchor;
                            }
                            return undefined;
                          }
                        "
                        @change-parent="
                          (dragData, droppedData) => {
                            const draggingTask = dragData.dragData;
                            const taskGroupOrAnchor = droppedData.data;
                            if (draggingTask?.id && taskGroupOrAnchor) {
                              if (
                                taskGroupOrAnchor.type === 'group' &&
                                taskGroupOrAnchor.group?.id
                              ) {
                                return taskStore.updateTasksParent([
                                  {
                                    id: draggingTask.id,
                                    parentId: null,
                                    groupId: taskGroupOrAnchor.group.id,
                                  },
                                ]);
                              } else if (
                                taskGroupOrAnchor.type === 'anchor' &&
                                taskGroupOrAnchor.anchor?.taskId &&
                                taskGroupOrAnchor.anchor.taskGroupId
                              ) {
                                taskStore.updateTasksParent([
                                  {
                                    id: draggingTask.id,
                                    parentId: taskGroupOrAnchor.anchor.taskId,
                                    ...(draggingTask.groupId !==
                                    taskGroupOrAnchor.anchor.taskGroupId
                                      ? {
                                          groupId:
                                            taskGroupOrAnchor.anchor
                                              .taskGroupId,
                                        }
                                      : {}),
                                  },
                                ]);
                              }
                            }
                          }
                        "
                        :order-channel-data-adapter="
                          (channel, d) => {
                            if (channel === 'move-tasks') {
                              const data =
                                d as GetDragDataType<'move-tasks'>[number];
                              // 搜索anchor是否存在，如果有直接使用，没有则使用创建的数据结构
                              return (
                                traverse(taskGroupTree, (treeItem) => {
                                  if (
                                    treeItem.data.type === 'anchor' &&
                                    treeItem.data.anchor?.taskId === d.id
                                  ) {
                                    return treeItem;
                                  }
                                }) ?? {
                                  dragData: data,
                                  // data: {
                                  //   type: 'anchor',
                                  //   anchor: {
                                  //     taskId: data.id,
                                  //   } satisfies Partial<TaskAnchor> as TaskGroupOrAnchor['anchor'],
                                  // } satisfies Partial<TaskGroupOrAnchor> as unknown as TaskGroupOrAnchor,
                                }
                              );
                            } else if (
                              ['order-taskgroup', 'order-taskanchor'].includes(
                                channel
                              )
                            ) {
                              const data =
                                d as GetDragDataType<'order-taskgrouporanchor'>[number];
                              return data;
                            }
                          }
                        "
                        @order="
                          async (newDatas, dragDatas, _, ps) => {
                            // 目前这一步是非事务性的

                            // 如果有父亲更新，需要更新task的parentId
                            // 获取自己的父亲、判断当前位置的父亲和自己是否有区别，有区别则更新
                            if (ps.length) {
                              // anchors
                              await getWindow().Promise.all([
                                ...dragDatas.map(async (d) => {
                                  // 如果有dragData，说明是任务拖拽过来的，类型是ReadOnlyTaskWithChildren
                                  const dragTask =
                                    d.dragData ?? d.data.anchor?.task;
                                  const dragTaskId = dragTask?.id;
                                  const myMeta = d.id
                                    ? getParentFromTree(d.id, taskGroupTree)
                                    : null;
                                  // 没有myParent，说明还没添加anchor
                                  let myParent =
                                    myMeta?.ps[myMeta?.ps.length - 1];
                                  if (!myParent) {
                                    const task =
                                      taskStore.tasksDict[dragTaskId!];
                                    if (task && dragTaskId) {
                                      const newAnchor =
                                        await taskAnchorStore.createTaskAnchor(
                                          dragTaskId
                                        );
                                      const parent = _findParent(task);
                                      const group = taskGroupTree.find(
                                        (d) => d.id === task.groupId
                                      );
                                      if (!parent) {
                                        myParent = group;
                                      } else {
                                        myParent = traverse(
                                          group?.children || [],
                                          (d) =>
                                            d.id === parent ? d : undefined
                                        );
                                      }
                                      // 将newDatas中的自己修改成anchor
                                      const d = newDatas.find(
                                        (d) => d.dragData?.id === dragTaskId
                                      );
                                      if (d) {
                                        Object.assign(d, {
                                          id: newAnchor.id,
                                          data: {
                                            id: newAnchor.id,
                                            parentId: myParent?.data.id || null,
                                            group: myParent?.data.group,
                                            children: [],
                                            type: 'anchor',
                                            anchor: newAnchor,
                                          },
                                        });
                                      }
                                    } else {
                                      throw new Error(
                                        'Cannot find task id from drag data'
                                      );
                                    }
                                  }
                                  const toParent = ps[ps.length - 1];
                                  if (
                                    d.data.anchor?.taskId &&
                                    myParent &&
                                    myParent.data.id !== toParent.data.id
                                  ) {
                                    const shouldUpdateToParentId =
                                      toParent.data.type === 'group'
                                        ? null
                                        : toParent.data.anchor?.taskId;
                                    //  can be null
                                    if (shouldUpdateToParentId !== undefined) {
                                      await taskStore.updateTasksParent([
                                        {
                                          id: d.data.anchor.taskId,
                                          parentId: shouldUpdateToParentId,
                                          ...(toParent.data.group?.id &&
                                          d.data.group?.id !==
                                            toParent.data.group?.id
                                            ? {
                                                groupId:
                                                  toParent.data.group!.id,
                                              }
                                            : {}),
                                        },
                                      ]);
                                    } else {
                                      console.warn(
                                        'Cannot find parentId to update for task',
                                        d
                                      );
                                    }
                                  }
                                }),
                              ]);
                              if (
                                newDatas.every((d) => d.data.type === 'anchor')
                              ) {
                                // 检查所有anchor是否位于一个parentId下
                                await taskAnchorStore.changeOrders(
                                  newDatas
                                    .filter((d) => !!d.data.anchor?.id)
                                    .map((d, i) => ({
                                      id: d.data.anchor!.id!,
                                      sortOrder: i,
                                    }))
                                );
                              }
                            } else {
                              // groups
                              if (
                                newDatas.every((d) => d.data.type === 'group')
                              ) {
                                return taskGroupStore.changeOrders(
                                  newDatas.map((d) => d.data.group!)
                                );
                              }
                            }
                          }
                        "
                      >
                        <!-- order-channel -->
                        <!-- move-tasks 可以用于添加anchor -->
                        <!-- order-taskgrouporanchor 用于调整grouporanchor的顺序 -->
                        <Scope
                          :d="{
                            isSelected: finalId === d.id,
                            ...(d.data.anchor
                              ? {
                                  pendingLeaveTasksFactor:
                                    calculatePendingLeaveTasksFactor(
                                      d.data.anchor.task.children.slice()
                                    ),
                                }
                              : d.data.group
                                ? {
                                    pendingLeaveTasksFactor:
                                      d.data.group!.totalFactor -
                                      d.data.group!.finishedFactor,
                                  }
                                : { pendingLeaveTasksFactor: 0 }),
                            data: d.data,
                          }"
                          #default="{
                            isSelected,
                            pendingLeaveTasksFactor,
                            data,
                          }"
                        >
                          <Scope
                            :d="{
                              isShowGroupBadge: !!(
                                (
                                  data.type === 'group' &&
                                  pendingLeaveTasksFactor > 0
                                )
                                // &&
                                // data.group?.totalFactor !== pendingLeaveTasksFactor
                              ),
                              isShowAnchorBadge: !!(
                                data.type === 'anchor' &&
                                pendingLeaveTasksFactor > 0
                              ),
                            }"
                            #default="{ isShowAnchorBadge, isShowGroupBadge }"
                          >
                            <SelectableTag
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
                              @click="
                                () => {
                                  currentId = d.id;
                                }
                              "
                              :progress="
                                data.type === 'group' && data.group
                                  ? (data.group.finishedFactor /
                                      data.group.totalFactor) *
                                    100
                                  : data.type === 'anchor' && data.anchor
                                    ? (calculateFinishLeaveTasksFactor(
                                        data.anchor.task.children.slice()
                                      ) /
                                        calculateTotalLeaveTasksFactorByTask(
                                          data.anchor.task
                                        )) *
                                      100
                                    : undefined
                              "
                              :icon="
                                data.type === 'group'
                                  ? (data.group?.icon ?? defaultTaskGroupIcon)
                                  : undefined
                              "
                              :hue="data.group?.color"
                              :selected="isSelected"
                              :title="
                                data.anchor?.task.content ?? data.group?.name
                              "
                              :content="
                                data.type === 'group'
                                  ? data.group?.description
                                  : ''
                              "
                              :menus="
                                data.type === 'group' && data.group
                                  ? [
                                      {
                                        name: $t('edit'),
                                        icon: EditOutlined,
                                        click: () => {
                                          return dialogs
                                            .EditTaskGroupDialog({
                                              taskGroup: d.data.group,
                                            })
                                            .finishPromise((g) => {
                                              if (g) {
                                                return taskGroupStore.updateTaskGroupById(
                                                  data.group!.id,
                                                  g
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
                                            data.group!.id
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
                                              content: $t(
                                                'deleteTaskGroupConfirm'
                                              ),
                                            })
                                            .finishPromise(() => {
                                              return taskGroupStore.deleteTaskGroupById(
                                                data.group!.id
                                              );
                                            });
                                        },
                                      },
                                    ]
                                  : data.anchor
                                    ? [
                                        {
                                          icon: DeleteOutlined,
                                          danger: true,
                                          name: $t('removeAnchor'),
                                          click: () =>
                                            taskAnchorStore.deleteTaskAnchorByTaskId(
                                              data.anchor!.taskId
                                            ),
                                        },
                                      ]
                                    : []
                              "
                            >
                              <template
                                #title-suffix
                                v-if="isShowAnchorBadge || isShowGroupBadge"
                              >
                                <Badge
                                  :invert="isSelected"
                                  :value="` ${data.type === 'group' && data.group?.totalFactor ? `${(((data.group.totalFactor - pendingLeaveTasksFactor!) / data.group.totalFactor) * 100).toFixed(1)} %` : `${pendingLeaveTasksFactor!}`}`"
                                  :hue="data.group?.color"
                                >
                                </Badge>
                              </template>
                              <template #title-prefix v-if="hasChildren">
                                <ExpandIcon
                                  :is-expand
                                  :no-children="!hasChildren"
                                  @click.stop="
                                    (e: GlobalTypes['MouseEvent']) => {
                                      if (e.ctrlKey || e.metaKey) {
                                        toggle({
                                          deep: true,
                                        });
                                      } else {
                                        toggle();
                                      }
                                    }
                                  "
                                >
                                </ExpandIcon>
                              </template>
                            </SelectableTag>
                          </Scope>
                        </Scope>
                      </DraggableTree>
                    </div>
                  </HeightTransition>
                </Scrollbar>
              </div>
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
                  v-if="finalType !== 'taskView'"
                  :key="finalId + finalType"
                >
                  <template
                    v-if="finalType === 'taskAnchor' && finalTaskAnchor"
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
                            ...(finalType === 'taskGroup'
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
                    :key="finalGroupId + finalType"
                    v-if="finalType === 'taskGroup'"
                  >
                    <TaskListTemplate
                      hide-group-name
                      :tasks="currentTreeTasks"
                    ></TaskListTemplate>
                  </div>
                  <div
                    class="size-full stretch"
                    v-else-if="finalType === 'taskAnchor' && taskAnchorTask"
                    :key="finalType"
                  >
                    <TaskListTemplate
                      hide-group-name
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
                    :tasks="(taskViewTasksMap[finalId]?.tasks || []).slice()"
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
                min="35%"
                storage-key="task-page-main-right-calendar-schedule"
              >
                <template #1>
                  <TaskCalendar
                    :padding-x="3"
                    class="bg-light py-3 border-b border-light-5 border-dashed"
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
<script lang="ts">
// build taskgroup with anchors tree
export type TaskGroupOrAnchor = {
  id: string;
  parentId: string | null;
  type: "group" | "anchor";
  group?: ReadOnlyTaskGroupWithExtra;
  anchor?: TaskAnchorWithTaskGroupId;
  children: TaskGroupOrAnchor[];
};
</script>
<script setup lang="ts">
import { dialogs } from "@/components/dialog";
import type {
  EntityWithRequiredKey,
  GetAPIParams,
  protocols,
} from "@/protocol";
import {
  BgColorsOutlined,
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
  TableOutlined,
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
  calculateTotalLeaveTasksFactorByTask,
  sortTaskAnchors,
  sortTaskGroups,
  sortTaskViews,
  useTaskListToolsOptions,
} from "@/utils/biz";
import {
  ReadOnlyTaskGroupWithExtra,
  ReadOnlyTaskViewWithExtra,
  ReadOnlyTaskWithChildren,
  TaskAnchor,
  TaskAnchorWithTaskGroupId,
  TaskGroupWithExtra,
} from "@/types";
import { DragData, GetDragDataType } from "@/bizComponents/drag/drag";
import {
  defaultPrimaryHue,
  defaultSortOrder,
  defaultTaskGroupIcon,
  defaultTaskViewIcon,
  motionDelay,
  motionTranslateX,
  sidebarPaddingX,
  taskViewPresets,
  themeHSL,
} from "@/const";
import { backend } from "@/utils/backend";
import { dayjs } from "@/utils/time";
import { buildTree, mapTree, traverse } from "@/utils/traverse";
import { getWindow, GlobalTypes } from "@/utils/window";
import DraggableTree, {
  DraggableTreeData,
} from "@/components/tree/DraggableTree.vue";
import { getParentFromTree } from "@/components/Loop.vue";
import { parentPort } from "worker_threads";
import { pending } from "@tauri-apps/plugin-notification";
import { ComponentExposed } from "vue-component-type-helpers";

const groupDraggableTreeRef = ref<ComponentExposed<typeof DraggableTree>>();
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
const taskAnchors = computed(() => taskAnchorStore.taskAnchors);
const taskAnchorsGroupByTaskGroupId = computed(
  () => taskAnchorStore.taskAnchorsGroupByTaskGroupId
);

function _findParent(task: ReadOnlyTaskWithChildren) {
  const taskAnchorDict = taskAnchorStore.taskAnchorsDictByTaskId;
  const taskParentId = task.parentId;
  if (taskParentId && taskAnchorDict[taskParentId]) {
    return taskAnchorDict[taskParentId].id;
  } else if (taskParentId) {
    const taskParent = taskStore.tasksDict[taskParentId];
    if (taskParent) {
      return _findParent(taskParent);
    }
  }
  return null;
}

const taskGroupTree = computed<
  DraggableTreeData<TaskGroupOrAnchor, ReadOnlyTaskWithChildren>[]
>(() => {
  // taskAnchor可能隔了一代，所以需要从taskStore找到自己的roots
  return mapTree(
    buildTree(
      taskGroupStore.nonArchivedTaskGroups
        .map(
          (d) =>
            ({
              id: d.id,
              type: "group",
              group: d,
              parentId: null,
              children: [],
            }) satisfies TaskGroupOrAnchor as TaskGroupOrAnchor
        )
        .concat(
          ...taskAnchors.value.map((d) => {
            return {
              id: d.id,
              type: "anchor",
              anchor: d,
              group: taskGroupStore.taskGroupsDict[d.taskGroupId],
              parentId: _findParent(d.task) || d.taskGroupId,
              children: [],
            } satisfies TaskGroupOrAnchor as TaskGroupOrAnchor;
          })
        )
    ),
    (d) => ({
      id: d.id,
      data: d,
      children: [],
    }),
    {
      sort: (a, b) => {
        if (a.data.type === b.data.type) {
          if (a.data.type === "group" && a.data.group && b.data.group) {
            return sortTaskGroups(a.data.group, b.data.group);
          }
          if (a.data.type === "anchor" && a.data.anchor && b.data.anchor) {
            return sortTaskAnchors(a.data.anchor, b.data.anchor);
          }
        }
        return 0;
      },
    }
  );
});

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
const finalId = computed(() => {
  return (
    [...taskGroups.value, ...taskAnchors.value, ...taskViews.value].find(
      (v) => v.id === currentId.value
    )?.id ?? [...taskGroups.value, ...taskViews.value]?.[0]?.id
  );
});
const finalType = computed<"taskAnchor" | "taskGroup" | "taskView">(() => {
  return taskGroups.value.find((g) => g.id === finalId.value)
    ? "taskGroup"
    : taskAnchors.value.find((a) => a.id === finalId.value)
      ? "taskAnchor"
      : taskViews.value.find((tv) => tv.id === finalId.value)
        ? "taskView"
        : "taskGroup";
});
// const finalType = useLocalStorage<"taskAnchor" | "taskGroup" | "taskView">(
//   pageDomain("finalType"),
//   "taskGroup"
// );
const { isShowFinishedTasks, isOnlyShowLeaves, filterEntity } =
  useTaskListToolsOptions();

const finalGroupId = computed(() =>
  finalType.value === "taskGroup"
    ? (taskGroups.value.find((g) => g.id === finalId.value)?.id ??
      taskGroups.value[0]?.id)
    : undefined
);
// const finalTaskAnchorId = computed(() =>
//   finalType.value === "taskAnchor"
//     ? taskAnchors.value.find((tv) => tv.id === finalId.value)?.id
//     : undefined
// );
const finalTaskAnchor = computed(() =>
  finalType.value === "taskAnchor"
    ? taskAnchors.value.find((tv) => tv.id === finalId.value)
    : undefined
);
const taskAnchorTask = computed(() => {
  return finalTaskAnchor.value?.taskId
    ? tasksDict.value[finalTaskAnchor.value.taskId]
    : undefined;
});
const finalTaskView = computed(() =>
  finalType.value === "taskView"
    ? taskViews.value.find((tv) => tv.id === finalId.value)
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
  [finalType, finalId],
  ([type, id]) => {
    Promise.all([fetchDataStore.loadingPromise()]).then(() => {
      if (type === "taskView" && taskViews.value.find((v) => v.id === id)) {
        taskViewStore.loadTasks(finalId.value);
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

function handleDropTaskView(d: DragData, taskView: ReadOnlyTaskViewWithExtra) {
  const tasks = d.datas as ReadOnlyTaskWithChildren[];
  return Promise.all(
    tasks.map(async (t) => {
      // return taskStore.updateTasksParent(t.id, null, {
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
