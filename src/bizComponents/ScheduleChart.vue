<template>
  <div class="group relative size-full gap-1">
    <div
      class="h absolute right-2 bottom-2 z-10 items-center gap-2 opacity-0 duration-300 group-hover:opacity-100"
    >
      <!-- <Button @click="scrollToToday()" type="text">回到今天</Button> -->
      <ClickableIcon
        :icon="AimOutlined"
        :tooltip="$t('backToToday')"
        @click="scrollToToday()"
      ></ClickableIcon>
      <DefaultDropdown trigger="click">
        <ClickableIcon :icon="SettingOutlined"></ClickableIcon>
        <template #body>
          <div
            @click.stop
            class="v w-[320px] gap-2 p-3 [&>div>div:first-child]:w-[64px] [&>div>div:nth-child(2)]:flex-1 [&>div>div:nth-child(3)]:w-[104px]"
          >
            <div class="h items-center gap-2">
              <div class="font-semibold">{{ $t("width") }}</div>
              <Slider
                class="w-[120px]"
                :range="[100, 1000]"
                v-model="dateUnitWidth"
              ></Slider>
              <div>{{ dateUnitWidth }}px</div>
            </div>
            <div class="h items-center gap-2">
              <div class="font-semibold">{{ $t("dayTimeRange") }}</div>
              <RangeSlider
                class="w-[120px]"
                :range="[0, 24]"
                :model-value="[minDayTime, maxDayTime]"
                @update:model-value="
                  (d) => {
                    if (d) {
                      minDayTime = d[0];
                      maxDayTime = d[1];
                    }
                  }
                "
              ></RangeSlider>
              <div>{{ minDayTime }}:00 - {{ maxDayTime }}:00</div>
            </div>
            <div class="h items-center gap-2">
              <div class="font-semibold">{{ $t("scrollOption") }}</div>
              <Switch
                class="w-[120px]"
                :range="[100, 1000]"
                v-model="isReverseScrollCross"
                :texts="[$t('default'), $t('isReverseScrollCross')]"
              ></Switch>
            </div>
            <div class="h items-center gap-2">
              <div class="font-semibold">颜色设置</div>
              <Switch
                class="stretch"
                v-model="isUsingGroupColor"
                :texts="[$t('useCustomColor'), $t('useGroupColor')]"
              ></Switch>
            </div>
            <!-- <div class="h items-center gap-2">
              <div class="font-semibold">拖拽单位(分钟)</div>
              <Slider
                v-model="interactUnit"
                :range="[1, 60]"
                :marks="{
                  1: '1',
                  5: '5',
                  10: '10',
                  15: '15',
                  30: '30',
                  60: '60',
                }"
                no-step
                class="stretch"
              ></Slider>
            </div> -->
          </div>
        </template>
      </DefaultDropdown>
    </div>
    <div
      class="relative flex size-full items-stretch overflow-hidden"
      ref="containerRef"
    >
      <!-- resize 线 -->
      <div
        v-if="interactType && interactType !== 'move'"
        :style="{
          ...(interactType === 'resizeEnd'
            ? {
                bottom: `${interactOffset + interactOffsetStart}px`,
              }
            : {
                top: `${interactOffset + interactOffsetStart + headerHeight}px`,
              }),
        }"
        class="border-primary absolute z-50 w-full border-b border-dashed"
      >
        <div
          class="bg-primary absolute inline-block text-white"
          :style="{ left: `${dayTimeBarWidth}px` }"
        >
          {{ interactNewStart.format("HH:mm") }}
        </div>
      </div>
      <div
        v-if="
          (hoveringId &&
            interactType !== 'resizeEnd' &&
            interactType !== 'resizeStart') ||
          interactType === 'move'
        "
        :style="{
          top: `${
            Math.min(
              // 防止超过边界看不见，但实际可以设置到超过边界
              maxDayTime - minDayTime - 1,
              dayjs(hoveringData?.start).hour() -
                minDayTime +
                dayjs(hoveringData?.start).minute() / 60
            ) *
              dayTimeBarUnitHeight +
            headerHeight +
            interactOffset
          }px`,
        }"
        class="border-primary absolute z-40 w-full border-b border-dashed"
      >
        <div
          class="bg-primary absolute inline-block text-white"
          :style="{ left: `${dayTimeBarWidth}px` }"
        >
          {{
            dayjs(hoveringData?.start)
              .add(interactHourOffset, "h")
              .format("HH:mm")
          }}
          持续
          {{ dayjs(hoveringData?.end).diff(hoveringData?.start, "minute") }}
          分钟
        </div>
      </div>
      <div
        v-if="
          (hoveringId &&
            interactType !== 'resizeEnd' &&
            interactType !== 'resizeStart') ||
          interactType === 'move'
        "
        :style="{
          bottom: `${
            (-dayjs(hoveringData?.end).diff(
              dayjs(hoveringData?.end)
                .endOf('day')
                .subtract(24 - maxDayTime, 'hour'),
              'minute'
            ) /
              60) *
              dayTimeBarUnitHeight -
            interactOffset
          }px`,
        }"
        class="border-primary absolute z-40 w-full border-b border-dashed"
      >
        <div
          class="bg-primary absolute inline-block text-white"
          :style="{ left: `${dayTimeBarWidth}px` }"
        >
          {{
            dayjs(hoveringData?.end)
              .add(interactHourOffset, "h")
              .format("HH:mm")
          }}
        </div>
      </div>
      <!-- 现在时间线 -->
      <div
        class="border-primary-light pointer-events-none absolute left-0 z-50 w-full border-b border-dashed"
        :style="{
          top: `${headerHeight + (now.hour() - minDayTime) * dayTimeBarUnitHeight + (now.minute() / 60) * dayTimeBarUnitHeight}px`,
        }"
      ></div>
      <div
        :style="{
          width: `${dayTimeBarWidth}px`,
          paddingTop: `${dateBarHeight}px`,
        }"
        :class="[bgColor2, 'sticky left-0 z-10 text-sm shadow']"
      >
        <div
          v-for="h in new Array(dayTimeUnitAmount).fill(0).map((_, i) => i)"
          class="relative flex flex-col justify-start px-4"
          :style="{
            height: `${dayTimeBarUnitHeight}px`,
          }"
        >
          <div class="translate-y-[-50%]">{{ minDayTime + h }}:00</div>
          <!-- border -->
          <!-- <div
            class="pointer-events-none absolute top-0 h-full w-[120vw] border-b border-dark-1 border-dashed"
            :style="{
              left: `${dayTimeBarWidth - 16}px`,
            }"
          ></div> -->
        </div>
      </div>
      <Scrollbar
        :horizontal-scroll="isReverseScrollCross"
        @scroll="handleScroll"
        ref="scrollContainerRef"
        :class="['stretch size-full', bgColor2]"
        wrap-class="size-full"
        view-class="size-full flex items-stretch"
      >
        <div class="flex flex-col" v-for="m in monthShouldRender">
          <div class="sticky left-0 self-start p-2">
            <div class="bg-primary rounded px-1 py-0.5 text-white">
              {{ m.format("YYYY-MM") }}
            </div>
          </div>
          <div ref="dateContainerRef" class="stretch flex items-stretch">
            <!-- data-date for mousemove 来获得当前所在格子的日期 -->
            <div
              :class="['flex flex-col']"
              :data-date="m.date(d).format(dataDateFormat)"
              :style="{
                width: `${dateUnitWidth}px`,
              }"
              v-for="d in new Array(m.daysInMonth())
                .fill(0)
                .map((_, i) => i + 1)"
            >
              <div
                :class="[
                  'self-start px-1 py-0.5 text-sm',
                  m.date(d).startOf('day').isSame(today)
                    ? 'bg-primary rounded text-white'
                    : ' ',
                ]"
              >
                {{ d }} {{ weekdayCH[m.date(d).isoWeekday() - 1] }}
              </div>
              <div
                v-if="
                  m
                    .date(d)
                    .isBetween(
                      currentViewWindow[0],
                      currentViewWindow[1],
                      'day',
                      '[]'
                    )
                "
                :class="['stretch relative', bgColor1]"
              >
                <div class="absolute flex size-full flex-col">
                  <!-- 做格子 -->
                  <BizDrop
                    v-for="(_, h) in new Array(dayTimeUnitAmount).fill(0)"
                    channel="move-tasks"
                    #default="{ isDroppingActive, setRef }"
                    @drop="(t, data) => handleBizDrop(t, data, m, d, h)"
                  >
                    <div
                      :ref="setRef"
                      :style="{
                        height: `${dayTimeBarUnitHeight}px`,
                      }"
                      :class="[
                        'drop-area border-dark-2 size-full border-r border-b border-dashed duration-300',
                        now.isAfter(m.date(d).hour(h + 1 + minDayTime))
                          ? [bgColor2, `dhover:${bgColor3}`].join(' ')
                          : [bgColor1, `dhover:${bgColor2}`].join(' '),
                        isDroppingActive ? 'dropping-active' : '',
                      ]"
                      @click="
                        $emit(
                          'create',
                          m.date(d).toDate(),
                          m
                            .date(d)
                            .hour(minDayTime + h)
                            .toDate()
                        )
                      "
                    >
                      <div
                        v-if="
                          now.startOf('hour').isSame(
                            m
                              .date(d)
                              .hour(h + minDayTime)
                              .startOf('hour')
                          )
                        "
                        :class="['absolute top-0 w-full', bgColor2]"
                        :style="{
                          height:
                            (now.minute() / 60) * dayTimeBarUnitHeight + 'px',
                        }"
                      ></div>
                    </div>
                  </BizDrop>
                </div>
                <Scope
                  :d="{
                    datas:
                      datasInDate[m.date(d).format(dataDateFormat)]?.filter(
                        (d) =>
                          dayjs(d.date).isBetween(
                            currentViewWindow[0],
                            currentViewWindow[1],
                            'day',
                            '[]'
                          )
                      ) || [],
                  }"
                  #default="{ datas: datasBetweenWindow }"
                >
                  <div
                    v-if="datasBetweenWindow.length > 0"
                    class="pointer-events-none relative size-full px-1"
                  >
                    <Scope
                      v-for="(data, dataInd) in datasBetweenWindow"
                      :d="{
                        prevData:
                          datasInDate[m.date(d).format(dataDateFormat)]?.[
                            dataInd - 1
                          ],
                        top: Math.min(
                          // 防止超过边界看不见，但实际可以设置到超过边界
                          // 最小8px
                          // maxDayTime - minDayTime - 1,
                          (maxDayTime - minDayTime) * dayTimeBarUnitHeight - 8,
                          (dayjs(data.start).hour() -
                            minDayTime +
                            dayjs(data.start).minute() / 60 +
                            /* interactoffset */ (interactType ===
                              'resizeStart' && interactData?.id === data.id
                              ? interactHourOffset
                              : 0)) *
                            dayTimeBarUnitHeight
                        ),
                        bottom:
                          (-dayjs(data.end).diff(
                            dayjs(data.end)
                              .endOf('day')
                              .subtract(24 - maxDayTime, 'hour'),
                            'minute'
                          ) /
                            60 +
                            /* interactoffset */ (interactType ===
                              'resizeEnd' && interactData?.id === data.id
                              ? interactHourOffset
                              : 0)) *
                          dayTimeBarUnitHeight,
                        isAfterEnd: now.isAfter(
                          makeDayjsByDateTime(data.date, data.end)
                        ),
                        isAfterStart: now.isAfter(
                          makeDayjsByDateTime(data.date, data.start)
                        ),
                        task: taskStore.tasksDict[data.data.taskId],
                        taskGroup:
                          taskGroupStore.taskGroupsDict[
                            taskStore.tasksDict[data.data.taskId]?.groupId!
                          ],
                      }"
                      v-slot="{
                        top,
                        bottom,
                        isAfterEnd,
                        isAfterStart,
                        task,
                        taskGroup,
                        prevData,
                      }"
                    >
                      <Scope
                        :d="{
                          isTooNarrow:
                            containerHeight - headerHeight - top - bottom < 12,
                          isDone: task?.state === 'DONE',
                        }"
                        #default="{ isTooNarrow, isDone }"
                      >
                        <div
                          v-if="task"
                          :class="[
                            interactData?.id === data.id ? 'z-50' : '',
                            hoveringId === data.id ? 'z-40' : '',
                            'pointer-events-none absolute top-0 z-30 h-full w-[calc(100%_-_8px)] [&>div]:pointer-events-auto',
                          ]"
                          :style="{
                            ...calculateTheme(
                              isUsingGroupColor
                                ? taskGroup?.color
                                : data.color!,
                              {
                                s: taskScheduleHSColorS,
                                l: taskScheduleHSColorL,
                                a: taskScheduleHSColorA,
                              }
                            ).cssVariables,
                            transform:
                              interactData?.id === data.id &&
                              interactType === 'move'
                                ? `translateY(${interactOffset}px)`
                                : '',
                          }"
                          @mousedown="handleDataMouseDown(data, top)"
                        >
                          <!-- v-motion
                            :initial="{ opacity: 0, scale: 0.6 }"
                            :enter="{
                              opacity: 1,
                              scale: 1,
                              transition: {
                                bounce: 1,
                                damping: 10,
                                delay: Math.random() * 180,
                              },
                            }" -->
                          <div
                            @mouseenter="hoveringId = data.id"
                            @mouseleave="
                              hoveringId =
                                hoveringId === data.id ? undefined : hoveringId
                            "
                            :class="[
                              'group/card h absolute cursor-pointer items-center gap-1 overflow-hidden rounded px-2 shadow-xl outline-1 -outline-offset-1 outline-transparent select-none',
                              hoveringId === data.id
                                ? 'opacity-100 !outline-current outline-solid'
                                : '',
                              isTooNarrow
                                ? 'text-xs !outline-[var(--theme-dark)] outline-dashed'
                                : 'text-sm',
                              isAfterEnd ? 'opacity-60' : '',
                            ]"
                            :style="{
                              background: 'var(--theme-text-background)',
                              color: 'var(--theme-text-color)',
                              top: top + 'px',
                              // 如果有碰撞需要调整宽度和位置
                              ...(data.collide?.total! > 1
                                ? {
                                    left: `${((data.collide?.index || 0) / data.collide!.total) * 100}%`,
                                    width: `${(1 / data.collide!.total) * 100}%`,
                                  }
                                : {
                                    width: 'calc(100%)',
                                  }),
                              minHeight: `${Math.min(dayTimeBarUnitHeight, minHeight)}px`,

                              bottom: bottom + 'px',
                            }"
                          >
                            <div
                              @mousedown.stop="
                                handleDataResizeStartMouseDown(data, top)
                              "
                              class="absolute top-0 z-10 h-1 w-full cursor-n-resize"
                            ></div>
                            <div
                              @mousedown.stop="
                                handleDataResizeEndMouseDown(data, bottom)
                              "
                              class="absolute bottom-0 z-10 h-1 w-full cursor-n-resize"
                            ></div>
                            <div class="v stretch relative h-full">
                              <div class="stretch h h-full items-center gap-2">
                                <Tooltip
                                  v-if="
                                    !!data.data.notificationId && !isAfterStart
                                  "
                                  :content="$t('useNotification')"
                                >
                                  <div class="text-[var(--theme-text-color)]">
                                    <NotificationOutlined></NotificationOutlined>
                                  </div>
                                </Tooltip>
                                <!-- <Tooltip
                                :content="interactType ? '' : task?.content"
                              > -->
                                <div
                                  :class="[
                                    'stretch leading-multi h h-full items-center gap-1',
                                    isDone ? 'line-through' : '',
                                  ]"
                                >
                                  <Checkbox
                                    @mousedown.stop
                                    v-if="!isDone"
                                    :model-value="isDone"
                                    @update:model-value="
                                      () => {
                                        return taskStore.toggleTaskState(
                                          task.id
                                        );
                                      }
                                    "
                                  ></Checkbox>
                                  <div class="max-h-full" :title="task.content">
                                    <template v-if="!isTooNarrow">
                                      {{ task.content }}
                                    </template>
                                    <span v-else> </span>
                                  </div>
                                </div>
                                <!-- </Tooltip> -->
                              </div>
                              <!-- <TaskDescription
                                v-if="showDescription"
                                class="line-clamp-1 text-sm"
                                :title="task?.description!"
                                :model-value="task.description"
                                no-image
                              >
                              </TaskDescription> -->
                            </div>
                            <DefaultDropdown
                              trigger="click"
                              @mousedown.stop
                              placement="bottomRight"
                            >
                              <MoreOutlined
                                class="cursor-pointer rounded p-0.5 opacity-0 duration-300 group-hover/card:opacity-100 hover:bg-[rgba(0,0,0,0.1)]"
                              ></MoreOutlined>
                              <template #body>
                                <Tools>
                                  <div class="h items-center gap-2">
                                    <ToolItem
                                      :icon="EditOutlined"
                                      :tooltip="$t('editSchedule')"
                                      @click="
                                        () =>
                                          dialogs
                                            .EditTaskScheduleDialog({
                                              taskSchedule: data,
                                            })
                                            .finishPromise((d) => {
                                              if (
                                                d?.type === 'update' &&
                                                d.data
                                              ) {
                                                Object.assign(
                                                  data,
                                                  task2ChartData(d.data)
                                                );
                                              } else if (d?.type === 'delete') {
                                                const ind = datas.findIndex(
                                                  (dd) => dd.id === data.id
                                                );
                                                if (ind > -1) {
                                                  datas.splice(ind, 1);
                                                }
                                              }
                                            })
                                      "
                                    ></ToolItem>
                                  </div>
                                  <div class="h items-center gap-2">
                                    <ToolItem
                                      :icon="UploadOutlined"
                                      :tooltip="$t('upTight')"
                                      @click="
                                        () => {
                                          if (prevData) {
                                            const newStart = copy(prevData.end);
                                            const newEnd = dayjs(prevData.end)
                                              .add(
                                                dayjs(data.end).diff(
                                                  dayjs(data.start),
                                                  'second'
                                                ),
                                                'second'
                                              )
                                              .toDate();
                                            return updateTaskInDayById(
                                              notificationStore,
                                              {
                                                id: data.id,
                                                data: {
                                                  startTime:
                                                    newStart.toISOString(),
                                                  endTime: newEnd.toISOString(),
                                                },
                                              }
                                            ).then(() => {
                                              data.start = newStart;
                                              data.end = newEnd;
                                            });
                                          }
                                        }
                                      "
                                    ></ToolItem>
                                    <ToolItem
                                      :icon="ClockCircleOutlined"
                                      :menus="[
                                        {
                                          name: $t('10minutes'),
                                          click: () =>
                                            quickSettingMinutes(data, 10),
                                        },
                                        {
                                          name: $t('20minutes'),
                                          click: () =>
                                            quickSettingMinutes(data, 20),
                                        },
                                        {
                                          name: $t('30minutes'),
                                          click: () =>
                                            quickSettingMinutes(data, 30),
                                        },
                                        {
                                          name: $t('40minutes'),
                                          click: () =>
                                            quickSettingMinutes(data, 40),
                                        },
                                        {
                                          name: $t('45minutes'),
                                          click: () =>
                                            quickSettingMinutes(data, 45),
                                        },
                                        {
                                          name: $t('50minutes'),
                                          click: () =>
                                            quickSettingMinutes(data, 50),
                                        },
                                        {
                                          name: $t('60minutes'),
                                          click: () =>
                                            quickSettingMinutes(data, 60),
                                        },
                                      ]"
                                    >
                                    </ToolItem>
                                  </div>
                                  <Tooltip
                                    :content="
                                      task.state === 'DONE'
                                        ? $t('cancelFinish')
                                        : $t('finish')
                                    "
                                  >
                                    <Checkbox
                                      :model-value="task?.state === 'DONE'"
                                      @update:model-value="
                                        () => {
                                          return taskStore.toggleTaskState(
                                            task!.id!
                                          );
                                        }
                                      "
                                    ></Checkbox>
                                  </Tooltip>
                                  <ToolItem
                                    :icon="CloseOutlined"
                                    :tooltip="$t('removeFromSchedule')"
                                    danger
                                    @click="
                                      () =>
                                        dialogs
                                          .ConfirmDialog({
                                            content: $t(
                                              'removeFromScheduleConfirm'
                                            ),
                                          })
                                          .finishPromise(() => {
                                            return backend
                                              .deleteTaskInDayById({
                                                id: data.id,
                                              })
                                              .then(() => {
                                                const ind = datas.findIndex(
                                                  (d) => d.id === data.id
                                                );
                                                if (ind > -1) {
                                                  datas.splice(ind, 1);
                                                }
                                              });
                                          })
                                    "
                                  ></ToolItem>
                                </Tools>
                              </template>
                            </DefaultDropdown>
                          </div>
                        </div>
                      </Scope>
                    </Scope>
                  </div>
                </Scope>
              </div>
            </div>
          </div>
        </div>
      </Scrollbar>
    </div>
  </div>
