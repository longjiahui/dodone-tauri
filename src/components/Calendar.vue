<template>
  <div :key="month.format('yyyyMM')" class="relative">
    <div class="sticky top-0 z-20 flex" v-if="$slots.weekday">
      <div
        class="_column shrink-0"
        v-for="(_, day) in new Array(7).fill(0)"
        :key="day"
      >
        <slot
          name="weekday"
          v-bind="{
            weekday: day,
            weekdayCH: weekdayCH[day],
            isToday: dayjs().day() === (day + 1) % 7,
          }"
        ></slot>
      </div>
    </div>
    <!-- {{['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'][day]}} -->
    <div v-for="(_, r) in dates" class="flex items-stretch" :key="r">
      <div v-for="date in _" :key="date" class="_column shrink-0">
        <slot
          v-if="date > 0"
          v-bind="{
            date,
            isToday: isToday(date),
            d: month.date(date).startOf('day'),
            // isDisabled: disabledDate(
            // 	month.date(date).startOf('day'),
            // ),
          }"
        ></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWeekdayCH } from "@/const";
import { useSystemStore } from "@/store/system";
import { dayjs, Dayjs } from "@/utils/time";

const props = defineProps<{
  month: Dayjs;
}>();

const weekdayCH = useWeekdayCH();
let firstDate = computed(() => props.month.startOf("month").toDate());
// let endDate = computed(()=>new Date(currentMonth.value.endOf('month')))
let totalDays = computed(() => {
  let c = props.month;
  return [31, c.isLeapYear() ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][
    c.month()
  ];
});
// 多少行
let firstDay = computed(() => {
  // 0 表示周日
  return firstDate.value.getDay() || 7;
});
let rows = computed(() => {
  return Math.ceil((totalDays.value - (7 - firstDay.value)) / 7) + 1;
});
let dates = computed(() => {
  return new Array(rows.value).fill(0).map((_, r) => {
    return new Array(7).fill(0).map((c, i) => {
      c = r * 7 + i - firstDay.value + 2;
      if (c < 0) {
        return -1;
      } else if (c > totalDays.value) {
        return -1;
      } else {
        return c;
      }
    });
  });
});

const systemStore = useSystemStore();
function isToday(date: number) {
  let now = systemStore.now.toDate();
  return (
    props.month.year() === now.getFullYear() &&
    props.month.month() === now.getMonth() &&
    date === now.getDate()
  );
}
</script>

<style scoped>
@reference '../styles/index.css';

._column {
  @apply min-w-0 flex-1 shrink-0;
}
</style>
