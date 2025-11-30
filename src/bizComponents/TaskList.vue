<template>
  <DraggableTree
    tree-custom-expand-element
    @order="
      (datas, dragDatas, droppedData) => {
        // 如果task 和d 不是一个groupid，需要更新groupid
        // 如果task 和d 不是一个parentId，需要更新parentId
        return taskStore.changeOrders(
          datas.map((d) => d.data),
          dragDatas.map((d) => ({
            id: d.id,
            ...(d.data.groupId !== droppedData?.data?.groupId &&
            droppedData?.data?.groupId
              ? { groupId: droppedData.data.groupId }
              : {}),
            ...(d.data.parentId !== droppedData?.data.parentId
              ? { parentId: droppedData?.data.parentId }
              : {}),
          }))
        );
      }
    "
    @change-parent="
      (d, to) => {
        return taskStore.updateTaskParent(d.id, to.id, {
          ...(d.data.groupId !== to.data.groupId
            ? {
                groupId: to.data.groupId,
              }
            : {}),
        });
      }
    "
    :model-value="treeDatas"
    :change-parent-channel="() => 'move-tasks'"
    :order-channel="() => 'order-task'"
    :order-disabled="() => disableOrder"
    :drag-datas="
      (d) => {
        return () => [
          {
            type: 'move-tasks',
            datas: [d].map((d) => d.data),
          },
          {
            type: `move-tasks-${d.data.groupId}`,
            datas: [d].map((d) => d.data),
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
    :change-parent-channel-data-adapter="
      (channel, d) => {
        if (channel.startsWith('move-tasks')) {
          return mapTree([d as GetDragDataType<'move-tasks'>[number]], (t) => ({
            id: t.id,
            data: t,
            children: [],
          }))[0];
        }
        return undefined;
      }
    "
    :order-channel-data-adapter="
      (channel, d) => {
        if (channel.startsWith('order-task')) {
          return mapTree([d as GetDragDataType<'order-task'>[number]], (t) => ({
            id: t.id,
            data: t,
            children: [],
          }))[0];
        }
        return undefined;
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
        :model-value="t.data"
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
import { DragData, GetDragDataType } from "./drag/drag";
import { motionDelay, motionTranslateX } from "@/const";
import { useTaskStore } from "@/store/task";
import { mapTree } from "@/utils/traverse";
import { DraggableTreeData } from "@/components/tree/DraggableTree.vue";
import { channel } from "diagnostics_channel";

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

const taskStore = useTaskStore();

const treeDatas = computed(() =>
  mapTree(props.modelValue, (d) => {
    return {
      id: d.id,
      data: d,
      children: [],
    } satisfies DraggableTreeData<
      ReadOnlyTaskWithChildren,
      ReadOnlyTaskWithChildren
    > as DraggableTreeData<ReadOnlyTaskWithChildren, ReadOnlyTaskWithChildren>;
  })
);
</script>