</template>
<script lang="ts">
export interface ChartData {
  id: string;
  // name: string
  // description: string
  date: Date;
  start: Date;
  end: Date;
  color: string | number | null;

  data: ReadOnlyTaskInDayWithExtra;

  // 时间段碰撞检测
  collide?: {
    index: number; // 碰撞的第几个
    total: number; // 总共碰撞了几个
  };
}
</script>
<script setup lang="ts">
import { copy } from "fast-copy";
import { DragData, DragDataType } from "@/bizComponents/drag/drag";
import {
  ReadOnlyTaskInDayWithExtra,
  ReadOnlyTaskWithChildren,
  TaskInDay,
} from "@/types";
import { backend } from "@/utils/backend";
import { Dayjs, dayjs, makeDayjsByDateTime } from "@/utils/time";
import {
  AimOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  EditOutlined,
  MoreOutlined,
  NotificationOutlined,
  SettingOutlined,
  UploadOutlined,
} from "@ant-design/icons-vue";
import { dialogs } from "../components/dialog";
import { useTaskStore } from "@/store/task";
import Scrollbar from "@/components/scrollbar/src/Scrollbar.vue";
import {
  createTaskInDay,
  task2ChartData,
  updateTaskInDayById,
} from "@/utils/biz";
import {
  useWeekdayCH,
  taskScheduleHSColorS,
  taskScheduleHSColorL,
  taskScheduleHSColorA,
  motionDelay,
} from "@/const";
import { useTaskGroupStore } from "@/store/taskGroup";
import { calculateTheme } from "@/utils/color";
import { useI18n } from "vue-i18n";
import { useNotificationStore } from "@/store/notification";
import { backendEvent } from "@/store/events";

