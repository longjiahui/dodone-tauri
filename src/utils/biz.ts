import {
  taskWithChildren2ProtocolReturnTask,
  type ProtocolReturnTask,
  type ReadOnlyTaskGroupWithExtra,
  type ReadOnlyTaskInDayWithExtra,
  type ReadOnlyTaskViewWithExtra,
  type ReadOnlyTaskWithChildren,
  type StringArrayToUnion,
  type TaskAnchorWithTaskGroupId,
} from "@/types";
import { flatMapTree } from "./traverse";
import { BatchCreateTask, GetAPIParams, protocols } from "@/protocol";
import { omit } from "./field";
import { defaultTaskFactor, maxTaskRepeatTimes } from "@/const";
import type { ChartData } from "@/bizComponents/ScheduleChart.vue";
import { Dayjs, dayjs, formatDate } from "./time";
import { useTaskStore } from "@/store/task";
import { backend } from "./backend";
import { getHSLHash } from "./random";
import { type TaskSort, sortTasksByTaskSort } from "@/bizComponents/sort";
import {
  DefinedConditionKey,
  GetTaskFilterModelValueType,
} from "@/bizComponents/filter/conditions";
import { useNotificationStore } from "@/store/notification";
import { dialogs } from "@/components/dialog";
import { cachePromiseWithTimeout } from "./promise";
import { useI18n } from "vue-i18n";
import { getNextTaskDateByProtocolReturnTask } from "@/bizComponents/dialog/EditNextTaskDialog.vue";
import { DeepReadonly } from "vue";

/*
循环任务特殊计算工作量逻辑：
循环任务本质是 设计完成这个任务之后的下一个任务的 执行时间和内容等

所以已完成的任务只需要按照普通的任务工作量计算即可
未完成的任务 根据循环任务设置获取剩余工作量作为总工作量

so: 
1. 计算总工作量时，未完成的循环任务使用剩余工作量计算
2. 计算已完成工作量时，未完成的循环任务不计入
3. 计算未完成工作量时，未完成的循环任务使用剩余工作量计算，也等于 总工作量 - 已完成工作量
*/

export function getIsNextTaskCanFinish(
  t: ProtocolReturnTask | ReadOnlyTaskWithChildren,
  nextTask = t.nextTask
) {
  const finalNextTask = nextTask ?? t.nextTask;
  if (finalNextTask) {
    return (
      (!!(finalNextTask.endDate || finalNextTask.repeatTimes) &&
        finalNextTask.mode === "SIMPLE" &&
        finalNextTask.a > 0) ||
      (finalNextTask.mode === "NOTIME" && finalNextTask.repeatTimes! > 0)
    );
  } else {
    return false;
  }
}

export function calculateTaskRestRepeatTimes(
  task: ReadOnlyTaskWithChildren,
  isNextTaskCanFinish: boolean,
  nextTask = task.nextTask
) {
  return calculateTaskRestRepeatTimesByProtocolReturnTask(
    taskWithChildren2ProtocolReturnTask(task),
    isNextTaskCanFinish,
    nextTask
  );
}

export function calculateTaskRestRepeatTimesByProtocolReturnTask(
  task: DeepReadonly<ProtocolReturnTask>,
  isNextTaskCanFinish: boolean,
  nextTask = task.nextTask
) {
  const finalNextTask = nextTask ?? task.nextTask;
  if (finalNextTask && task.state !== "DONE" && isNextTaskCanFinish) {
    let currentRepeat = task.createIndex;
    let currentDate: Dayjs | null = dayjs().startOf("day");
    if (finalNextTask.mode === "NOTIME" && finalNextTask.repeatTimes! > 0) {
      return (
        finalNextTask.repeatTimes! -
        currentRepeat +
        1 /* +1 是因为 重复次数1次且createIndex为0的情况下是 要完成两次  */
      );
    } else if (finalNextTask.mode === "SIMPLE" && finalNextTask.a > 0) {
      while (
        currentDate &&
        currentRepeat < maxTaskRepeatTimes &&
        (finalNextTask.repeatTimes == null ||
          currentRepeat < finalNextTask.repeatTimes) &&
        (!finalNextTask.endDate ||
          dayjs(new Date(finalNextTask.endDate)).isAfter(currentDate))
      ) {
        currentRepeat += 1;
        currentDate = getNextTaskDateByProtocolReturnTask(
          task,
          finalNextTask,
          currentDate,
          currentRepeat
        );
      }
      return currentRepeat - task.createIndex + 1;
    } else {
      return 1;
    }
  } else {
    return 1;
  }
}

function _calculateTotalLeaveTaskFactor(
  task: ReadOnlyTaskWithChildren
): number {
  const factor = task.factor ?? defaultTaskFactor;
  if (task.nextTask) {
    if (task.isNextTaskCanFinish) {
      return task.restRepeatTimes * factor;
    } else {
      // 无法完成的重复任务不计入工作量
      return 0;
    }
  } else {
    return factor;
  }
}

// 计算任务列表所有任务的总工作量
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
      return _calculateTotalLeaveTaskFactor(t);
    },
    (d) => !d.children.length
  ).reduce((t, b) => t + b!, 0);
}

// 计算某个父任务的所有子任务工作量综合，会考虑这个父任务的重复任务设置
export function calculateTotalLeaveTasksFactorByTask(
  task: ReadOnlyTaskWithChildren
) {
  const taskStore = useTaskStore();
  const t = taskStore.tasksDict[task.id];
  if (t) {
    return calculateTotalLeaveTasksFactor(t.children.slice());
  } else {
    return 0;
  }
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
  return tasks
    .filter((d) => {
      // 有createdBy的任务不需要clone，因为这个任务是循环任务创建出来
      return !d.createdByTaskId;
    })
    .map((t) => {
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
    date: dayjs(new Date(data.date)).toDate(),
    start: dayjs(new Date(data.startTime)).toDate(),
    end: dayjs(new Date(data.endTime)).toDate(),
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

export function updateTaskInDayById(
  notificationStore: ReturnType<typeof useNotificationStore>,
  ...rest: Parameters<typeof backend.updateTaskInDayById>
) {
  return backend.updateTaskInDayById(...rest).then((d) => {
    if (d?.notificationId && d.notification) {
      notificationStore.scheduleNotification(d.notification);
    }
    return d;
  });
}

const { call: _confirmBatchOperation } = cachePromiseWithTimeout(
  async (t: ReturnType<typeof useI18n>["t"]) => {
    return dialogs
      .ConfirmDialog({
        content: t("batchSetPropertiesConfirm"),
      })
      .finishPromise();
  },
  60000
);

export function confirmBatchOperation(
  ...rest: Parameters<typeof _confirmBatchOperation>
) {
  return _confirmBatchOperation(...rest);
}
