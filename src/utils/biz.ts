import type {
  ReadOnlyTaskGroupWithExtra,
  ReadOnlyTaskInDayWithExtra,
  ReadOnlyTaskViewWithExtra,
  ReadOnlyTaskWithChildren,
  StringArrayToUnion,
  TaskAnchorWithTaskGroupId,
} from "@/types";
import { flatMapTree } from "./traverse";
import { BatchCreateTask, GetAPIParams, protocols } from "@/protocol";
import { omit } from "./field";
import { defaultTaskFactor } from "@/const";
import type { ChartData } from "@/bizComponents/ScheduleChart.vue";
import { dayjs } from "./time";
import { useTaskStore } from "@/store/task";
import { backend } from "./backend";
import { getHSLHash } from "./random";
import { type TaskSort, sortTasksByTaskSort } from "@/bizComponents/sort";
import {
  DefinedConditionKey,
  GetTaskFilterModelValueType,
} from "@/bizComponents/filter/conditions";

export function calculateTotalLeaveTasksFactor(
  tasks: ReadOnlyTaskWithChildren[]
) {
  const taskStore = useTaskStore();
  const realTasks = tasks
    .map((t) => taskStore.tasksDict[t.id])
    .filter((t) => !!t)
    .map((t) => ({ ...t })!);
  return flatMapTree(
    realTasks,
    (t) => {
      return t.factor ?? defaultTaskFactor;
    },
    (d) => !d.children.length
  ).reduce((t, b) => t + b!, 0);
}

export function calculateFinishLeaveTasksFactor(
  tasks: ReadOnlyTaskWithChildren[]
) {
  const taskStore = useTaskStore();
  const realTasks = tasks
    .map((t) => taskStore.tasksDict[t.id])
    .filter((t) => !!t)
    .map((t) => ({ ...t })!);
  return flatMapTree(
    realTasks,
    (t) => t.factor ?? defaultTaskFactor,
    (d) => !d.children.length && d.state === "DONE"
  ).reduce((t, b) => t + b!, 0);
}

export function calculatePendingLeaveTasksFactor(
  tasks: ReadOnlyTaskWithChildren[]
) {
  const taskStore = useTaskStore();
  const realTasks = tasks
    .map((t) => taskStore.tasksDict[t.id])
    .filter((t) => !!t)
    .map((t) => ({ ...t })!);
  return flatMapTree(
    realTasks,
    (t) => t.factor ?? defaultTaskFactor,
    (d) => !d.children.length && d.state !== "DONE"
  ).reduce((t, b) => t + b!, 0);
}

type _PartialCloneTaskKeys =
  | "id"
  | "children"
  | "updatedAt"
  | "createdAt"
  | "nextTask"
  | "state"
  | "taskViewTasks";
export function cloneTasks(
  tasks: (Omit<ReadOnlyTaskWithChildren, _PartialCloneTaskKeys> &
    Partial<Pick<ReadOnlyTaskWithChildren, _PartialCloneTaskKeys>>)[],
  createdBy: ReadOnlyTaskWithChildren,
  // 判断是否最上层递归
  _isTop = true
): BatchCreateTask[] {
  return tasks.map((t) => {
    return {
      task: {
        ...omit(t, [
          "id",
          "children",
          "updatedAt",
          "createdAt",
          "nextTask",
          "state",
          "taskViewTasks",
        ]),
        createdByTaskId: createdBy.id,
        ...(_isTop
          ? { createIndex: createdBy.createIndex + 1 }
          : { createIndex: undefined }),
      },
      ...(t.nextTask
        ? {
            nextTask: omit(t.nextTask, [
              "id",
              "taskId",
              "createdAt",
              "updatedAt",
            ]),
          }
        : {}),
      children: t.children?.length
        ? cloneTasks([...t.children], createdBy, false)
        : undefined,
    } satisfies BatchCreateTask;
  });
}

export function sortTasks(
  a: ReadOnlyTaskWithChildren,
  b: ReadOnlyTaskWithChildren,
  taskSort?: TaskSort
) {
  // 优先state
  if (a.state === b.state) {
    // 完成的任务 根据doneAt
    // if (a.state === "DONE") {
    // return (b.doneAt?.getTime() ?? 0) - (a.doneAt?.getTime() ?? 0)

    // } else {
    if (taskSort) {
      const ret = sortTasksByTaskSort(a, b, taskSort);
      if (ret !== 0) {
        return ret;
      }
    }
    // 未完成的任务 根据sortOrder
    if (a.sortOrder !== b.sortOrder) {
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    } else {
      // 一样的sortOrder则根据创建日期
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    //
    // }
  } else {
    return a.state === "DONE" ? 1 : -1;
  }
}
export function sortTaskViews(
  a: ReadOnlyTaskViewWithExtra,
  b: ReadOnlyTaskViewWithExtra
) {
  if (a.sortOrder !== b.sortOrder) {
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  } else {
    // createdAt
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }
}

export function sortTaskGroups(
  a: ReadOnlyTaskGroupWithExtra,
  b: ReadOnlyTaskGroupWithExtra
) {
  if (a.sortOrder !== b.sortOrder) {
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  } else {
    // createdAt
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }
}

export function sortTaskAnchors(
  a: TaskAnchorWithTaskGroupId,
  b: TaskAnchorWithTaskGroupId
) {
  if (a.sortOrder !== b.sortOrder) {
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  } else {
    // createdAt
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }
}

const isShowFinishedTasks = useLocalStorage("isShowFinishedTasks", false);
const isOnlyShowLeaves = useLocalStorage("isOnlyShowLeaves", false);

export const filterEntityKeysInTaskListWithTools = [
  "contentAndDescription",
  "startDate",
  "endDate",
  "notSetCalendar",
  "notScheduled",
  // "hasChildren",
  "view",
] satisfies DefinedConditionKey[];
const filterEntity = useLocalStorage<
  GetTaskFilterModelValueType<
    StringArrayToUnion<typeof filterEntityKeysInTaskListWithTools>
  >
>("taskListWithTools-filterEntity", {});
export function useTaskListToolsOptions() {
  return {
    isShowFinishedTasks,
    isOnlyShowLeaves,
    filterEntity,
  };
}

export function task2ChartData(data: ReadOnlyTaskInDayWithExtra): ChartData {
  // const task = taskStore.tasksDict[data.taskId!]
  return {
    // name: (data.type === "CUSTOM" ? data.content : task?.content) as string,
    id: data.id,
    date: dayjs(data.date).toDate(),
    start: dayjs(data.startTime).toDate(),
    end: dayjs(data.endTime).toDate(),
    color: data.color,
    data,
    // description: task?.description || "",
  };
}

type _CreateTaskInDayParam = GetAPIParams<
  typeof protocols.createTaskInDay
>[0]["data"];
export function createTaskInDay(
  taskInDay: Partial<_CreateTaskInDayParam> &
    Omit<_CreateTaskInDayParam, "color">
) {
  return backend.createTaskInDay({
    data: {
      ...taskInDay,
      color: getHSLHash(taskInDay.taskId).toString(),
    },
  });
}