const props = withDefaults(
  defineProps<{
    requestDatas?: (start: Date, end: Date) => Promise<ChartData[]>;
    background?: number;
  }>(),
  {
    requestDatas: () => Promise.resolve([]),
    background: 1,
  }
);

const bgColor1 = computed(() => `bg-light-${props.background}`);
const bgColor2 = computed(() => `bg-light-${props.background + 1}`);
const bgColor3 = computed(() => `bg-light-${props.background + 2}`);
const bgColor4 = computed(() => `bg-light-${props.background + 3}`);

const dataDateFormat = "YYYY-MM-DD";
const weekdayCH = useWeekdayCH();
const dateContainerRef = ref<HTMLDivElement>();

const emit = defineEmits<{
  (name: "create", date: Date, start: Date): void;
  (name: "click-data", data: ChartData): void;
}>();

const scrollContainerRef = ref<InstanceType<typeof Scrollbar>>();
// const mainContainerRef = ref<HTMLElement>()
const containerRef = ref<HTMLElement>();
const { width: containerWidth, height: containerHeight } =
  useElementSize(containerRef);

const headerHeight = 56; // 自己算
const mainContainerHeight = computed(
  () => containerHeight.value - headerHeight
);
const dateBarHeight = computed(() => headerHeight);

const isUsingGroupColor = useLocalStorage(
  "scheduleChart-isUsingGroupColor",
  true
);
// const interactUnit = useLocalStorage<number>("scheduleChart-interactUnit", 1)
const dateUnitWidth = useLocalStorage("scheduleChart-dateUnitWidth", 240);
const isReverseScrollCross = useLocalStorage(
  "scheduleChart-isReverseScrollCross",
  false
);
const dayTimeBarWidth = ref(64);

