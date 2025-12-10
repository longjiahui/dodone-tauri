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
        <ExpandIcon
          v-if="!customExpandElement"
          @click.stop="
            (e: GlobalTypes['MouseEvent']) => {
              if (e.metaKey || e.ctrlKey) {
                toggle({
                  deep: true,
                });
              } else {
                toggle();
              }
            }
          "
          :is-expand
          :no-children="!hasChildren"
        ></ExpandIcon>
        <div class="stretch self-stretch">
          <slot
            v-bind="{
              item,
              toggle,
              hasChildren,
              isExpand,
              index,
              datas,
              layer,
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
import Loop, { ExpandOption, LoopData } from "../Loop.vue";
import type { ComponentExposed } from "vue-component-type-helpers";
import { flatMapTree, traverse } from "@/utils/traverse";
import { GlobalTypes } from "@/utils/window";

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
type ExpandsType = Partial<Record<string, ExpandOption>>;

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
  const state = expands.value[key]?.isExpand;
  const finalState = !!state;
  // 如果没有children，返回false
  // const data = loopDatasDict.value[key];
  // const hasChildren = !!data?.children?.length;
  if (typeof state !== "boolean") {
    // 如果没有记录
    // if (hasChildren) {
    // 则根据props.expandStrategy来判断
    switch (props.expandStrategy) {
      case "none":
        return false;
      case "all":
        return true;
      case "firstLayer":
        return datasLayerDict.value[key] < 1;
    }
    // } else {
    //   return false;
    // }
  } else {
    // return hasChildren ? finalState : false;
    return finalState;
  }
}

const expands = props.expandsStorageKey
  ? useLocalStorage<ExpandsType>(props.expandsStorageKey, {})
  : ref<ExpandsType>({});

onMounted(() => {
  watch(
    () => props.loopDatas,
    async (datas, _olds) => {
      const newExpands: Record<string, boolean> = {};
      traverse(datas, (d) => {
        newExpands[d.id] = getFinalExpand(d.id);
      });
      expands.value = Object.keys(newExpands).reduce(
        (acc, k) => {
          acc[k] = { isExpand: newExpands[k] };
          return acc;
        },
        {} as Partial<Record<string, ExpandOption>>
      );
    },
    {
      immediate: true,
    }
  );
});

defineExpose({
  toggles: (keys: string[], toState: boolean, deep = false) => {
    keys.forEach((k) => {
      expands.value[k] = { isExpand: toState };
      if (deep) {
        const data = loopDatasDict.value[k];
        if (data?.children?.length) {
          traverse(data.children, (d) => {
            expands.value[d.id] = { isExpand: toState };
          });
        }
      }
    });
  },
  toggleAll: (toState: boolean) => {
    Object.keys(loopDatasDict.value).forEach((k) => {
      console.debug("hello world toggle all", toState);
      expands.value[k] = { isExpand: toState };
    });
    console.debug(expands.value);
  },
});
</script>
