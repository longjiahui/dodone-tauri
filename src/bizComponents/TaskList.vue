<template>
  <DraggableTree
    tree-custom-expand-element
    @order="
      (datas, dragDatas, droppedData) => {
        // 如果task 和d 不是一个groupid，需要更新groupid
        // 如果task 和d 不是一个parentId，需要更新parentId
        return taskStore.changeOrders(
          datas,
          dragDatas.map((d) => ({
            id: d.id,
            ...(d.groupId !== droppedData?.groupId && droppedData?.groupId
              ? { groupId: droppedData.groupId }
              : {}),
            ...(d.parentId !== droppedData?.parentId
              ? { parentId: droppedData?.parentId }
              : {}),
          }))
        );
      }
    "
    @change-parent="
      (d, to) => {
        return taskStore.updateTaskParent(d.id, to.id, {
          ...(d.groupId !== to.groupId
            ? {
                groupId: to.groupId,
              }
            : {}),
        });
      }
    "
    :model-value
    :change-parent-channel="() => 'move-tasks'"
    :order-channel="() => 'order-task'"
    :order-disabled="() => disableOrder"
    :drag-datas="
      (d) => {
        return () => [
          {
            type: 'move-tasks',
            datas: [d],
          },
          {
            type: `move-tasks-${d.groupId}`,
            datas: [d],
          },
          ...(disableOrder
            ? []
            : [
                {
                  type: 'order-task',
                  datas: [d],
                } satisfies DragData<any>,
              ]),
        ];
      }
    "
    #default="{ item: t, index, hasChildren, toggle, isExpand }"
  >
    <div
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
  </DraggableTree>
</template>
<script setup lang="ts">
import type { ReadOnlyTaskWithChildren } from "@/types";
import { CaretRightOutlined } from "@ant-design/icons-vue";
import { DragData } from "./drag/drag";
import { motionDelay, motionTranslateX } from "@/const";
import { useTaskStore } from "@/store/task";

withDefaults(
  defineProps<{
    modelValue: ReadOnlyTaskWithChildren[];
    background?: number;

    taskDropdownHideDelete?: boolean;
    disableOrder?: boolean;
    taskHideGroupName?: boolean;
  }>(),
  {}
);

const taskStore = useTaskStore();
</script>