const minDayTime = useLocalStorage<number>(
  "scheduleChart-minDayTime",
  7 as any,
  {
    serializer: {
      read: (v) => (v === null ? 7 : Number(v)),
      write: (v) => v.toString(),
    },
  }
);
const maxDayTime = useLocalStorage<number>(
  "scheduleChart-maxDayTime",
  24 as any,
  {
    serializer: {
      read: (v) => (v === null ? 24 : Number(v)),
      write: (v) => v.toString(),
    },
  }
);

const dayTimeUnitAmount = computed(() => maxDayTime.value - minDayTime.value);
const dayTimeBarUnitHeight = computed(
  () => mainContainerHeight.value / dayTimeUnitAmount.value
);
const minHeight = 8;

const today = ref(dayjs().startOf("day"));
const now = ref(dayjs());
const inst = setInterval(() => {
  now.value = dayjs();
}, 5000);
onBeforeUnmount(() => clearInterval(inst));
const currentMonth = ref(today.value.startOf("month"));
const currentWindow = ref<[Dayjs, Dayjs]>([dayjs(), dayjs()]);
const monthShouldRender = ref([currentMonth.value]);
const firstShouldRenderMonth = computed(() => monthShouldRender.value[0]);
const firstDate = computed(() => firstShouldRenderMonth.value.startOf("month"));

