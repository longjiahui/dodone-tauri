<template>
  <div
    class="relative flex size-full items-stretch overflow-hidden"
    ref="containerRef"
  >
    <div
      :style="{
        width: `${dayTimeBarWidth}px`,
        paddingTop: `${dateBarHeight}px`,
      }"
      class="bg-light-2 sticky left-0 z-10 text-sm font-semibold shadow"
    >
      <div
        v-for="h in new Array(dayTimeUnitAmount).fill(0).map((_, i) => i)"
        class="px-s relative flex flex-col justify-start"
        :style="{
          height: `${dayTimeBarUnitHeight}px`,
        }"
      >
        <div class="translate-y-[-50%]">{{ minDayTime + h }}:00</div>

        <!-- border -->
        <div
          class="border-dark-1 pointer-events-none absolute top-0 h-full w-[120vw] border-b border-dashed"
          :style="{
            left: `${dayTimeBarWidth - 16}px`,
          }"
        ></div>
      </div>
    </div>
    <div
      ref="scrollContainerRef"
      @scroll="handleScroll"
      class="stretch flex flex-col overflow-auto overflow-y-hidden"
    >
      <div class="bg-light-2 flex text-sm" ref="headerRef">
        <div
          class="gap-xs bg-light-2 relative flex flex-col font-semibold"
          v-for="m in monthShouldRender"
        >
          <div class="p-xs sticky left-0 self-start">
            {{ m.format("YYYY-MM") }}
          </div>
          <div class="flex">
            <div
              :class="[
                'p-xxs relative',
                m.date(d).startOf('day').isSame(today)
                  ? 'bg-primary-dark text-white'
                  : '',
              ]"
              :style="{
                width: `${dateUnitWidth}px`,
              }"
              v-for="d in new Array(m.daysInMonth())
                .fill(0)
                .map((_, i) => i + 1)"
            >
              {{ d }}

              <!-- border -->
              <div
                class="border-dark-1 pointer-events-none absolute top-0 left-0 h-[120vw] w-full border-r border-dashed"
              ></div>
            </div>
          </div>
        </div>
      </div>
      <div class="stretch relative">
        <Scope :d="{}">
          <div
            v-for="d in datas"
            class="p-xs bg-bg absolute truncate rounded border shadow"
            :style="{
              left: `${firstShouldRenderMonth.diff(d.start) * dateUnitWidth}px`,
              width: `${dateUnitWidth}px`,
              top: `${
                (dayjs(d.start).hour() - minDayTime) * dayTimeBarUnitHeight
              }px`,
              minHeight: `${dayTimeBarUnitHeight}px`,
              height: `${(dayjs(d.end).diff(dayjs(d.start), 'minute') / 60) * dayTimeBarUnitHeight}px`,
            }"
          >
            {{ d.name }}
          </div>
        </Scope>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
export interface ChartData {
  id: string
  name: string
  start: Date
  end: Date
}
</script>
<script setup lang="ts">
import { dayjs } from "@/utils/time"
const props = withDefaults(
  defineProps<{
    requestDatas?: (start: Date, end: Date) => Promise<ChartData[]>
  }>(),
  {
    requestDatas: () => Promise.resolve([]),
  },
)

const scrollContainerRef = ref<HTMLElement>()
const headerRef = ref<HTMLElement>()
// const mainContainerRef = ref<HTMLElement>()
const containerRef = ref<HTMLElement>()
const { width: containerWidth, height: containerHeight } =
  useElementSize(containerRef)

const { height: headerHeight } = useElementSize(headerRef)
const mainContainerHeight = computed(
  () => containerHeight.value - headerHeight.value,
)
const dateBarHeight = computed(() => headerHeight.value)

const dateUnitWidth = 256
const dayTimeBarWidth = 80

const minDayTime = 0
const maxDayTime = 24
const dayTimeUnitAmount = maxDayTime - minDayTime
const dayTimeBarUnitHeight = computed(
  () => mainContainerHeight.value / dayTimeUnitAmount,
)

const today = ref(dayjs().startOf("day"))
const currentMonth = ref(today.value.startOf("month"))
const monthShouldRender = ref([currentMonth.value])
const firstShouldRenderMonth = computed(() => monthShouldRender.value[0])

function scrollToToday() {
  scrollContainerRef.value?.scrollTo({
    left:
      (today.value.date() - 1) * dateUnitWidth -
      /*offset*/ containerWidth.value / 3,
    // behavior: "smooth",
  })
}

onMounted(() => {
  scrollToToday()
})

const currentViewWindow = ref<number[]>([])
const datas = ref<ChartData[]>([])
watch(
  monthShouldRender,
  async (newVal, old) => {
    const newMonths = newVal.filter(
      (m) => !old || !old.find((o) => o.isSame(m)),
    )
    await Promise.all(
      newMonths.map((m) =>
        props
          .requestDatas(m.startOf("month").toDate(), m.endOf("month").toDate())
          .then((d) => {
            datas.value.push(...d)
          }),
      ),
    )
  },
  {
    immediate: true,
  },
)

function handleScroll(_e: Event) {
  const scrollLeft = scrollContainerRef.value!.scrollLeft
  const scrollWidth = scrollContainerRef.value!.scrollWidth
  const scrollContainerWidth = scrollContainerRef.value!.clientWidth
  if (scrollLeft < 1000) {
    const addMonth = monthShouldRender.value[0].subtract(1, "month")
    monthShouldRender.value = [addMonth, ...monthShouldRender.value]
    scrollContainerRef.value!.scrollLeft +=
      addMonth.daysInMonth() * dateUnitWidth
  }
  if (scrollWidth - scrollLeft - scrollContainerWidth < 200) {
    const addMonth = monthShouldRender.value[
      monthShouldRender.value.length - 1
    ].add(1, "month")
    monthShouldRender.value = [...monthShouldRender.value, addMonth]
  }

  const currentViewN = Math.ceil(scrollLeft / dateUnitWidth)
  const viewWidth = Math.ceil(scrollContainerWidth / dateUnitWidth)
  currentViewWindow.value = [currentViewN, currentViewN + viewWidth]
}
</script>
