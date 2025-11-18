<template>
  <div class="v">
    <DefineBizDropStyle
      #default="{ setRef, isDroppingActive, isDragging, isTop }"
    >
      <div
        :ref="setRef"
        :class="[
          'absolute left-0 h-1/2 w-full',
          !!isTop ? 'top-0' : 'bottom-0',
          isDragging ? 'pointer-events-auto z-10' : 'pointer-events-none',
        ]"
      >
        <div
          :class="[
            'bg-primary-dark absolute h-1 w-full opacity-0 duration-300',
            isTop ? 'top-0' : 'bottom-0',
            isDroppingActive ? 'opacity-100' : '',
          ]"
        >
          <!-- <div :ref="setRef" :class="['h z-20 w-full items-center']">
            <div
              :class="[
                'bg-primary-dark h-1 w-full opacity-100 duration-300',
                isDroppingActive ? 'opacity-100' : '',
              ]"
            ></div>
          </div> -->
        </div>
      </div>
    </DefineBizDropStyle>
    <template v-for="(d, i) in datas" :key="d[dataKey]">
      <BizDrag :drag-datas="() => dragDatas(d, i)" #default="{ setRef }">
        <div class="relative">
          <BizDrop
            :channel="dropChannel(d, i)"
            @drop="(c, dragData) => dropEvents(d, i, c, dragData)"
            #default="{ setRef, isDroppingActive, isDragging }"
          >
            <UseBizDropStyle
              :setRef="setRef"
              :isDroppingActive
              :isDragging
              :is-top="true"
            >
            </UseBizDropStyle>
          </BizDrop>
          <slot
            v-bind="{
              data: d,
              index: i,
              setDragRef: setRef,
            }"
          ></slot>
          <!-- v-if="i > 0" -->
          <BizDrop
            :channel="dropChannel(d, i + 1)"
            @drop="(c, dragData) => dropEvents(d, i + 1, c, dragData)"
            #default="{ setRef, isDroppingActive, isDragging }"
          >
            <UseBizDropStyle :setRef="setRef" :isDroppingActive :is-dragging>
            </UseBizDropStyle>
          </BizDrop>
        </div>
      </BizDrag>
    </template>
  </div>
</template>
<script setup lang="ts" generic="T">
import { DragData } from "./drag/drag";
const props = withDefaults(
  defineProps<{
    datas: T[];
    dataKey?: keyof T;
    dragDatas: (d: T, index: number) => DragData<T>[];
    dropChannel: (d: T, index: number) => DragData["type"] | DragData["type"][];
    dropAreaWidth?: number;
  }>(),
  {
    dataKey: "id" as keyof T,
    dropAreaWidth: 32,
  }
);

const emit = defineEmits<{
  (e: "order", datas: T[]): void;
}>();
const [DefineBizDropStyle, UseBizDropStyle] = createReusableTemplate<{
  setRef: any;
  isDroppingActive: boolean;
  isDragging: boolean;
  isTop?: boolean;
}>();

function dropEvents(
  _d: T,
  i: number,
  _channel: DragData["type"],
  dragData: DragData<T>
) {
  // 先新增，再删除
  const newDataKeys: any[] = dragData.datas.map(
    (d) => d[props.dataKey as keyof T]
  );
  const tempDatas = [...props.datas];
  tempDatas.splice(i, 0, ...dragData.datas);
  const finalDatas: typeof tempDatas = [];
  tempDatas.forEach((td, index) => {
    if (index < i) {
      if (newDataKeys.includes(td[props.dataKey as keyof T])) {
        // 什么都不做
      } else {
        finalDatas.push(td);
      }
    } else if (index > i + dragData.datas.length - 1) {
      if (newDataKeys.includes(td[props.dataKey as keyof T])) {
        // 什么都不做
      } else {
        finalDatas.push(td);
      }
    } else {
      finalDatas.push(td);
    }
  });
  emit("order", finalDatas);
}
</script>