function scrollToToday() {
  scrollContainerRef.value?.scrollTo({
    left:
      today.value.diff(firstShouldRenderMonth.value.startOf("month"), "day") *
        dateUnitWidth.value -
      /*offset*/ containerWidth.value / 3,
    //+ (today.value.date() - 1) * dateUnitWidth.value
    // behavior: "smooth",
  });
}

onMounted(() => {
  scrollToToday();

  const { stop } = useResizeObserver(
    () => scrollContainerRef.value?.wrapRef,
    (e) => {
      e.forEach((d) => {
        handleScroll(d.target as HTMLElement);
      });
    }
  );

  onBeforeUnmount(() => {
    stop();
  });
});

function handleUpdateTaskInDays(taskInDays: TaskInDay[]) {
  taskInDays.forEach((d) => {
    const chartData = task2ChartData(d);
    const data = datasDict.value[chartData.id];
    if (data) {
      Object.assign(data, chartData);
    }
  });
}

backendEvent.on("updateTaskInDays", handleUpdateTaskInDays);
onBeforeUnmount(() => {
  backendEvent.off("updateTaskInDays", handleUpdateTaskInDays);
});

function filterData(d: ChartData) {
  return (
    d.start.getHours() >= minDayTime.value &&
    d.end.getHours() <= maxDayTime.value
  );
}
const currentViewWindow = ref<Dayjs[]>([dayjs(), dayjs()]);
const datas = ref<ChartData[]>([]);
const datasDict = computed(() =>
  Object.fromEntries(datas.value.map((d) => [d.id, d]))
);
const finalDatas = computed(() => datas.value.filter(filterData));
watch(
  monthShouldRender,
  async (newVal, old) => {
    const newMonths = newVal.filter(
      (m) => !old || !old.find((o) => o.isSame(m))
    );
    await Promise.all(
      newMonths.map((m) =>
        props
          .requestDatas(m.startOf("month").toDate(), m.endOf("month").toDate())
          .then((d) => {
            datas.value.push(...d);
          })
      )
    );
  },
  {
    immediate: true,
  }
);

