<template>
  <Dialog :dialog width="400px" :title="$t('setNextTask')">
    <template #default>
      <Scrollbar auto-stretch class="px-3" view-class="v gap-4">
        <div v-if="task.nextTask" class="_block">
          <div class="h items-center gap-2">
            <span>
              当前已循环
              <span class="font-semibold">
                <Button
                  type="text"
                  @click="
                    () =>
                      dialogs
                        .InputDialog({
                          content: '请输入修正后的循环次数',
                          value: task.createIndex.toString(),
                        })
                        .finishPromise((d) => {
                          if (d != null && d !== '' && !isNaN(+d)) {
                            taskStore.updateTaskById(task.id, {
                              createIndex: +d,
                            });
                          }
                        })
                  "
                >
                  {{ task.createIndex }}<EditOutlined></EditOutlined>
                </Button>
              </span>
              次
            </span>
          </div>
        </div>
        <div class="_block">
          <div class="flex items-center justify-between font-semibold">
            <div>
              <Switch
                :modelValue="!entity.mode || entity.mode === 'NOTIME'"
                @update:modelValue="
                  (val) => (entity.mode = val ? 'NOTIME' : 'SIMPLE')
                "
                :texts="['按时间间隔重复', '不自动设置时间']"
              ></Switch>
              <!-- {{ $t("setRepeatConfig") }} -->
            </div>
            <!-- <Button type="text" @click="abs.push(['', '', '', 0])">{{
                $t("addReference")
              }}</Button> -->
          </div>
          <template v-if="entity.mode === 'SIMPLE'">
            <div class="h items-center gap-2">
              <span>每</span>
              <div class="w-[88px]">
                <Input v-model="entity.a" placeholder="a" type="number"></Input>
              </div>
              <span> 天 循环1次 </span>
            </div>
            <div class="h items-center gap-2">
              <span> 每次休息多一天直至 </span>
              <div class="w-[88px]">
                <Input v-model="entity.b" placeholder="b" type="number"></Input>
              </div>
            </div>
            <div>
              下一次任务日期：{{
                formatDate(
                  getNextTaskDate(task, { ...task.nextTask!, ...entity })
                )
              }}
            </div>
            <div v-for="(_, i) in abs" :key="i" class="flex w-[200px] gap-4">
              <Input v-model="abs[i][0]" placeholder="a" type="number"></Input>
              <Input v-model="abs[i][1]" placeholder="b" type="number"></Input>
              <Input
                v-model="abs[i][3]"
                placeholder="offset"
                type="number"
              ></Input>
            </div>
            <HitBlockRaid
              :length="
                entity.endDate
                  ? dayjs(entity.endDate).diff(dayjs(), 'day') + 1
                  : 40
              "
              :abs="
                (
                  [
                    [entity.a, entity.b, undefined, task.createIndex],
                    ...abs,
                  ] as [number, number, string?, number?][]
                ).map((d, i) => ({
                  a: d[0],
                  b: d[1],
                  name: d[2] || i.toString(),
                  offset: d[3] ?? 0,
                }))
              "
            ></HitBlockRaid>
          </template>
        </div>
        <div class="_block">
          <div class="h gap-2 items-center">
            <Button
              type="text"
              @click="
                openDialog(DatePickerDialog, {
                  title: $t('setEndDate'),
                  value: entity.endDate ? dayjs(entity.endDate) : undefined,
                }).finishPromise((d) => {
                  entity.endDate = d?.toDate().toISOString();
                })
              "
            >
              <div v-if="!entity.endDate">
                {{ $t("setEndDate") }}
              </div>
              <div v-else class="h gap-2">
                <EditOutlined class="text-link"></EditOutlined>
                <div>结束日期</div>
                <div>{{ formatDate(entity.endDate) }}</div>
              </div>
            </Button>
            <div>
              <template v-if="!!entity.endDate && entity.repeatTimes != null">
                或
              </template>
              <template v-else> | </template>
            </div>
            <Button
              type="text"
              @click="
                () =>
                  dialogs
                    .InputDialog({
                      content: '设置循环次数',
                    })
                    .finishPromise((d) => {
                      if (d != null && d !== '' && !isNaN(+d)) {
                        entity.repeatTimes = +d;
                      } else {
                        entity.repeatTimes = null;
                      }
                    })
              "
            >
              <div v-if="!(entity.repeatTimes! > 0)">设置循环次数</div>
              <div v-else class="h gap-2">
                <div>循环次数</div>
                <div>{{ entity.repeatTimes }}</div>
              </div>
            </Button>
          </div>
        </div>
        <div class="_block">
          <div class="v gap-2">
            <Switch
              :texts="['使用当前任务内容', '自定义下一个任务的内容']"
              v-model="isUsingRepeatContent"
            ></Switch>
            <JSEditor
              v-if="isUsingRepeatContent"
              v-model="entity.repeatContent"
              placeholder="请输入自定义内容"
            >
              <template #suffix>
                <Tooltip
                  v-if="isRepeatContentGenerateFailed"
                  :content="repeatContentGenerateFailedReason"
                >
                  <span class="text-error">
                    <WarningOutlined></WarningOutlined>
                  </span>
                </Tooltip>
              </template>
            </JSEditor>
            <div class="h items-center gap-2">
              <div>下一个任务内容：</div>
              <div v-if="nextTaskContent">
                {{ nextTaskContent }}
              </div>
            </div>
          </div>
        </div>
        <!-- <div class="_block">
          <div class="v gap-2">
            <Switch
              :texts="['使用当前任务描述', '自定义下一个任务的描述']"
              v-model="isUsingRepeatDescription"
            ></Switch>
            <Textarea
              v-if="isUsingRepeatDescription"
              v-model="entity.repeatDescription"
              placeholder="请输入自定义描述"
            ></Textarea>
          </div>
        </div> -->
      </Scrollbar>
    </template>
    <template #footer>
      <Button @click="dialog.close()">{{ $t("cancel") }}</Button>
      <Button
        type="primary"
        danger
        v-if="nextTask?.id && nextTask.taskId"
        @click="
          () => {
            taskStore.deleteNextTask(nextTask!.taskId);
            dialog.close();
          }
        "
        >{{ $t("clear") }}</Button
      >
      <Button
        type="primary"
        @click="
          dialog.finish({
            mode: entity.mode || 'NOTIME',
            a: toNumber(entity.a),
            b: toNumber(entity.b) || 1,
            endDate: entity.endDate,
            repeatTimes: entity.repeatTimes,
            repeatContent: entity.repeatContent,
            repeatDescription: entity.repeatDescription,
          })
        "
        >{{ $t("resolve") }}</Button
      >
    </template>
  </Dialog>
