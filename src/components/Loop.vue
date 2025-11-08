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
      :key="getKey(item)"
      :class="[wrapperClass]"
    >
      <slot
        name="default"
        :id="getKey(item)"
        :item="item"
        :datas="modelValue"
        :index="index"
        :data-key="dataKey as string"
        :layer="layer"
        :children="getChildren(item)"
        :has-children="getChildren(item).length > 0"
        :toggle="
          (_item = item, options?: ToggleOptions) =>
            toggleByData(_item, options)
        "
        :is-expand="!!expands[getKey(item)]"
        :parent="parent"
        :get-key="getKey"
        :join-keys="joinKeys"
      ></slot>
      <!-- 如果不触发transition 会有问题，不能展开时可以检查一下是否触发transitionend -->
      <!-- 这里不使用 overflow-hidden 是因为 table使用sticky做冻结列的时候会因为overflow-hidden而不生效 -->
      <div
        v-if="displays[getKey(item)]"
        :class="[
          'sub-loop-wrapper',
          _overflowStrategy === 'overflow' ? 'overflow-hidden' : '',
        ]"
        :style="{
          ...(_overflowStrategy === 'contain'
            ? {
                contain: 'paint',
              }
            : {}),
        }"
      >
        <!-- style="contain: paint" -->
        <Loop
          ref="subLoopRefs"
          v-bind="props"
          class="sub-loop"
          :model-value="getChildren(item) || []"
          :layer="layer + 1"
          :parent="item"
          :toggle-parent="
            async (options?: ToggleOptions) => {
              await toggleByData(item, options)
              await toggleParent?.(options)
            }
          "
          :wrapper-class="wrapperClass"
          :container-class="containerClass"
          :do-not-expand-first="true"
          :children-key="childrenKey"
          :hide-children
          :data-key="dataKey"
        >
          <template #default="subItem">
            <slot v-bind="subItem"></slot>
          </template>
        </Loop>
      </div>
      <!-- </transition> -->
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: "Loop",
}
</script>

<script
  setup
  lang="ts"
  generic="T extends Partial<Record<string | number, any>> = any"
>
import { traverse, traverseAsync } from "@/utils/traverse"
import gsap from "gsap"

const subLoopRefs = ref<
  | {
      toggle: typeof toggle
    }[]
  | undefined
>()

defineSlots<{
  default: (data: SlotData) => any
}>()

interface SlotData {
  id: string | number
  item: T
  index: number
  datas: T[]
  dataKey: string
  layer: number
  children: T[]
  hasChildren: boolean
  toggle: () => Promise<void>
  isExpand: boolean
  parent: T
  getKey: typeof getKey
  joinKeys: typeof joinKeys
}

const props = withDefaults(
  defineProps<{
    modelValue: T[]
    layer?: number
    dataKey?: keyof T
    mixDataKey?: keyof T
    childrenKey?: keyof T
    hideChildren?: boolean
    wrapperClass?: string
    containerClass?: string
    doNotExpandFirst?: boolean
    defaultExpands?: [any, any?][]
    defaultExpandAll?: boolean
    noToggleAnimation?: boolean
    toggleParent?: (options?: ToggleOptions) => Promise<void>
    parent?: any

    // eslint-disable-next-line vue/prop-name-casing
    _overflowStrategy?: "contain" | "overflow" | "none"
  }>(),
  {
    layer: 0,
    dataKey: "id",
    mixDataKey: undefined,
    modelValue: () => [],
    childrenKey: "children",
    hideChildren: false,
    wrapperClass: "",
    containerClass: "",
    doNotExpandFirst: false,
    defaultExpandAll: false,
    defaultExpands: () => [],
    noToggleAnimation: false,
    toggleParent: undefined,

    parent: undefined,
    _overflowStrategy: "overflow",
  },
)
type KeyType = string | number
const container = ref<HTMLDivElement | undefined>()
const expands = ref<Partial<Record<KeyType, boolean>>>({})
// 因为收缩的时候需要等动画完成，v-if才能设置为false、所以这里需要
const displays = ref<Partial<Record<KeyType, boolean>>>({})

function joinKeys(key?: string, mixDataKey?: string) {
  return `${key || ""}${mixDataKey || ""}`
}

