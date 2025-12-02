<template>
  <div class="grid grid-cols-7 gap-2">
    <div
      v-for="(_, i) in new Array(7).fill(0)"
      class="h justify-center bg-light-4 py-1 text-sm text-light rounded shadow leading-none items-center"
    >
      {{ weekdayCH[i] }}
    </div>
    <div
      v-for="() in new Array(today.isoWeekday() - 1).fill(0)"
      class="_block"
    ></div>
    <div
      class="_block h justify-center items-center! text-xs outline-primary outline-2 -outline-offset-2 outline-dashed"
    >
      <div>今</div>
    </div>
    <Tooltip
      v-for="(ns, i) in hitList"
      :key="i"
      :content="firstHitIndex === i ? '下一次重复任务' : ''"
    >
      <div
        :class="[
          '_block text-sm relative',
          firstHitIndex === i
            ? 'outline-2 outline-primary outline-dashed outline-offset-2'
            : '',
          ns.length > 0 ? 'bg-primary-lighter' : '',
        ]"
      >
        <div
          :class="[
            'absolute top-1/2 left-1/2 -translate-1/2 leading-none',
            ns.length > 0 ? 'text-white' : '',
          ]"
        >
          {{
            dayjs()
              .add(i + 1, "day")
              .date()
          }}
        </div>
        <div
          v-for="(n, j) in ns"
          :key="j"
          :class="['stretch']"
          :style="{
            background: `hsl(${getHSLHash(n)}deg, 70%, 50%)`,
          }"
        ></div>
      </div>
    </Tooltip>
  </div>
</template>

<script setup lang="ts">
import { useWeekdayCH } from "@/const";
import { useSystemStore } from "@/store/system";
import { getHSLHash } from "@/utils/random";
import { dayjs } from "@/utils/time";

const props = defineProps<{
  length: number | string;

  abs: {
    a: number;
    b: number;
    // hit offset
    offset?: number;
    name?: string;
  }[];
}>();
const finalLength = computed(() => (isNaN(+props.length) ? 0 : +props.length));
const systemStore = useSystemStore();
const today = computed(() => systemStore.today);
const weekdayCH = useWeekdayCH();

const hitList = computed(() => {
  const infos = props.abs.map((ab) => {
    let { a, b, name, offset } = ab;
    a = isNaN(+a) ? 0 : +a;
    b = isNaN(+b) ? 0 : +b;
    offset = isNaN(+(offset || 0)) ? 0 : +offset!;
    const hits: number[] = [];
    new Array(finalLength.value).fill(0).map((_, i) => {
      const lastHit = hits.slice(-1)?.[0] + 1 || 0;
      // const finalOffset = hits.length > 0 ? 0 : offset;
      if (i + 1 === lastHit + a + (b ? (hits.length + offset) % b : 0)) {
        hits.push(i);
      }
    });
    return {
      name: name || Math.random() + "",
      hits: hits.reduce(
        (t, d) => {
          t[d] = true;
          return t;
        },
        {} as Record<number, boolean>
      ),
    };
  });
  return new Array(finalLength.value).fill(0).map((_, i) => {
    return infos.filter((info) => info.hits[i]).map((info) => info.name!);
  });
});

const firstHitIndex = computed(() =>
  hitList.value.findIndex((ns) => ns.length > 0)
);
</script>

<style lang="css" scoped>
@reference "../styles/index.css";
._block {
  @apply flex size-full items-stretch overflow-hidden rounded bg-light-4 h-[40px];
}
</style>
