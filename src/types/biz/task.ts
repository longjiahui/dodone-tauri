import { dialogs } from "@/components/dialog";
import { ReadOnlyTaskWithChildren } from ".";
import dayjs from "dayjs";
import { useTaskStore } from "@/store/task";
import { defaultTaskFactor, defaultTaskPriority } from "@/const";
import { PieChartOutlined, ThunderboltOutlined } from "@ant-design/icons-vue";

export function handleEditDateRange(task: ReadOnlyTaskWithChildren) {
  return dialogs
    .OptionalDateRangePickerDialog({
      title: "编辑时间",
      value: [
        task.startAt ? dayjs(task.startAt) : undefined,
        task.endAt ? dayjs(task.endAt) : undefined,
      ],
    })
    .finishPromise((d) => {
      if (d) {
        const taskStore = useTaskStore();
        return taskStore.updateTaskById(task.id, {
          startAt: d[0]?.toDate().toISOString() || null,
          endAt: d[1]?.toDate().toISOString() || null,
        });
      }
    });
}
export function handleEditNextTask(task: ReadOnlyTaskWithChildren) {
  return dialogs
    .EditNextTaskDialog({
      nextTask: task.nextTask,
    })
    .finishPromise((d) => {
      if (d) {
        const taskStore = useTaskStore();
        return taskStore.upsertNextTask(task.id, d);
      }
    });
}
export function handleEditDescription(task: ReadOnlyTaskWithChildren) {
  return dialogs
    .MarkdownEditorDialog({
      title: "编辑描述",
      value: task.description,
    })
    .finishPromise((d) => {
      const taskStore = useTaskStore();
      return taskStore.updateTaskById(task.id, { description: d });
    });
}
export function updateFactor(
  task: ReadOnlyTaskWithChildren,
  value: number | string
) {
  const taskStore = useTaskStore();
  return taskStore.updateTaskById(task.id, {
    factor: isNaN(+value) ? defaultTaskFactor : +value,
  });
}
export function handleEditFactor(task: ReadOnlyTaskWithChildren) {
  return dialogs
    .InputDialog({
      type: "number",
      content: "请输入工作量",
      value: (task.factor ?? defaultTaskFactor).toString(),
      prefix: PieChartOutlined,
    })
    .finishPromise((d) => {
      if (d != null) {
        return updateFactor(task, d);
      }
    });
}

export function updatePriority(
  task: ReadOnlyTaskWithChildren,
  value: number | string
) {
  const taskStore = useTaskStore();
  return taskStore.updateTaskById(task.id, {
    priority: isNaN(+value) ? 0 : +value,
  });
}

export function handleEditPriority(task: ReadOnlyTaskWithChildren) {
  return dialogs
    .InputDialog({
      type: "number",
      content: "请输入优先级",
      value: (task.priority ?? 0).toString(),
      prefix: ThunderboltOutlined,
      quickOptions: [
        {
          label: "高 (50)",
          value: "50",
          danger: true,
        },
        {
          label: `中 (${defaultTaskPriority} 默认)`,
          value: defaultTaskPriority.toString(),
        },
        {
          label: "低 (0)",
          value: "0",
        },
      ],
    })
    .finishPromise((d) => {
      if (d != null) {
        return updatePriority(task, d);
      }
    });
}

export function useTaskState(task: MaybeRef<ReadOnlyTaskWithChildren>) {
  return {
    isFinished: computed(() => unref(task).state === "DONE"),
    canEditFactor: computed(() => !unref(task).children.length),
  };
}

export function handleEditTaskTarget(task: ReadOnlyTaskWithChildren) {
  return dialogs.EditTaskTargetDialog({ taskId: task.id });
}
