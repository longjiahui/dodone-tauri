import type {
  NextTask,
  TaskGroup,
  TaskInDay,
  TaskTargetType,
  TaskView,
} from "./entities";
import type {
  GetAPIReturnType,
  ProtocolReturnTask,
  protocols,
} from "@/protocol";
import { useTaskStore } from "@/store/task";
import type { DeepReadonly } from "vue";
import {
  calculateFinishLeaveTasksFactor,
  calculateTaskRestRepeatTimes,
  calculateTaskRestRepeatTimesByProtocolReturnTask,
  calculateTotalLeaveTasksFactor,
  getIsNextTaskCanFinish,
} from "@/utils/biz";
import type { Dayjs } from "@/utils/time";
import { defaultTaskTargetType } from "@/const";
import { copy } from "fast-copy";
import { omit } from "@/utils/field";
export * from "./entities";

export type TaskWithChildren = ProtocolReturnTask & {
  children: TaskWithChildren[];
  targetType: TaskTargetType;
  restRepeatTimes: number;
  isNextTaskCanFinish: boolean;
};

export type ReadOnlyTaskWithChildren = DeepReadonly<TaskWithChildren>;
export type TaskGroupWithExtra = TaskGroup & {
  finishedFactor: number;
  totalFactor: number;
};
export type ReadOnlyTaskGroupWithExtra = DeepReadonly<TaskGroupWithExtra>;

export function task2TaskWithChildren(t: ProtocolReturnTask): TaskWithChildren {
  return taskLocal2TaskWithChildren(task2TaskLocal(t));
}
export function taskLocal2TaskWithChildren(t: TaskLocal): TaskWithChildren {
  return {
    ...t,
    children: [],
  };
}
type TaskLocal = Omit<TaskWithChildren, "children">;
export function task2TaskLocal(t: ProtocolReturnTask): TaskLocal {
  const isNextTaskCanFinish = getIsNextTaskCanFinish(t);
  return {
    ...t,
    targetType: t.targetType ?? defaultTaskTargetType,
    isNextTaskCanFinish,
    restRepeatTimes: calculateTaskRestRepeatTimesByProtocolReturnTask(
      t,
      isNextTaskCanFinish
    ),
  };
}

// export function refreshTaskWithChildrenNextTaskInfo(
//   task: ReadOnlyTaskWithChildren,
//   newNextTask: NextTask | null
// ) {
//   const taskStore = useTaskStore();
//   const newIsNextTaskCanFinish = getIsNextTaskCanFinish(task, newNextTask);
//   taskStore.updateLocalTask(task.id, {
//     nextTask: newNextTask,
//     isNextTaskCanFinish: newIsNextTaskCanFinish,
//     restRepeatTimes: calculateTaskRestRepeatTimes(
//       task,
//       newIsNextTaskCanFinish,
//       newNextTask
//     ),
//   } satisfies Pick<
//     ReadOnlyTaskWithChildren,
//     "nextTask" | "isNextTaskCanFinish" | "restRepeatTimes"
//   >);
// }

export function taskWithChildren2ProtocolReturnTask(
  task: ReadOnlyTaskWithChildren
): DeepReadonly<ProtocolReturnTask> {
  const d = copy({ ...omit(task, "children") });
  return readonly(d);
}

export type TaskAnchorWithTaskGroupId = GetAPIReturnType<
  typeof protocols.getTaskAnchors
>[number] & { task: ReadOnlyTaskWithChildren; taskGroupId: string };

export type TaskViewGUIConditionOperator =
  | ">"
  | ">="
  | "=="
  | "<="
  | "<"
  | "!=";
export type TaskViewGUIGroup = {
  relation: "and" | "or";
  conditions: TaskViewGUICondition[];
  groups: TaskViewGUIGroup[];
};
export type TaskViewGUICondition<Value = any> = {
  fieldId: string;
  operator: TaskViewGUIConditionOperator;
  value?: Value;
};
export type DateTimeFieldTypeOptionId =
  | "null"
  | "today0"
  | "today24"
  | "customDateTime";

export type TVGCDateTimeSelect = TaskViewGUICondition<{
  type: DateTimeFieldTypeOptionId;
  offset?: number;
  value?: Dayjs;
}>;

export type TaskViewGUIData = {
  groups: TaskViewGUIGroup[];
};

export type TaskViewWithExtra = TaskView & {
  finishedFactor: number;
  totalFactor: number;

  GUIData: TaskViewGUIData;
};
export type ReadOnlyTaskViewWithExtra = DeepReadonly<TaskViewWithExtra>;

export function taskAnchor2TaskAnchorWithTaskGroupId(
  tv: GetAPIReturnType<typeof protocols.getTaskAnchors>[number]
): TaskAnchorWithTaskGroupId {
  const taskStore = useTaskStore();
  const task = taskStore.tasksDict[tv.taskId];
  if (task) {
    return { ...tv, task, taskGroupId: task.groupId };
  } else {
    throw new Error("task not found for taskAnchor" + tv.id);
  }
}

export function taskGroup2TaskGroupWithExtra(
  group: GetAPIReturnType<typeof protocols.getTaskGroups>[number],
  tasks: ReadOnlyTaskWithChildren[]
): TaskGroupWithExtra {
  return {
    ...group,
    finishedFactor: calculateFinishLeaveTasksFactor(tasks),
    totalFactor: calculateTotalLeaveTasksFactor(tasks),
  };
}

export function taskView2TaskViewWithExtra(
  view: GetAPIReturnType<typeof protocols.getTaskViews>[number]
): TaskViewWithExtra {
  let GUIData: TaskViewGUIData = {
    groups: [],
  };
  try {
    GUIData = JSON.parse(view.guijsonData || "");
  } catch (err) {
    console.warn(err);
  }
  return {
    ...view,
    finishedFactor: 0,
    totalFactor: 0,
    GUIData,
  };
}

export type FieldType =
  | "select"
  | "task-select"
  | "text-input"
  | "number-input"
  | "switch"
  | "datetime-select";

export type ReadOnlyTaskInDayWithExtra = DeepReadonly<TaskInDay>;

// export type Database = {
//   // primary
//   name: string;
//   path: string;
// };
export type Database = string; // database name

export type ColorMode = "light" | "dark" | "system";
export type ConstObject = Partial<{
  // xxx.db filename
  currentDBName: string;
  colorMode: ColorMode;
  locale: string;
}>;
