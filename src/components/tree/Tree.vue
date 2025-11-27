<template>
  <Loop
    ref="loopRef"
    :children-key="childrenKey"
    :model-value="loopDatas"
    :data-key="dataKey as keyof T"
    @update:expands="
      (data) => {
        Object.assign(expands, data);
      }
    "
  >
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
<script
  setup
  lang="ts"
  generic="T extends Partial<Record<string | number, any>>"
>
import { useElementSize } from "@vueuse/core";
import Loop from "../Loop.vue";
import type { ComponentExposed } from "vue-component-type-helpers";
import { CaretRightOutlined } from "@ant-design/icons-vue";
import { traverse } from "@/utils/traverse";

const props = withDefaults(
  defineProps<{
    loopDatas?: T[];
    childrenKey?: string;
    dataKey?: keyof T;
    modelValue?: string | number;
    customExpandElement?: boolean;

    // 存储展开状态的键
    expandsStorageKey?: string;
    expandStrategy?: TreeExpandStrategy;
  }>(),
  {
    loopDatas: () => [],
    childrenKey: undefined,
    dataKey: "id",
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
    result[d[props.dataKey]] = layer;
  });
  return result;
});
type ExpandsType = Partial<Record<string | number, boolean>>;

function getFinalExpand(key: string | number) {
  const state = expands.value[key];
  if (typeof state !== "boolean") {
    // 如果没有记录，则根据props.expandStrategy来判断
    switch (props.expandStrategy) {
      case "none":
        return false;
      case "all":
        return true;
      case "firstLayer":
        return datasLayerDict.value[key] < 1;
    }
  } else {
    return state;
  }
}
const expands = props.expandsStorageKey
  ? useLocalStorage<ExpandsType>(props.expandsStorageKey, {})
  : ref<ExpandsType>({});

onMounted(() => {
  watch(
    () => props.loopDatas,
    async (datas) => {
      traverse(datas, (d) => {
        console.debug(
          (d as any)?.id,
          (d as any)?.group?.name,
          expands.value[d[props.dataKey]]
        );
        if (typeof expands.value[d[props.dataKey]] !== "boolean") {
          expands.value[d[props.dataKey]] = getFinalExpand(d[props.dataKey]);
        }
      });
    },
    {
      immediate: true,
      deep: true,
    }
  );
  // setTimeout(
  //   () =>
  //     loopRef.value?.toggleAll({
  //       toState: true,
  //       duration: 0.3,
  //     }),
  //   1000
  // );
  watch(
    expands,
    async (values, olds) => {
      const openKeys = Object.keys(values).filter(
        (key) => values[key] && !olds?.[key]
      );
      const closeKeys = olds
        ? Object.keys(olds).filter((key) => !values[key] && olds[key])
        : [];
      await nextTick();
      await Promise.all([
        ...openKeys.map((key) =>
          loopRef.value?.toggle(key, {
            toState: true,
            duration: 0,
          })
        ),
        ...closeKeys.map((key) => {
          loopRef.value?.toggle(key, {
            toState: false,
            duration: 0,
          });
        }),
      ]);
    },
    { immediate: true, deep: true }
  );
});
</script>
