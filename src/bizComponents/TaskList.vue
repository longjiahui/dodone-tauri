<template>
  <Define #default="{ isTop, datas, task, index, isBottom }">
    <div class="relative">
      <BizDrop
        channel="order-task"
        :disabled="disableOrder"
        @drop="
          (channel, d) => {
            // order
            if (channel === 'order-task') {
              const newDatas = [...datas];
              const ds = d.datas as ReadOnlyTaskWithChildren[];
              // 如果有旧数据先取出来
              ds.forEach((d) => {
                const ind = newDatas.findIndex((data) => data.id === d.id);
                if (ind > -1) {
                  newDatas.splice(ind, 1);
                }
              });
              // 查找新的index
              const newIndex = newDatas.findIndex((d) => d.id === task.id);
              if (newIndex > -1) {
                // 如果task 和d 不是一个groupid，需要更新groupid
                // 如果task 和d 不是一个parentId，需要更新parentId
                const toIndex = isTop ? newIndex : newIndex + 1;
                newDatas.splice(toIndex, 0, ...ds);
                return taskStore.changeOrders(
                  newDatas,
                  ds.map((d) => ({
                    id: d.id,
                    ...(d.groupId !== task.groupId
                      ? { groupId: task.groupId }
                      : {}),
                    ...(d.parentId !== task.parentId
                      ? { parentId: task.parentId }
                      : {}),
                  }))
                );
              } else {
                // return dialogs.MessageDialog({
                //   content: $t('cannotAdjustTaskOrderCausePositionNotExist'),
                // });
                console.warn('无法调整任务顺序，目标位置不存在');
              }
            }
          }
        "
        #default="{ setRef, isDroppingActive }"
      >
        <div class="relative">
          <div
            :ref="setRef"
            :class="[
              'h z-10',
              // 'bg-primary-dark/20',
              'absolute top-0 left-0 h-4 w-full',
              isTop ? '' : isBottom ? '-translate-y-full' : '-translate-y-1/2',
            ]"
          >
            <div
              :class="[
                'absolute z-20 h-1.5 w-full rounded',
                isTop ? 'top-0' : isBottom ? 'bottom-0' : '',
                isDroppingActive ? 'bg-primary-dark' : '',
              ]"
            ></div>
          </div>
        </div>
      </BizDrop>
    </div>
  </Define>
  <Tree
    :loop-datas="props.modelValue"
    v-if="props.modelValue.length > 0"
    custom-expand-element
    do-not-expand-first
  >
    <template
      #default="{ item: t, toggle, isExpand, hasChildren, index, datas }"
    >
      <Template
        :task="t"
        :is-top="true && index === 0"
        v-if="index === 0"
        :datas="datas"
        :index
        :is-bottom="false"
      ></Template>
      <BizDrag
        :drag-datas="
          () => [
            {
              type: 'move-tasks',
              datas: [t],
            },
            {
              type: `move-tasks-${t.groupId}`,
              datas: [t],
            },
            ...(disableOrder
              ? []
              : [
                  {
                    type: 'order-task',
                    datas: [t],
                  } satisfies DragData<any>,
                ]),
          ]
        "
        #default="{ setRef }"
      >
        <BizDrop
          channel="move-tasks"
          @drop="
            (channel, d) => {
              if (channel === 'move-tasks') {
                const datas = d.datas as ReadOnlyTaskWithChildren[];
                datas.forEach(async (d) => {
                  // 如果t 是d的子孙任务 或t和d一致，则不允许移动
                  if (d.id === t.id) {
                    console.warn('无法将任务移动到其自身');
                    return;
                  }
                  if (traverseSome(d.children.slice(), (d) => d.id === t.id)) {
                    // return dialogs.MessageDialog({
                    //   content: $t('cannotMoveTaskToDescendant'),
                    // });
                    console.warn('无法将任务移动到其子孙任务中');
                    return;
                  } else {
                    return taskStore.updateTaskParent(d.id, t.id, {
                      ...(d.groupId !== t.groupId
                        ? {
                            groupId: t.groupId,
                          }
                        : {}),
                    });
                  }
                });
              }
            }
          "
          #default="{ setRef: bizDropSetRef, isDroppingActive }"
        >
          <div
            :class="[
              'drop-area mb-2',
              isDroppingActive ? 'dropping-active' : '',
            ]"
            :ref="
              (el) => {
                setRef(el);
                bizDropSetRef(el);
              }
            "
          >
            <Task
              :hide-group-name="taskHideGroupName"
              :model-value="t"
              :background
              :dropdown-hide-delete="taskDropdownHideDelete"
            >
              <template #beforeContent v-if="hasChildren">
                <CaretRightOutlined
                  @click.stop="toggle()"
                  :class="[
                    'transition-transform duration-300',
                    isExpand ? 'rotate-90' : '',
                    hasChildren ? 'opacity-100' : 'opacity-0',
                  ]"
                ></CaretRightOutlined>
              </template>
              <template #task-tools-before-delete="d">
                <slot name="task-tools-before-delete" v-bind="d"></slot>
              </template>
            </Task>
          </div>
        </BizDrop>
      </BizDrag>
      <Template
        :is-bottom="index === datas.length - 1"
        :is-top="false"
        :datas
        :task="t"
        :index
      ></Template>
    </template>
  </Tree>
  <Empty v-else></Empty>
</template>
<script setup lang="ts">
import { dialogs } from "@/components/dialog";
import { useTaskStore } from "@/store/task";
import type { ReadOnlyTaskWithChildren } from "@/types";
import { sortTasks } from "@/utils/biz";
import { mapTree, traverseSome } from "@/utils/traverse";
import { CaretRightOutlined } from "@ant-design/icons-vue";
import { DragData } from "./drag/drag";
import { type TaskSort } from "./sort";

const props = withDefaults(
  defineProps<{
    modelValue: ReadOnlyTaskWithChildren[];
    background?: number;

    taskDropdownHideDelete?: boolean;
    disableOrder?: boolean;
    taskHideGroupName?: boolean;
  }>(),
  {}
);

defineEmits<{
  (e: "order", val: ReadOnlyTaskWithChildren[]): void;
}>();

// const taskSort = ref<TaskSort>({
//   field: "priority",
//   order: "asc",
// })
// const finalTasks = computed(() => {
//   return mapTree(props.modelValue.slice(), (t) => ({ ...t }), {
//     sort: (a, b) => sortTasks(a, b, taskSort.value),
//   })
// })

const taskStore = useTaskStore();

const [Define, Template] = createReusableTemplate<{
  isTop: boolean;
  isBottom: boolean;
  datas: ReadOnlyTaskWithChildren[];
  task: ReadOnlyTaskWithChildren;
  index: number;
}>();
</script>
