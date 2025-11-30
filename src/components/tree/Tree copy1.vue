<template>
  <Loop ref="loopRef" :model-value="loopDatas" v-model:expands="expands">
    <template
      #default="{ item, toggle, isExpand, layer, hasChildren, index, datas }"
    >
      <div :class="['flex items-center gap-1 rounded']">
        <div
          v-if="layer > 0"
          :style="{
            width: Math.min(width - 104, +layer * 40) + 'px',
          }"
        ></div>
        <!-- v-if="hasChildren" -->
        <CaretRightOutlined
          v-if="!customExpandElement"
          @click.stop="toggle()"
          :class="[
            'transition-transform duration-300',
            isExpand ? 'rotate-90' : '',
            hasChildren ? 'opacity-100' : 'opacity-0',
          ]"
        ></CaretRightOutlined>
        <div class="stretch self-stretch">
          <slot
            v-bind="{
              item,
              toggle,
              hasChildren,
              isExpand,
              index,
              datas,
            }"
          ></slot>
        </div>
      </div>
    </template>
  </Loop>
</template>
<script lang="ts">
export type TreeExpandStrategy = "firstLayer" | "all" | "none";
</script>
<script setup lang="ts" generic="T extends LoopData<any>">
import { useElementSize } from "@vueuse/core";
import Loop, { LoopData } from "../Loop.vue";
import type { ComponentExposed } from "vue-component-type-helpers";
import { CaretRightOutlined } from "@ant-design/icons-vue";
import { flatMapTree, traverse } from "@/utils/traverse";

const props = withDefaults(
  defineProps<{
    loopDatas?: T[];
    modelValue?: string | number;
    customExpandElement?: boolean;

    // 存储展开状态的键
    expandsStorageKey?: string;
    expandStrategy?: TreeExpandStrategy;
  }>(),
  {
    loopDatas: () => [],
    modelValue: undefined,
    customExpandElement: undefined,
    expandStrategy: "none",
  }
);
const loopRef = ref<ComponentExposed<typeof Loop>>();
const { width } = useElementSize(loopRef as any);

const datasLayerDict = computed(() => {
  const result: Record<string | number, number> = {};
  traverse(props.loopDatas, (d, _, __, ___, layer) => {
    result[d.id] = layer;
  });
  return result;
});
type ExpandsType = Partial<Record<string | number, boolean>>;

const loopDatasDict = computed(
  () =>
    flatMapTree(props.loopDatas || [], (d) => d)?.reduce(
      (acc, d) => {
        acc[d.id] = d;
        return acc;
      },
      {} as Partial<Record<string | number, T>>
    ) || {}
);

function getFinalExpand(key: string | number) {
  const state = expands.value[key];
  // 如果没有children，返回false
  const data = loopDatasDict.value[key];
  const hasChildren = !!data?.children?.length;
  if (typeof state !== "boolean") {
    // 如果没有记录
    if (hasChildren) {
      // 则根据props.expandStrategy来判断
      switch (props.expandStrategy) {
        case "none":
          return false;
        case "all":
          return true;
        case "firstLayer":
          return datasLayerDict.value[key] < 1;
      }
    } else {
      return false;
    }
  } else {
    return hasChildren ? state : false;
  }
}
const expands = props.expandsStorageKey
  ? useLocalStorage<ExpandsType>(props.expandsStorageKey, {})
  : ref<ExpandsType>({});

// onMounted(() => {
//   watch(
//     () => props.loopDatas,
//     async (datas, _olds) => {
//       const newExpands: ExpandsType = {};
//       traverse(datas, (d) => {
//         newExpands[d.id] = getFinalExpand(d.id);
//       });
//       // 这里要赋予新对象是因为 后面expands的watch是根据new olds来判断的，如果不是新对象那么new和old是同一个对象，无法判断出更新了什么
//       expands.value = { ...newExpands };
//     },
//     {
//       immediate: true,
//       deep: true,
//     }
//   );

//   let _isExpandsWatchCalledOnce = false;
//   watch(
//     expands,
//     async (values, olds) => {
//       const duration = !_isExpandsWatchCalledOnce ? 0 : 0.3;
//       _isExpandsWatchCalledOnce = true;
//       const openKeys = Object.keys(values).filter(
//         (key) => values[key] && !olds?.[key]
//       );
//       const closeKeys = olds
//         ? Object.keys(olds).filter((key) => !values[key] && olds[key])
//         : [];
//       // await new Promise((r) => setTimeout(r));
//       await nextTick();
//       await Promise.all([
//         ...openKeys.map((key) =>
//           loopRef.value?.toggle(key, {
//             toState: true,
//             duration,
//           })
//         ),
//         ...closeKeys.map((key) => {
//           loopRef.value?.toggle(key, {
//             toState: false,
//             duration,
//           });
//         }),
//       ]);
//     },
//     { immediate: true, deep: true }
//   );
// });
</script>
