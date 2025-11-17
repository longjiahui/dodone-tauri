<template>
  <div :class="['stretch size-full', isHorizontal ? 'h items-stretch' : 'v']">
    <div :style="style1" :class="[...class1, ...draggingClass]">
      <slot name="1" :set-min-ref="setMinRef1"></slot>
    </div>
    <div class="relative z-10" v-if="!disable1 && !disable2">
      <div
        @mousedown="handleMouseDown"
        :class="[
          'group/resize-div absolute top-0 left-0 cursor-move',
          isHorizontal
            ? 'h-full -translate-x-1/2 px-1.5'
            : 'w-full -translate-y-1/2 py-1.5',
        ]"
      >
        <div
          :class="[
            'bg-primary opacity-0 shadow duration-100 group-hover/resize-div:opacity-100',
            isHorizontal ? 'h-full w-1' : 'h-1 w-full',
          ]"
        ></div>
      </div>
    </div>
    <div :style="style2" :class="[...class2, ...draggingClass]">
      <slot name="2" :set-min-ref="setMinRef2"></slot>
    </div>
  </div>
</template>
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    // 存储key
    storageKey?: string;
    // 默认是水平
    v?: boolean;

    // 默认右边 / 下边是stretch
    stretch1?: boolean;
    // 固定宽度的一边的初始数值
    initialWidth?: string | number;

    // disable其中一个 另一个自动stretch
    // 正常不能两个都disable
    disable1?: boolean;
    disable2?: boolean;

    min?: string | number;

    // 配合setMinRef用来设置自动的最小宽度
    autoMinSize1?: boolean;
    autoMinSize2?: boolean;
    minThreshold?: number;
  }>(),
  {
    minThreshold: 8,
  }
);

const isHorizontal = computed(() => props.v !== true);
const containerRef = useCurrentElement<HTMLDivElement | undefined>();
function getReferenceSize() {
  return (
    (isHorizontal.value
      ? containerRef.value?.clientWidth
      : containerRef.value?.clientHeight) || 0
  );
}

const slotRef1 = ref<HTMLElement>();
function setMinRef1<T>(el: T) {
  if (el instanceof HTMLDivElement) {
    slotRef1.value = el;
  } else if (!el) {
    slotRef1.value = undefined;
  } else {
    throw new Error("el is not HTMLDivElement");
  }
}
const slotRef2 = ref<HTMLElement>();
function setMinRef2<T>(el: T) {
  if (el instanceof HTMLDivElement) {
    slotRef2.value = el;
  } else if (!el) {
    slotRef2.value = undefined;
  } else {
    throw new Error("el is not HTMLDivElement");
  }
}
const slot1Size = useElementSize(slotRef1);
const slot2Size = useElementSize(slotRef2);

const isDragging = ref(false);
const defaultOffset = computed(() => {
  const dw = 240;
  if (typeof props.initialWidth === "string") {
    // 检测是否有百分比
    if (props.initialWidth.includes("%")) {
      const percentValue = parseInt(props.initialWidth);
      if (isNaN(percentValue) || percentValue < 0 || percentValue > 100) {
        return dw;
      }
      const size = getReferenceSize();
      if (size > 0) {
        return size * (percentValue / 100);
      } else {
        return dw;
      }
    }
  }
  return isNaN(+props.initialWidth!) ? dw : +props.initialWidth!;
});

const isUseStorage = computed(() => !!props.storageKey);
const offset = isUseStorage.value
  ? useLocalStorage<number>("resize-div-" + props.storageKey, -1)
  : ref<number>(-1);

function tryInitOffset() {
  // 使用百分比初始化需要等mounted的时机
  // 如果是nan则必须重写默认值
  // 如果使用storage，则使用storage的值
  // 否则重置默认值
  if (
    isNaN(+offset.value) ||
    offset.value < 0 ||
    offset.value >= getReferenceSize()
  ) {
    offset.value = defaultOffset.value;
  }
}
const _resize_hook = ref<number>();
function effect_resize_hook() {
  _resize_hook.value = Math.random();
}
const { stop } = useResizeObserver(containerRef, effect_resize_hook);
onBeforeUnmount(() => stop());
const finalOffset = computed(() => {
  // resize hook
  _resize_hook.value;
  return applyMinMax(applyAutoMin(offset.value));
});
onMounted(() => {
  tryInitOffset();
});

const offsetStyle = computed(() => {
  return isHorizontal.value
    ? {
        width: finalOffset.value + "px",
      }
    : {
        height: finalOffset.value + "px",
      };
});

watch(
  () => [props.disable1, props.disable2],
  () => tryInitOffset()
);

const finalStretch1 = computed(() =>
  props.disable1 ? false : props.disable2 ? true : props.stretch1
);

const style1 = computed(() => {
  return {
    ...(!finalStretch1.value
      ? props.disable1
        ? {
            height: 0,
            width: 0,
            overflow: "hidden",
          }
        : offsetStyle.value
      : {}),
  };
});

const draggingClass = computed(() => [
  // "z-0",
  isDragging.value ? "pointer-events-none opacity-40" : "",
]);

const class1 = computed(() => {
  return [finalStretch1.value ? "stretch" : ""];
});
const style2 = computed(() => {
  return {
    ...(finalStretch1.value
      ? props.disable2
        ? {
            width: 0,
            height: 0,
            overflow: "hidden",
          }
        : offsetStyle.value
      : {}),
  };
});
const class2 = computed(() => {
  return [!finalStretch1.value ? "stretch" : ""];
});

let _isDown = false;
function handleMouseDown() {
  nextTick(() => {
    setTimeout(() => {
      _isDown = true;
      isDragging.value = true;
    });
  });
}
function calculateAutoMin() {
  const key = isHorizontal.value ? "width" : "height";
  return !props.stretch1
    ? props.autoMinSize1
      ? unref(slot1Size[key])
      : null
    : props.autoMinSize2
      ? unref(slot2Size[key])
      : null;
}

function applyAutoMin(val: number) {
  const autoMin = calculateAutoMin();
  return !!autoMin ? Math.max(val, autoMin + props.minThreshold) : val;
}
function applyMinMax(val: number) {
  if (props.min) {
    const finalMin =
      typeof props.min === "string" && props.min.includes("%")
        ? getReferenceSize() * (parseInt(props.min) / 100)
        : +props.min;
    // 两个方向
    const finalMax = getReferenceSize() - finalMin;
    return Math.min(Math.max(val, finalMin), finalMax);
  } else {
    return val;
  }
}

function handleMouseMove(e: MouseEvent) {
  if (_isDown) {
    let movement =
      (isHorizontal.value ? e.movementX : e.movementY) *
      (finalStretch1.value ? -1 : 1);
    const finalOffset = offset.value + movement;
    offset.value = finalOffset;
  }
}

// watch(
//   [slot1Size.width, slot1Size.height, slot2Size.width, slot2Size.height],
//   () => {
//     offset.value = offset.value;
//   }
// );

function handleMouseUp() {
  _isDown = false;
  isDragging.value = false;
  offset.value = finalOffset.value;
}
document.addEventListener("mousemove", handleMouseMove);
document.addEventListener("mouseup", handleMouseUp);
onBeforeUnmount(() => {
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
});
</script>
