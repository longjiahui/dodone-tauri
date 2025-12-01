<template>
  <Define #default="{ isTop, datas, data, index, isBottom }">
    <div class="relative">
      <Scope
        :d="{ data: data as Data, datas: datas as Data[] }"
        #default="{ data, datas }"
      >
        <BizDrop
          :channel="orderChannel?.(data)"
          :disabled="orderDisabled?.(data)"
          @drop="
            (channel, d) => {
              // order
              let componentChannel = orderChannel?.(data) || [];
              if (!(componentChannel instanceof Array)) {
                componentChannel = [componentChannel];
              }
              if (componentChannel.includes(channel)) {
                const newDatas = [...datas];
                const ds = d.datas.map(
                  (d) => orderChannelDataAdapter?.(channel, d) ?? d
                ) as Data[];
                // 如果有旧数据先取出来
                ds.forEach((d) => {
                  const ind = newDatas.findIndex((data) => data.id === d.id);
                  if (ind > -1) {
                    newDatas.splice(ind, 1);
                  }
                });
                // 查找新的index
                const newIndex = newDatas.findIndex((d) => d.id === data.id);
                if (newIndex > -1) {
                  const toIndex = isTop ? newIndex : newIndex + 1;
                  newDatas.splice(toIndex, 0, ...ds);
                  $emit(
                    'order',
                    newDatas,
                    ds,
                    data,
                    // find data's parents
                    traverse(modelValue, (d, _, __, ps) => {
                      if (d.id === data.id) {
                        return ps;
                      }
                    }) || []
                  );
                } else {
                  // return dialogs.MessageDialog({
                  //   content: $t('cannotAdjustTaskOrderCausePositionNotExist'),
                  // });
                  console.warn('无法调整item顺序，目标位置不存在');
                }
              }
            }
          "
          #default="{ setRef, isDroppingActive, isDragging }"
        >
          <div class="relative">
            <div
              :ref="setRef"
              :class="[
                'h z-10',
                // 'bg-primary-dark/20',
                'absolute top-0 left-0 h-4 w-full',
                isTop
                  ? ''
                  : isBottom
                    ? '-translate-y-full'
                    : '-translate-y-1/2',
                isDragging ? 'pointer-events-auto' : 'pointer-events-none',
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
      </Scope>
    </div>
  </Define>
  <Tree
    class="overflow-hidden"
    :loop-datas="props.modelValue"
    v-if="props.modelValue.length > 0"
    :custom-expand-element="treeCustomExpandElement"
    :expand-strategy="treeExpandStrategy"
    :expands-storage-key="treeExpandsStorageKey"
  >
    <template #default="{ item: t, index, datas, ...rest }">
      <Template
        :data="t"
        :is-top="true && index === 0"
        v-if="index === 0"
        :datas="datas"
        :index
        :is-bottom="false"
      ></Template>
      <BizDrag :drag-datas="dragDatas?.(t) || (() => [])" #default="{ setRef }">
        <BizDrop
          :channel="changeParentChannel?.(t)"
          :disabled="changeParentDisabled?.(t)"
          @drop="
            (channel, d) => {
              let componentChannel = changeParentChannel?.(t) || [];
              if (!(componentChannel instanceof Array)) {
                componentChannel = [componentChannel];
              }
              if (componentChannel.includes(channel)) {
                const datas = d.datas.map((d) =>
                  changeParentChannelDataAdapter
                    ? changeParentChannelDataAdapter(channel, d)
                    : d
                ) as (Data | undefined)[];
                datas
                  .filter((d) => !!d)
                  .map((d) => d!)
                  .forEach(async (d) => {
                    // 如果t 是d的子孙item 或t和d一致，则不允许移动
                    if (d.id === t.id) {
                      console.warn('无法将item移动到其自身');
                      return;
                    }
                    if (
                      traverseSome(d?.children?.slice(), (d) => d.id === t.id)
                    ) {
                      // return dialogs.MessageDialog({
                      //   content: $t('cannotMoveTaskToDescendant'),
                      // });
                      console.warn('无法将item移动到其子孙节点');
                      return;
                    } else {
                      $emit('change-parent', d, t);
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
            <slot
              v-bind="{
                item: t,
                index,
                datas,
                ...rest,
              }"
            ></slot>
          </div>
        </BizDrop>
      </BizDrag>
      <Template
        :is-bottom="index === datas.length - 1"
        :is-top="false"
        :datas
        :data="t"
        :index
      ></Template>
    </template>
  </Tree>
  <Empty v-else></Empty>
</template>
<script lang="ts">
export interface DraggableTreeData<D, T> extends LoopData<D> {
  dragData?: T;
}
</script>
<script setup lang="ts" generic="Data extends DraggableTreeData<any, any>">
import { traverse, traverseSome } from "@/utils/traverse";
import { ComponentProps } from "vue-component-type-helpers";
import BizDrop from "@/bizComponents/drag/BizDrop.vue";
import BizDrag from "@/bizComponents/drag/BizDrag.vue";
import { TreeExpandStrategy } from "./Tree.vue";
import { DragDataType } from "@/bizComponents/drag/drag";
import { LoopData } from "../Loop.vue";

const props = withDefaults(
  defineProps<{
    modelValue: Data[];

    dragDatas?: (d: Data) => ComponentProps<typeof BizDrag>["dragDatas"];

    orderChannel?: (d: Data) => ComponentProps<typeof BizDrop>["channel"];
    orderChannelDataAdapter?: (
      channel: DragDataType,
      d: any
    ) => Data | Pick<Data, "dragData"> | undefined;
    orderDisabled?: (d: Data) => ComponentProps<typeof BizDrop>["disabled"];

    changeParentChannel?: (
      d: Data
    ) => ComponentProps<typeof BizDrop>["channel"];
    changeParentChannelDataAdapter?: (
      channel: DragDataType,
      d: any
    ) => Data | Pick<Data, "dragData"> | undefined;
    changeParentDisabled?: (
      d: Data
    ) => ComponentProps<typeof BizDrop>["disabled"];

    // tree relative
    treeExpandStrategy?: TreeExpandStrategy;
    treeExpandsStorageKey?: string;
    treeCustomExpandElement?: boolean;
  }>(),
  {}
);

defineEmits<{
  (
    e: "order",
    newDatasOrdered: Data[],
    dragDatas: Data[],
    droppedData: Data,
    ps: Data[]
  ): void;
  (e: "change-parent", dragData: Data, droppaedData: Data): void;
}>();
type D = DraggableTreeData<any, any>;
const [Define, Template] = createReusableTemplate<{
  isTop: boolean;
  isBottom: boolean;
  data: D;
  datas: D[];
  index: number;
}>();
</script>