const datasInDate = computed(() => {
  const dict: Partial<Record<string, ChartData[]>> = {};
  finalDatas.value.forEach((d) => {
    if (
      d.start.getHours() < maxDayTime.value &&
      d.end.getHours() > minDayTime.value
    ) {
      const dateString = dayjs(d.date).format(dataDateFormat);
      if (!dict[dateString]) {
        dict[dateString] = [];
      }
      dict[dateString].push(d);
    }
  });
  // 将dict中的每个数组按开始时间排序 同时如果有重叠的时间段，根据开始时间安排index，如果碰撞的对象也有碰撞需要处理相连的部分，即处理连锁碰撞的问题。
  Object.keys(dict).forEach((k) => {
    dict[k] = dict[k]!.sort((a, b) => dayjs(a.start).diff(dayjs(b.start)));
    const collideGroups: ChartData[][] = [];
    dict[k]!.forEach((d) => {
      let placed = false;
      for (const group of collideGroups) {
        // console.debug(
        //   `checking for(${taskStore.tasksDict[d.data.taskId]?.content}): `,
        //   d,
        //   group.some(
        //     (other) =>
        //       (dayjs(d.start).isBefore(dayjs(other.end)) &&
        //         dayjs(d.start).isAfter(dayjs(other.start))) ||
        //       (dayjs(d.end).isAfter(dayjs(other.start)) &&
        //         dayjs(d.end).isBefore(dayjs(other.end))) ||
        //       dayjs(d.start).isSame(dayjs(other.start)) ||
        //       dayjs(d.end).isSame(dayjs(other.end)) ||
        //       (dayjs(d.start).isBefore(dayjs(other.start)) &&
        //         dayjs(d.end).isAfter(dayjs(other.end)))
        //   ),
        //   d.id,
        //   group
        // );
        if (
          group.some(
            (other) =>
              (dayjs(d.start).isBefore(dayjs(other.end)) &&
                dayjs(d.start).isAfter(dayjs(other.start))) ||
              (dayjs(d.end).isAfter(dayjs(other.start)) &&
                dayjs(d.end).isBefore(dayjs(other.end))) ||
              dayjs(d.start).isSame(dayjs(other.start)) ||
              dayjs(d.end).isSame(dayjs(other.end)) ||
              (dayjs(d.start).isBefore(dayjs(other.start)) &&
                dayjs(d.end).isAfter(dayjs(other.end)))
          )
        ) {
          group.push(d);
          placed = true;
          break;
        }
      }
      if (!placed) {
        collideGroups.push([d]);
      }
    });
    collideGroups.forEach((group) => {
      group.forEach((d, index) => {
        d.collide = { index, total: group.length };
      });

      group.sort((a, b) => a.start.getTime() - b.start.getTime());
    });
  });
  return dict;
});

