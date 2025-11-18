import {
  taskAnchor2TaskAnchorWithTaskGroupId,
  TaskAnchorWithTaskGroupId,
} from "@/types";
import { backend } from "@/utils/backend";
import { groupBy } from "@/utils/groupBy";
import { defineStore } from "pinia";
import { useFetchDataStore } from "./fetchData";
import { backendEvent, localTaskEvent } from "./events";
import { sortTaskAnchors } from "@/utils/biz";

export const useTaskAnchorStore = defineStore("taskAnchor", () => {
  const taskAnchors = ref<TaskAnchorWithTaskGroupId[]>([]);
  const fetchDataStore = useFetchDataStore();
  const taskAnchorsDictByTaskId = computed(() =>
    taskAnchors.value.reduce(
      (acc, tv) => {
        acc[tv.taskId] = tv;
        return acc;
      },
      {} as Record<string, TaskAnchorWithTaskGroupId>
    )
  );
  const taskAnchorsDict = computed(() => {
    const dict: Partial<Record<string, TaskAnchorWithTaskGroupId>> = {};
    taskAnchors.value.forEach((tv) => {
      dict[tv.id] = tv;
    });
    return dict;
  });

  const taskAnchorsGroupByTaskGroupId = computed(() => {
    const d = groupBy(taskAnchors.value, "taskGroupId");
    Object.values(d).forEach((d) => d?.sort(sortTaskAnchors));
    return d;
  });
  fetchDataStore.loadTaskAnchorsPromise().then((tvs) => {
    taskAnchors.value = tvs.map((tv) =>
      taskAnchor2TaskAnchorWithTaskGroupId(tv)
    );
  });
  backendEvent.on("deleteTaskGroup", (g) => {
    taskAnchors.value = taskAnchors.value.filter(
      (tv) => tv.taskGroupId !== g.id
    );
  });
  localTaskEvent.on("updateTask", (t) => {
    const found = taskAnchorsDictByTaskId.value[t.id];
    if (found) {
      found.taskGroupId = t.groupId;
    }
  });
  localTaskEvent.on("deleteTasks", (ts) => {
    const ids = ts.map((t) => t.id);
    taskAnchors.value = taskAnchors.value.filter(
      (tv) => !ids.includes(tv.taskId)
    );
  });
  return {
    taskAnchors: readonly(taskAnchors),
    taskAnchorsDictByTaskId: readonly(taskAnchorsDictByTaskId),
    taskAnchorsDict: readonly(taskAnchorsDict),
    taskAnchorsGroupByTaskGroupId: readonly(taskAnchorsGroupByTaskGroupId),

    createTaskAnchor(taskId: string) {
      return backend
        .createTaskAnchor({
          data: { taskId },
        })
        .then((v) => {
          taskAnchors.value.push(taskAnchor2TaskAnchorWithTaskGroupId(v));
        });
    },
    deleteTaskAnchorByTaskId(taskId: string) {
      const taskAnchorInd = taskAnchors.value.findIndex(
        (v) => v.taskId === taskId
      );
      if (taskAnchorInd > -1) {
        const taskAnchor = taskAnchors.value[taskAnchorInd];
        return backend.deleteTaskAnchorById({ id: taskAnchor.id }).then(() => {
          taskAnchors.value.splice(taskAnchorInd, 1);
        });
      } else {
        console.warn(`TaskAnchor with id ${taskId} not found for delete.`);
      }
    },
    toggleTaskAnchor(taskId: string) {
      if (this.isTaskAnchorCreated(taskId)) {
        return this.deleteTaskAnchorByTaskId(taskId);
      } else {
        return this.createTaskAnchor(taskId);
      }
    },
    isTaskAnchorCreated(taskId: string) {
      return !!taskAnchorsDictByTaskId.value[taskId];
    },
    changeOrders(anchors: TaskAnchorWithTaskGroupId[]) {
      const params = anchors.map((a, i) => ({ id: a.id, sortOrder: i }));
      return backend.changeTaskAnchorOrders({ datas: params }).then(() => {
        params.forEach((p) => {
          if (taskAnchorsDict.value[p.id]) {
            Object.assign(taskAnchorsDict.value[p.id]!, p);
          }
        });
      });
    },
  };
});