</template>

<script lang="ts">
export function getNextTaskCustomContent(
  task: ReadOnlyTaskWithChildren,
  content: string,
  callback?: (err: Error | null, content: string) => void
) {
  try {
    let finalContent = "";
    finalContent =
      eval(`
      task=>{
        return \`${content}\`
      }
      `)({ ...JSON.parse(JSON.stringify(task)) }) || task.content;
    callback?.(null, content);
    return finalContent;
  } catch (err) {
    callback?.(err as Error, task.content);
  }
}

export function getNextTaskDate(
  task: ReadOnlyTaskWithChildren,
  nextTask?: NextTask | null
) {
  let { a, b } = nextTask || task.nextTask || {};
  a = toNumber(a);
  b = toNumber(b) || 1;
  const counter = toNumber(task.createIndex);
  return dayjs()
    .add(a + (counter % b), "day")
    .startOf("day");
}
</script>

<script setup lang="ts">
import { DialogType } from "@/components/dialog/dialog";
import { useTaskStore } from "@/store/task";
import { toNumber } from "@/utils/number";
import { formatDate } from "@/utils/time";
import { NextTask, ReadOnlyTaskWithChildren } from "@/types";
import { dayjs } from "@/utils/time";
import { openDialog } from "@/components/dialog/helper";
import DatePickerDialog from "@/components/dialog/commonDialog/DatePickerDialog.vue";
import { dialogs } from "@/components/dialog";
import { WarningOutlined } from "@ant-design/icons-vue";

const props = defineProps<{
  dialog: DialogType<any, Partial<NextTask>>;
  // createIndex: number
  task: ReadOnlyTaskWithChildren;
  nextTask?: NextTask | null;
}>();

const entity = ref<Partial<NextTask>>({ ...props.nextTask });
const taskStore = useTaskStore();
// const daysAmount = 39
// const hits = computed(() => {
// 	const hits: number[] = []
// 	new Array(daysAmount).fill(0).map((_, i) => {
// 		const { a, b } = {
// 			a: +(entity.value.a || 0),
// 			b: +(entity.value.b || 0),
// 		}
// 		const lastHit = hits.slice(-1)?.[0] + 1 || 0
// 		if (
// 			i + 1 ===
// 			lastHit + a + (b ? hits.length % b : 0)
// 		) {
// 			hits.push(i)
// 		}
// 	})
// 	return hits.reduce(
// 		(t, d) => {
// 			t[d] = true
// 			return t
// 		},
// 		{} as Record<number, boolean>,
// 	)
// })

const abs = ref<[string, string, string?, number?][]>([]);
// const isComplex = computed(
// 	() => entity.value.mode === "complex",
// )
const isUsingRepeatContent = ref(!!entity.value.repeatContent);
const isRepeatContentGenerateFailed = ref(false);
const repeatContentGenerateFailedReason = ref("");
const isUsingRepeatDescription = ref(!!entity.value.repeatDescription);

const nextTaskContent = computed(() => {
  return getNextTaskCustomContent(
    props.task,
    entity.value.repeatContent || "",
    (err) => {
      isRepeatContentGenerateFailed.value = !!err;
      if (err) {
        repeatContentGenerateFailedReason.value = String(err);
      } else {
        repeatContentGenerateFailedReason.value = "";
      }
    }
  );
});
</script>

<style scoped>
@reference "../../styles/index.css";

._block {
  @apply bg-light-2 p-3 rounded flex flex-col gap-4;
}
</style>
