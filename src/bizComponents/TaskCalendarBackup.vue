<template>
  <div :class="['v stretch size-full gap-3 py-3', bgLight1]">
    <div class="h justify-between gap-2 px-3">
      <div class="h items-center gap-2">
        <div class="text-light text-sm">根据</div>
        <Switch
          :texts="['开始时间', '结束时间']"
          v-model="baseOnEndAt"
        ></Switch>
      </div>
      <div class="h items-center gap-2">
        <Button
          type="text"
          class="text-light"
          @click="month = month.subtract(1, 'month')"
        >
          <LeftOutlined></LeftOutlined>
        </Button>
        <div class="text-light font-bold">
          {{ month.format("YYYY 年 MM 月") }}
        </div>
        <Button
          type="text"
          class="text-light"
          @click="month = month.add(1, 'month')"
        >
          <RightOutlined></RightOutlined>
        </Button>
      </div>
    </div>
    <Scrollbar class="stretch">
      <Calendar :month="month" class="px-3">
        <template #weekday="{ weekdayCH }">
          <div :class="['p-2 text-center', bgLight2]">
            {{ weekdayCH }}
          </div>
        </template>
        <template #default="{ d, date, isToday }">
          <BizDrop
            channel="move-tasks"
            #default="{ setRef, isDroppingActive }"
            @drop="
              (c, d) => {
                if (c === 'move-tasks') {
                  d.datas.slice().forEach((t) => {
                    const dateRaw = getRerferenceDate(t)
                    const key = getRerferenceDateKey(t)
                    if (!dateRaw) {
                      t[key] = dayjs()
                        .year(month.year())
                        .month(month.month())
                        .date(date)
                    } else {
                      const dateDayjs = dayjs(dateRaw)
                      t[key] = dateDayjs
                        .year(month.year())
                        .month(month.month())
                        .date(date)
                    }
                    taskStore.updateTaskById(t.id, {
                      [key]: t[key],
                    })
                  })
                }
              }
            "
          >
            <div
              :class="[
                'v drop-area size-full',
                isDroppingActive ? 'dropping-active' : '',
                // d.startOf('day').isBefore(dayjs().startOf('day'))
                //   ? 'opacity-50'
                //   : '',
              ]"
            >
              <div
                :class="[
                  'text-light p-2 py-0.5 text-center text-sm',
                  // 'sticky top-[30px] z-10',
                  bgLight2,
                  isToday ? 'bg-primary rounded font-bold text-white' : '',
                ]"
              >
                {{ date }}
              </div>
              <Scope
                :d="{
                  tasks: currentMonthLeaveTasksGroupByDate.get(date) || [],
                }"
                #default="{ tasks }"
              >
                <div
                  :ref="setRef"
                  :class="['stretch v !min-h-[56px] gap-2 p-1']"
                >
                  <Scope
                    v-for="t in tasks"
                    :d="{
                      taskGroup: taskGroupsDict[t.groupId],
                      theme: taskGroupsDict[t.groupId]?.color
                        ? calculateTheme(taskGroupsDict[t.groupId]!.color, {
                            a: 1,
                            s: themeHSColorS,
                            l: themeHSColorL,
                          })
                        : null,
                    }"
                    #default="{ theme, taskGroup }"
                  >
                    <BizDrag
                      :drag-datas="
                        () => [
                          {
                            type: 'move-tasks',
                            datas: [t],
                          },
                          {
                            type: `move-tasks-${t.groupId}`,
                            datas: [t],
                          },
                        ]
                      "
                      #default="{ setRef }"
                    >
                      <TaskToolsDropdown hide-delete :task="t">
                        <template #default>
                          <div
                            :ref="setRef"
                            :class="[
                              bgLight2,
                              'h cursor-pointer items-center rounded break-all duration-300 hover:opacity-65',
                              t.state === 'DONE' ? 'opacity-50' : '',
                            ]"
                            :style="theme?.cssVariables"
                          >
                            <Tooltip v-if="theme" :content="taskGroup?.name">
                              <div class="h items-center self-stretch px-2">
                                <div
                                  class="size-2 rounded-full bg-[var(--theme)]"
                                ></div>
                              </div>
                            </Tooltip>
                            <div class="py-1.5 pr-2">
                              <div
                                :title="t.content"
                                :class="[
                                  'stretch line-clamp-1',
                                  t.state === 'DONE' ? 'line-through' : '',
                                ]"
                              >
                                {{ t.content }}
                              </div>
                            </div>
                          </div>
                        </template>
                        <template #before-delete>
                          <ToolItem
                            @click="
                              () =>
                                taskStore.updateTaskById(t.id, {
                                  startAt: null,
                                  endAt: null,
                                })
                            "
                            :icon="CloseOutlined"
                            danger
                            tooltip="从日历移除"
                          ></ToolItem>
                        </template>
                      </TaskToolsDropdown>
                    </BizDrag>
                  </Scope>
                </div>
              </Scope>
            </div>
          </BizDrop>
        </template>
      </Calendar>
    </Scrollbar>
  </div>
</template>
<script setup lang="ts">
import { themeHSColorL, themeHSColorS } from "@/const"
import { useTaskStore } from "@/store/task"
import { useTaskGroupStore } from "@/store/taskGroup"
import { ReadOnlyTaskWithChildren } from "@/types"
import { sortTasks } from "@/utils/biz"
import { calculateTheme, useTheme } from "@/utils/color"
import { dayjs } from "@/utils/time"
import { CloseOutlined } from "@ant-design/icons-vue"
import { ref } from "vue"

const month = ref(dayjs())
const bg = 1
const bgLight1 = `bg-light-${bg}`
const bgLight2 = `bg-light-${bg + 1}`
const bgLight3 = `bg-light-${bg + 2}`
const taskStore = useTaskStore()
const taskGroupStore = useTaskGroupStore()
const taskGroupsDict = computed(() => taskGroupStore.taskGroupsDict)

const baseOnEndAt = useLocalStorage("taskCalendar-baseOnEndAt", false)
// 搜索叶子节点
const leaveTasks = computed(() =>
  taskStore.flatTasks.filter((t) => !t.children.length),
)

function getRerferenceDateKey(d: ReadOnlyTaskWithChildren) {
  return baseOnEndAt.value ? "endAt" : "startAt"
}
function getRerferenceDate(d: ReadOnlyTaskWithChildren) {
  return baseOnEndAt.value ? d.endAt : d.startAt
}

// 搜索当前月份的叶子节点
const currentMonthLeaveTasks = computed(() => {
  return leaveTasks.value.filter((t) => {
    const dateRaw = getRerferenceDate(t)
    if (!dateRaw) return false
    const date = dayjs(dateRaw)
    return (
      date.year() === month.value.year() && date.month() === month.value.month()
    )
  })
})

// groupby date
const currentMonthLeaveTasksGroupByDate = computed(() => {
  const map = new Map<number, typeof leaveTasks.value>()
  for (const t of currentMonthLeaveTasks.value) {
    const dateRaw = getRerferenceDate(t)
    if (!dateRaw) continue
    const date = dayjs(dateRaw)
    if (!map.has(date.date())) {
      map.set(date.date(), [])
    }
    map.get(date.date())?.push(t)
  }
  // 排序
  map.forEach((tasks) => {
    tasks.sort(sortTasks)
  })
  return map
})
</script>