function getKey(item: T) {
  if (props.mixDataKey) {
    return joinKeys(item?.[props.dataKey], item?.[props.mixDataKey])
  } else {
    return item?.[props.dataKey] || ""
  }
}
function getChildren(item: T): T[] {
  return props.hideChildren ? [] : item?.[props.childrenKey] || []
}
interface ToggleOptions {
  //  true expand false shrink
  toState?: boolean
  duration?: number
  ease?: string
}
async function toggle(
  key: string | number,
  options: ToggleOptions = {},
): Promise<void> {
  options = Object.assign(
    {
      duration: 0.5,
      ease: "power3.out",
    },
    options,
  )
  if (container.value) {
    const i = props.modelValue.findIndex((d) => getKey(d) === key)
    if (i > -1) {
      if (getChildren(props.modelValue[i]).length === 0) {
        // 如果没有children，且为打开 则toggle parent
        if (options.toState) {
          await props.toggleParent?.(options)
        }
      } else {
        let div = container.value.children[i]
        let currentExpandState = expands.value[key]
        let toExpandState =
          options.toState === undefined
            ? !currentExpandState
            : !!options.toState
        if (currentExpandState !== toExpandState && div) {
          if (toExpandState) {
            // 如果是展开、则展开所有的 父节点。
            // 需要指定状态是因为 toggleParent调用的 toggleSubLoop
            // 在多个级别的情况下 会进入这里然后多次调用toggleParent
            await props.toggleParent?.({
              ...options,
              toState: toExpandState,
            })
          }
          expands.value[key] = toExpandState
          // 将displays的设置根据展开和收缩根据时机拆分的原因
          // 添加v-if，数据多的时候不挂载多余的dom结构造成效率问题
          if (toExpandState) {
            displays.value[key] = toExpandState
            await nextTick()
          }
          let subLoopWrapper = (
            Array.from(div.children) as HTMLDivElement[]
          ).find((c) => Array.from(c.classList).includes("sub-loop-wrapper"))
          if (subLoopWrapper) {
            let subLoop = (
              Array.from(subLoopWrapper.children) as HTMLDivElement[]
            ).find((c) => Array.from(c.classList).includes("sub-loop"))
            if (subLoop) {
              if (!toExpandState) {
                if (options.duration! > 0) {
                  await gsap
                    .fromTo(
                      subLoopWrapper,
                      {
                        height: subLoop.offsetHeight,
                      },
                      {
                        height: 0,
                        duration: options.duration,
                        ease: options.ease,
                        opacity: 0,
                      },
                    )
                    .then((d) => d)
                } else {
                  subLoopWrapper.style.height = "0"
                  subLoopWrapper.style.opacity = "0"
                }
              } else {
                if (options.duration! > 0) {
                  await gsap
                    .fromTo(
                      subLoopWrapper,
                      {
                        height: 0,
                        opacity: 0,
                      },
                      {
                        height: subLoop.scrollHeight,
                        duration: options.duration,
                        ease: options.ease,
                        opacity: 1,
                      },
                    )
                    .then(() => {
                      subLoopWrapper!.style.height = "auto"
                    })
                } else {
                  subLoopWrapper.style.height = "auto"
                  subLoopWrapper.style.opacity = "1"
                }
              }
            }
          }
          if (
            !toExpandState &&
            /* 因为设置v-if false有延迟，延迟时长为动画持续时长，所以动画未结束时，
                            如果又调用了toggle让状态从隐藏变为展开时，expand会在展开前触发
                            display true、但在展开后，收缩前的此处会触发让display false
                            导致expand展开，而display收缩的问题、、 */
            !expands.value[key]
          ) {
            displays.value[key] = toExpandState
          }
        } else {
          // already set
        }
      }
    } else {
      // 如果能找到子元素有，则展开自己
      const parent = traverse(props.modelValue, (d, _, __, ps) => {
        if (getKey(d) === key) {
          return ps?.[0]
        }
      })
      if (parent) {
        return toggleByData(parent, options).then(() => {
          return subLoopRefs.value?.forEach((r) => r.toggle(key, options))
        })
      }
    }
  }
}
async function toggleByData(item: T, options?: ToggleOptions) {
  return toggle(getKey(item), options)
}
async function toggleMix(
  key: string | number,
  mixKey: string | number,
  options?: ToggleOptions,
) {
  return toggle(joinKeys(key?.toString(), mixKey?.toString()), options)
}

const toggleFirst = async (ds?: T[]) => {
  if (ds == null) {
    ds = props.modelValue
  }
  if (ds.length > 0 && getChildren(ds[0]).length > 0) {
    await toggle(getKey(ds[0]), {
      toState: true,
      duration: 0.2,
      ease: "none",
    })
    await toggleFirst(getChildren(ds[0]))
  }
}
const toggleAll = async (options: ToggleOptions) => {
  if (props.modelValue.length > 0) {
    return traverseAsync(
      props.modelValue,
      async (d) => {
        const key = getKey(d)
        if (key) {
          await new Promise<void>((r) => nextTick(r))
          return toggle(key, options)
        }
      },
      props.childrenKey,
    )
  }
}
onMounted(() => {
  const unwatch = watch(
    () => props.modelValue,
    (val) => {
      if (val.length > 0) {
        setTimeout(() => unwatch())
        nextTick(async () => {
          if (props.defaultExpandAll) {
            // 只有第一层需要toggleAll
            if (props.layer === 0) {
              await toggleAll({ toState: true, duration: 0 })
            }
          } else if (!props.doNotExpandFirst) {
            await toggleFirst()
          }
          // 展开当前选中
          await Promise.all(
            props.defaultExpands?.map((e) =>
              toggleMix(e[0], e[1], {
                toState: true,
              }),
            ) || [],
          )
        })
      }
    },
    {
      immediate: true,
    },
  )
})

defineExpose({
  toggleFirst,
  toggle,
  toggleByData,
  toggleMix,
  joinKeys,
  toggleAll,
})
</script>

<style lang="scss" scoped>
.sub-loop-wrapper {
  height: 0;
}
</style>
