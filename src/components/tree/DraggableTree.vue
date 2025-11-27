<template>
  <Define #default="{ isTop, datas, data, index, isBottom }">
    <div class="relative">
      <BizDrop
        :channel="orderChannel?.(data as D)"
        :disabled="orderDisabled?.(data as D)"
        @drop="
          (channel, d) => {
            // order
            let componentChannel = orderChannel?.(data as D) || [];
            if (!(componentChannel instanceof Array)) {
              componentChannel = [componentChannel];
            }
            if (componentChannel.includes(channel)) {
              const newDatas = [...datas] as D[];
              const ds = d.datas.map(
                (d) => orderChannelDataAdapter?.(channel, d) ?? d
              ) as D[];
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
                // 如果task 和d 不是一个groupid，需要更新groupid
                // 如果task 和d 不是一个parentId，需要更新parentId
                const toIndex = isTop ? newIndex : newIndex + 1;
                newDatas.splice(toIndex, 0, ...ds);
                $emit('order', newDatas, ds, data as D);
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
              isTop ? '' : isBottom ? '-translate-y-full' : '-translate-y-1/2',
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
    </div>
  </Define>
  <Tree
    class="overflow-x-hidden"
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
              if (channel === changeParentChannel?.(t)) {
                const datas = d.datas as Data[];
                datas.forEach(async (d) => {
                  // 如果t 是d的子孙item 或t和d一致，则不允许移动
                  if (d.id === t.id) {
                    console.warn('无法将item移动到其自身');
                    return;
                  }
                  if (traverseSome(d.children.slice(), (d) => d.id === t.id)) {
                    // return dialogs.MessageDialog({
                    //   content: $t('cannotMoveTaskToDescendant'),
                    // });
                    console.warn('无法将item移动到其子孙节点');
                    return;
                  } else {
                    $emit('change-parent', d as D, t as D);
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
<script
  setup
  lang="ts"
  generic="D extends Readonly<Partial<Record<string, any>> & { id: string }>"
>
import { traverseSome } from "@/utils/traverse";
import { ComponentProps } from "vue-component-type-helpers";
import BizDrop from "@/bizComponents/drag/BizDrop.vue";
import BizDrag from "@/bizComponents/drag/BizDrag.vue";
import { TreeExpandStrategy } from "./Tree.vue";
import { DragDataType } from "@/bizComponents/drag/drag";

type Data = Partial<Record<string, any>> & {
  id: string;
};
const props = withDefaults(
  defineProps<{
    modelValue: D[];

    dragDatas?: (d: D) => ComponentProps<typeof BizDrag>["dragDatas"];

    orderChannel?: (d: D) => ComponentProps<typeof BizDrop>["channel"];
    orderChannelDataAdapter?: (channel: DragDataType, d: any) => D | undefined;
    orderDisabled?: (d: D) => ComponentProps<typeof BizDrop>["disabled"];

    changeParentChannel?: (d: D) => ComponentProps<typeof BizDrop>["channel"];
    changeParentDisabled?: (d: D) => ComponentProps<typeof BizDrop>["disabled"];

    // tree relative
    treeExpandStrategy?: TreeExpandStrategy;
    treeExpandsStorageKey?: string;
    treeCustomExpandElement?: boolean;
  }>(),
  {}
);

defineEmits<{
  (e: "order", newDatasOrdered: D[], dragDatas: D[], droppedData?: D): void;
  (e: "change-parent", dragData: D, droppaedData: D): void;
}>();

const [Define, Template] = createReusableTemplate<{
  isTop: boolean;
  isBottom: boolean;
  datas: Data[];
  data: Data;
  index: number;
}>();
</script>
