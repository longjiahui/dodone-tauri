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
  calculateTotalLeaveTasksFactor,
} from "@/utils/biz";
import type { Dayjs } from "@/utils/time";
import { defaultTaskTargetType } from "@/const";
export * from "./entities";

export type TaskWithChildren = ProtocolReturnTask & {
  children: TaskWithChildren[];
  targetType: TaskTargetType;
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
  return {
    ...t,
    targetType: t.targetType ?? defaultTaskTargetType,
  };
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
