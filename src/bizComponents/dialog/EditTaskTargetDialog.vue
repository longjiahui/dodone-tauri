<template>
  <Drawer :dialog size="small" :title="$t('editTaskTarget')">
    <template #autoPadding>
      <SelectableTag :title="task?.content"></SelectableTag>
      <div
        class="h items-end gap-2 self-start"
        @click="
          openDialog(InputDialog, {
            value: task?.target?.toString() || '',
            content: $t('typeTargetValue'),
            placeholder: $t('inputTargetValuePlaceholder'),
          }).finishPromise((d) => {
            if (d != null && d !== '') {
              return taskStore.updateTaskById(props.taskId, {
                target: isNaN(+d) ? null : d,
              });
            }
          })
        "
      >
        <SelectableTag
          :title="$t('targetValue')"
          :content="task?.target?.toString() ?? $t('unset')"
        >
        </SelectableTag>
        <Button type="text" v-if="task?.target?.toString() != null">
          <EditOutlined></EditOutlined>
        </Button>
      </div>
      <div
        :class="[
          'v gap-4',
          task?.target === null ? 'pointer-events-none opacity-45' : '',
        ]"
      >
        <div class="v gap-2">
          <div>{{ $t("targetRecordValueType") }}</div>
          <Select
            class=""
            :options="targetTypeOptions"
            :model-value="task?.targetType ?? defaultTaskTargetType"
            @update:model-value="
              (val) =>
                taskStore.updateTaskById(props.taskId, {
                  targetType: val as TaskTargetType,
                })
            "
          ></Select>
        </div>
        <div class="min-h-[120px]" v-if="finalRecords.length > 2">
          <Chart :option="chartOption"></Chart>
        </div>
        <div>目标记录</div>
        <div>
          <Input
            :placeholder="$t('inputTargetRecordValuePlaceholder')"
            v-model="value"
            type="number"
            @keyup.enter="handleCreateTaskTargetRecord"
          ></Input>
        </div>
        <div
          v-if="task?.targetType === 'INCREMENT'"
          class="h items-center gap-2"
        >
          <div class="font-semibold">{{ $t("currentAccumulation") }}</div>
          <div>{{ recordsTotal }}</div>
        </div>
        <Scrollbar class="stretch" view-class="v gap-2">
          <template v-if="records.length">
            <div v-for="r in records">
              <SelectableTag
                @click="
                  openDialog(EditTaskTargetRecordDialog, {
                    record: r,
                  }).finishPromise((d) => {
                    if (d) {
                      return backend
                        .updateTaskTargetRecordById({ id: r.id, data: d })
                        .then(() => refreshRecords());
                    }
                  })
                "
                :title="r.value.toString()"
                :menus="[
                  {
                    name: $t('delete'),
                    icon: DeleteOutlined,
                    danger: true,
                    click() {
                      return openDialog(ConfirmDialog, {
                        content: $t('deleteTargetRecordConfirm'),
                      }).finishPromise(() => {
                        return backend
                          .deleteTaskTargetRecordById({ id: r.id })
                          .then(() => {
                            return refreshRecords();
                          });
                      });
                    },
                  },
                ]"
                :content="formatDateTime(r.recordAt)"
              ></SelectableTag>
            </div>
          </template>
          <Empty v-else></Empty>
        </Scrollbar>
      </div>
    </template>
    <template #footer>
      <Button
        v-if="!!records.length || task?.target != null"
        @click="
          () =>
            dialogs
              .ConfirmDialog({
                content: $t('deleteTargetValueConfirm'),
              })
              .finishPromise(() =>
                taskStore
                  .updateTaskById(props.taskId, {
                    target: null,
                  })
                  .then(() => dialog.close())
              )
        "
        danger
      >
        {{ $t("deleteTargetValue") }}
      </Button>
      <Button @click="dialog.close()">{{ $t("cancel") }}</Button>
    </template>
  </Drawer>
</template>
<script setup lang="ts">
import InputDialog from "@/components/dialog/commonDialog/InputDialog.vue";
import { AnyDialogType } from "@/components/dialog/dialog";
import { openDialog } from "@/components/dialog/helper";
import { useTaskStore } from "@/store/task";
import { backend } from "@/utils/backend";
import { formatDateTime } from "@/utils/time";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons-vue";
import EditTaskTargetRecordDialog from "./EditTaskTargetRecordDialog.vue";
import ConfirmDialog from "@/components/dialog/commonDialog/ConfirmDialog.vue";
import { dialogs } from "@/components/dialog";
import { getOptions } from "@/utils/tab";
import { TaskTargetType } from "@/types";
import { defaultTaskTargetType } from "@/const";

use([
  LineChart,
  GridComponent,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
  MarkLineComponent,
]);

const props = defineProps<{
  dialog: AnyDialogType;
  taskId: string;
}>();

const taskStore = useTaskStore();
const task = computed(() => taskStore.tasksDict[props.taskId]);
const { state: records, execute: refreshRecords } = useAsyncState(
  () => backend.getTaskTargetRecords({ search: { taskId: props.taskId } }),
  [],
  { immediate: true }
);
const recordsTotal = computed(() =>
  records.value.reduce((sum, r) => sum + +r.value, 0)
);
const finalRecords = computed(() => {
  // 增量时候 计算累计值
  if (task.value?.targetType === "INCREMENT") {
    const arr: { value: number; recordAt: Date }[] = [];
    [...records.value].reverse().forEach((r, index) => {
      if (index === 0) {
        arr.push({ value: +r.value, recordAt: new Date(r.recordAt) });
      } else {
        arr.push({
          value: arr[index - 1].value + +r.value,
          recordAt: new Date(r.recordAt),
        });
      }
    });
    return arr;
  } else {
    return [...records.value]
      .reverse()
      .map((r) => ({ value: r.value, recordAt: r.recordAt }));
  }
});

const value = ref("");

function handleCreateTaskTargetRecord() {
  if (value.value && !isNaN(+value.value)) {
    return backend
      .createTaskTargetRecord({
        data: { taskId: props.taskId, value: value.value },
      })
      .then(() => {
        value.value = "";
        return refreshRecords();
      });
  } else {
    console.warn("输入的目标记录不是数字");
  }
}

const chartOption = computed<() => EChartsOption>(() => {
  return () => {
    return {
      grid: {
        top: 8,
        left: 0,
        right: 20,
        bottom: 0,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        show: false,
        data: [...finalRecords.value].map((d) => formatDateTime(d.recordAt)),
      },
      yAxis: {
        type: "value",
        min: (d) => Math.min(d.min, +task.value?.target! || 0) - 1,
        max: (d) => Math.max(d.max, +task.value?.target! || 0) + 1,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross",
          label: {
            backgroundColor: "#6a7985",
          },
        },
      },
      series: [
        {
          data: [...finalRecords.value].map((d) => d.value),
          type: "line",
          markLine: {
            // 去掉箭头
            symbol: ["none", "none"],
            data: [
              {
                lineStyle: {
                  color: "green",
                },
                label: {
                  position: "insideEnd",
                },
                name: "目标值",
                yAxis: +task.value?.target! || 0,
              },
            ],
            silent: true,
          },
        },
      ],
    };
  };
});

const targetTypeOptions = getOptions({
  DEFAULT: "记录值为当前量",
  INCREMENT: "记录值为增量",
} satisfies Record<TaskTargetType, string>);
</script>