const taskStore = useTaskStore();
const taskGroupStore = useTaskGroupStore();
const notificationStore = useNotificationStore();
const hoveringId = ref<string>();
const hoveringData = computed(() =>
  hoveringId.value
    ? datas.value.find((d) => d.id === hoveringId.value)
    : undefined
);
const hoveringTaskId = computed(() =>
  hoveringId.value ? hoveringData.value?.data.taskId : undefined
);
// const hoveringTask = computed(() =>
//   hoveringTaskId.value ? taskStore.tasksDict[hoveringTaskId.value] : undefined,
// )

function handleScroll(el: HTMLElement) {
  const scrollLeft = el.scrollLeft;
  const scrollWidth = el.scrollWidth;
  const scrollContainerWidth = el.clientWidth;
  if (scrollLeft < 1000) {
    const addMonth = monthShouldRender.value[0].subtract(1, "month");
    monthShouldRender.value = [addMonth, ...monthShouldRender.value];
    el.scrollLeft += addMonth.daysInMonth() * dateUnitWidth.value;
  }
  if (scrollWidth - scrollLeft - scrollContainerWidth < 200) {
    const addMonth = monthShouldRender.value[
      monthShouldRender.value.length - 1
    ].add(1, "month");
    monthShouldRender.value = [...monthShouldRender.value, addMonth];
  }

  const currentViewN = Math.floor(scrollLeft / dateUnitWidth.value);
  const viewWidth = Math.ceil(scrollContainerWidth / dateUnitWidth.value);
  currentViewWindow.value = [
    firstDate.value.add(currentViewN, "day"),
    firstDate.value.add(currentViewN + viewWidth, "day"),
  ];
}

function refetchDatas() {
  return props
    .requestDatas(
      monthShouldRender.value[0].startOf("month").toDate(),
      monthShouldRender.value[monthShouldRender.value.length - 1]
        .endOf("month")
        .toDate()
    )
    .then((d) => {
      datas.value = [...d];
    });
}

// 增加相关交互
const interactData = ref<ChartData>();
const interactOffset = ref(0);
const interactOffsetStart = ref(0);
const interactType = ref<"move" | "resizeStart" | "resizeEnd">();
let _mouseMovedAccumulator = 0;
let _mouseMoved = false;
const interactHourOffset = computed(() => {
  return interactOffset.value / dayTimeBarUnitHeight.value;
});
const interactNewStart = computed(() =>
  interactType.value === "resizeEnd"
    ? dayjs(interactData.value?.end)
        .subtract(interactHourOffset.value, "hour")
        .startOf("minute")
    : dayjs(interactData.value?.start)
        .add(interactHourOffset.value, "hour")
        .startOf("minute")
);

function handleDataMouseDown(data: ChartData, top: number) {
  interactType.value = "move";
  interactData.value = data;
  interactOffset.value = 0;
  interactOffsetStart.value = top;
}
const handleDataMouseMove = (e: MouseEvent) => {
  if (interactType.value && interactData.value) {
    if (!_mouseMoved) {
      if (_mouseMovedAccumulator > 5) {
        _mouseMoved = true;
      } else {
        _mouseMovedAccumulator += e.movementY;
      }
    }
    interactOffset.value = Math.max(
      -interactOffsetStart.value,
      interactOffset.value +
        e.movementY *
          (interactType.value === "resizeEnd"
            ? -1
            : 1) /* resizeEnd调整的是bottom、需要相反 */
    );
    if (interactType.value !== "move") {
      // 限制不能到达end / start
      interactOffset.value = Math.min(
        interactOffset.value,
        interactType.value === "resizeStart"
          ? (-dayjs(interactData.value.start).diff(
              interactData.value.end,
              "minute"
            ) /
              60) *
              dayTimeBarUnitHeight.value
          : interactType.value === "resizeEnd"
            ? (dayjs(interactData.value.end).diff(
                interactData.value.start,
                "minute"
              ) /
                60) *
              dayTimeBarUnitHeight.value
            : Number.MAX_VALUE
      );
    } else {
      // 限制不能到达endofday
      interactOffset.value = Math.min(
        interactOffset.value,
        (-dayjs(interactData.value.end).diff(
          dayjs(interactData.value.start)
            .startOf("day")
            .add(maxDayTime.value, "hour"),
          "minute"
        ) /
          60) *
          dayTimeBarUnitHeight.value
      );
    }
    // modify date
    // x axis movement
    if (dateContainerRef.value && interactType.value === "move") {
      let el: HTMLElement | null = e.target as HTMLElement;
      while (el && el !== dateContainerRef.value) {
        if (el.dataset.date) {
          const d = dayjs(el.dataset.date, dataDateFormat).toDate();
          interactData.value.date = d;
          break;
        }
        el = el.parentElement;
      }
    }
  }
};
function handleDataMouseUp() {
  if (interactData.value && interactType.value) {
    if (Math.abs(interactOffset.value) < 1 && !_mouseMoved) {
      emit("click-data", interactData.value!);
    } else if (interactType.value === "move") {
      // set movement
      interactData.value.start = interactNewStart.value.toDate();
      const endDayjs = dayjs(interactData.value.end);
      interactData.value.end = endDayjs
        .add(
          Math.min(
            -endDayjs.diff(endDayjs.endOf("day"), "minute") / 60,
            interactHourOffset.value
          ),
          "hour"
        )
        .startOf("minute")
        .toDate();
      updateTaskInDayById(notificationStore, {
        id: interactData.value.id,
        data: {
          startTime: makeDayjsByDateTime(
            interactData.value.date,
            interactData.value.start
          ).toISOString(),
          endTime: makeDayjsByDateTime(
            interactData.value.date,
            interactData.value.end
          ).toISOString(),
          date: interactData.value.date.toISOString(),
        },
      });
    } else if (interactType.value === "resizeStart") {
      interactData.value.start = interactNewStart.value.toDate();
      updateTaskInDayById(notificationStore, {
        id: interactData.value.id,
        data: {
          startTime: makeDayjsByDateTime(
            interactData.value.date,
            interactData.value.start
          ).toISOString(),
        },
      });
    } else if (interactType.value === "resizeEnd") {
      interactData.value.end = interactNewStart.value.toDate();
      updateTaskInDayById(notificationStore, {
        id: interactData.value.id,
        data: {
          endTime: makeDayjsByDateTime(
            interactData.value.date,
            interactData.value.end
          ).toISOString(),
        },
      });
    }
    interactType.value = undefined;
    interactData.value = undefined;
    interactOffset.value = 0;
    interactOffsetStart.value = 0;
    _mouseMoved = false;
    _mouseMovedAccumulator = 0;
  }
}

