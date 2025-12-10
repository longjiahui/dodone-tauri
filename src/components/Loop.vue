<template>
  <div
    ref="container"
    :class="[containerClass]"
    :style="{
      '--layer': layer,
    }"
  >
    <div
      v-for="(item, index) in modelValue"
      :key="item.id"
      :class="[wrapperClass]"
    >
      <slot
        name="default"
        :id="item.id"
        :item="item"
        :datas="modelValue"
        :index="index"
        :layer="layer"
        :children="item.children as T[]"
        :has-children="item.children.length > 0"
        :toggle="(options?: ToggleOptions) => toggleByData(item, options)"
        :is-expand="!!expands[item.id]?.isExpand"
        :parent="parent"
      ></slot>
      <!-- 如果不触发transition 会有问题，不能展开时可以检查一下是否触发transitionend -->
      <!-- 这里不使用 overflow-hidden 是因为 table使用sticky做冻结列的时候会因为overflow-hidden而不生效 -->
      <HeightTransition>
        <!-- @leave="(el, done) => $motions.subLoop.leave(done)" -->
        <!-- v-motion="subLoop" -->
        <div v-if="expands[item.id]?.isExpand">
          <!-- style="contain: paint" -->
          <Loop
            ref="subLoopRefs"
            v-bind="props"
            class="sub-loop"
            :model-value="(item.children || []) as T[]"
            :layer="layer + 1"
            :parent="item"
            :toggle-parent="
              async (options?: ToggleOptions) => {
                console.debug('in toggle parent: ', item, options);
                await toggleByData(item, options);
                await toggleParent?.(options);
              }
            "
            :wrapper-class="wrapperClass"
            :container-class="containerClass"
            :do-not-expand-first="true"
            :hide-children
            v-model:expands="expands"
          >
            <template #default="subItem">
              <slot v-bind="subItem"></slot>
            </template>
          </Loop>
        </div>
      </HeightTransition>
      <!-- </transition> -->
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: "Loop",
};
export type LoopData<T> = {
  id: string;
  children: LoopData<T>[];
  data: T;
};

export type ExpandOption = {
  isExpand: boolean;
};

export function getParentFromTree<D extends LoopData<any>>(
  id: string,
  datas: D[]
) {
  return traverse(datas, (d, i, ds, ps) => {
    if (d.id === id) {
      return {
        i,
        data: d,
        ps,
        ds,
      };
    }
  });
}
</script>

<script setup lang="ts" generic="T extends LoopData<any>">
import { traverse, traverseAsync } from "@/utils/traverse";
import { GlobalTypes } from "@/utils/window";
// import { traverseAsync } from "@/utils/traverse";
const subLoopRefs = ref<
  | {
      toggle: typeof toggle;
    }[]
  | undefined
>();

const slots = defineSlots<{
  default: (data: SlotData) => any;
}>();

const expands = defineModel<Partial<Record<string, ExpandOption>>>("expands", {
  default: () => ({}),
});

interface SlotData {
  id: string | number;
  item: T;
  index: number;
  datas: T[];
  layer: number;
  children: T[];
  hasChildren: boolean;
  toggle: (options?: ToggleOptions) => Promise<void>;
  isExpand: boolean;
  parent: T;
}

const props = withDefaults(
  defineProps<{
    modelValue: T[];
    layer?: number;
    hideChildren?: boolean;
    wrapperClass?: string;
    containerClass?: string;

    noToggleAnimation?: boolean;
    toggleParent?: (options?: ToggleOptions) => Promise<void>;
    parent?: any;
  }>(),
  {
    layer: 0,
    dataKey: "id",
    modelValue: () => [],
    hideChildren: false,
    wrapperClass: "",
    containerClass: "",

    noToggleAnimation: false,
    toggleParent: undefined,

    parent: undefined,
  }
);
const container = ref<HTMLDivElement | undefined>();
const modelValueDict = computed(() => {
  // 只有最外层生效
  const dict: Partial<Record<string, T>> = {};
  traverse(props.modelValue, (d) => {
    dict[d.id] = d;
  });
  return dict;
});
interface ToggleOptions {
  //  true expand false shrink
  toState?: boolean;
  duration?: number;
  ease?: gsap.EaseString;
  deep?: boolean;
}

async function toggle(key: string, options: ToggleOptions = {}): Promise<void> {
  const toState = options.toState ?? !expands.value[key]?.isExpand;
  const data = modelValueDict.value?.[key];
  if (data) {
    if (options.deep) {
      // expand all children first
      traverse(data.children, (d) => {
        expands.value[d.id] = {
          isExpand: toState,
        };
      });
    }
    expands.value[key] = {
      isExpand: toState,
    };
    // 一定是顶层
    if (options.toState && props.layer === 0) {
      // 查找一路、toggle
      const ps =
        traverse(props.modelValue, (d, _, __, ps) => {
          if (d.id === key) {
            return ps;
          }
        }) || [];
      ps.forEach((p) => {
        expands.value[p.id] = {
          isExpand: true,
        };
      });
    }
  }
}

async function toggleByData(item: T, options?: ToggleOptions) {
  return toggle(item.id, options);
}

const toggleFirst = async (ds?: T[]) => {
  if (ds == null) {
    ds = props.modelValue;
  }
  if (ds.length > 0 && ds[0]?.children?.length > 0) {
    await toggle(ds[0].id, {
      toState: true,
      duration: 0.2,
      ease: "none",
    });
    await toggleFirst(ds[0].children as T[]);
  }
};
async function toggleByDatas(datas: T[], options?: ToggleOptions) {
  if (datas.length > 0) {
    return traverseAsync(
      datas,
      async (d) => {
        const key = d.id;
        if (key) {
          await new Promise<void>((r) => nextTick(r));
          return toggle(key, options);
        }
      },
      "children"
    );
  }
}
const toggleAll = async (
  options: ToggleOptions & Required<Pick<ToggleOptions, "toState">>
) => {
  if (props.modelValue.length > 0) {
    return traverseAsync(
      props.modelValue,
      async (d) => {
        const key = d.id;
        if (key) {
          await new Promise<void>((r) => nextTick(r));
          return toggle(key, options);
        }
      },
      "children"
    );
  }
};
// onMounted(() => {
//   const unwatch = watch(
//     () => props.modelValue,
//     (val) => {
//       if (val.length > 0) {
//         setTimeout(() => unwatch())
//         nextTick(async () => {
//           if (props.defaultExpandAll) {
//             // 只有第一层需要toggleAll
//             if (props.layer === 0) {
//               await toggleAll({ toState: true, duration: 0 })
//             }
//           } else if (!props.doNotExpandFirst) {
//             await toggleFirst()
//           }
//           // 展开当前选中
//           await Promise.all(
//             props.defaultExpands?.map((e) =>
//               toggleMix(e[0], e[1], {
//                 toState: true,
//               }),
//             ) || [],
//           )
//         })
//       }
//     },
//     {
//       immediate: true,
//     },
//   )
// })

defineExpose({
  toggleFirst,
  toggle,
  toggleByData,
  toggleByDatas,
  toggleAll,
});
</script>