function handleDataResizeStartMouseDown(data: ChartData, top: number) {
  interactType.value = "resizeStart";
  interactData.value = data;
  interactOffset.value = 0;
  interactOffsetStart.value = top;
}
function handleDataResizeEndMouseDown(data: ChartData, bottom: number) {
  interactType.value = "resizeEnd";
  interactData.value = data;
  interactOffset.value = 0;
  interactOffsetStart.value = bottom;
}

document.addEventListener("mousemove", handleDataMouseMove);
document.addEventListener("mouseup", handleDataMouseUp);
onBeforeUnmount(() => {
  document.removeEventListener("mousemove", handleDataMouseMove);
  document.removeEventListener("mouseup", handleDataMouseUp);
});

function handleBizDrop(
  type: DragDataType,
  data: DragData<any>,
  m: Dayjs,
  d: number,
  h: number
) {
  if (type === "move-tasks") {
    let finalData = data as DragData<ReadOnlyTaskWithChildren>;
    return Promise.all(
      finalData.datas.map(async (data) =>
        Promise.all([
          createTaskInDay({
            type: "TASK",
            taskId: data.id,
            date: m.date(d).toDate().toISOString(),
            startTime: m
              .date(d)
              .hour(h + minDayTime.value)
              .toDate()
              .toISOString(),
            endTime: m
              .date(d)
              .hour(h + minDayTime.value + 1)
              .toDate()
              .toISOString(),
          }),
          // 取消自动设置日历
          // ...(data.startAt
          //   ? []
          //   : [
          //       taskStore.updateTaskById(data.id, {
          //         startAt: m.date(d).toDate().toISOString(),
          //       }),
          //     ]),
        ])
      )
    ).then((ds) => {
      datas.value.push(...ds.map((d) => task2ChartData(d[0])));
    });
  }
}

function updateData(
  chartData: ChartData,
  start: Date | undefined,
  end: Date | undefined
) {
  return updateTaskInDayById(notificationStore, {
    id: chartData.data.id,
    data: {
      ...(start
        ? {
            startTime: makeDayjsByDateTime(
              chartData.data.date,
              start
            ).toISOString(),
          }
        : {}),
      ...(end
        ? {
            endTime: makeDayjsByDateTime(
              chartData.data.date,
              end
            ).toISOString(),
          }
        : {}),
    },
  }).then(() =>
    Object.assign(chartData, {
      ...(start ? { start } : {}),
      ...(end ? { end } : {}),
    })
  );
}
const { t } = useI18n();
function quickSettingMinutes(data: ChartData, minutes: number) {
  // 先尝试设置end
  const duration = dayjs(data.end).diff(dayjs(data.start), "second");
  const offset = minutes * 60 - duration;
  const newEnd = dayjs(data.end).add(offset, "second");
  // 如果end超过了maxDayTime, 则设置start
  if (newEnd.hour() >= maxDayTime.value) {
    const newStart = dayjs(data.start).subtract(offset, "second");
    // 如果start小于minDayTime，则警告
    if (newStart.hour() < minDayTime.value) {
      dialogs.MessageDialog({
        content: t("cannotSetDayTimeRangeCauseOutOfRange"),
      });
      return;
    } else {
      return updateData(data, newStart.toDate(), undefined);
    }
  } else {
    return updateData(data, undefined, newEnd.toDate());
  }
}

defineExpose({
  refetchDatas,
  scrollToToday,
});
</script>
