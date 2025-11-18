import { backend } from "@/utils/backend";
import { defineStore } from "pinia";
import { useFetchDataStore } from "./fetchData";
import { localTaskEvent } from "./events";
import {
  ReadOnlyTaskGroupWithExtra,
  ReadOnlyTaskWithChildren,
  taskGroup2TaskGroupWithExtra,
  TaskGroupWithExtra,
} from "@/types";
import { useTaskStore } from "./task";
import {
  calculateFinishLeaveTasksFactor,
  calculateTotalLeaveTasksFactor,
} from "@/utils/biz";
import { TaskGroup } from "@/types";
import { GetAPIParams, protocols } from "@/protocol";
import { omit } from "@/utils/field";

export const useTaskGroupStore = defineStore("taskGroup", () => {
  const taskGroups = ref<TaskGroupWithExtra[]>([]);
  const taskGroupsDict = computed(() => {
    const dict: Partial<Record<string, TaskGroupWithExtra>> = {};
    taskGroups.value.forEach((g) => {
      dict[g.id] = g;
    });
    return dict;
  });
  const nonArchivedTaskGroups = computed(() =>
    taskGroups.value.filter((g) => !g.isArchived)
  );
  const archivedTaskGroups = computed(() =>
    taskGroups.value.filter((g) => g.isArchived)
  );

  const taskStore = useTaskStore();
  const fetchDataStore = useFetchDataStore();
  Promise.all([
    fetchDataStore.loadTaskGroupsPromise(),
    fetchDataStore.loadTasksPromise(),
  ]).then(([groups]) => {
    taskGroups.value = groups.map((g) =>
      taskGroup2TaskGroupWithExtra(
        g,
        taskStore.treeTasksGroupByTaskGroupId[g.id]?.slice() || []
      )
    );
  });

  function updateTaskGroupProgress(ts: ReadOnlyTaskWithChildren[]) {
    ts.forEach((task) => {
      const g = taskGroups.value.find((g) => g.id === task.groupId);
      if (g) {
        g.totalFactor = calculateTotalLeaveTasksFactor(
          taskStore.treeTasksGroupByTaskGroupId[g.id]?.slice() || []
        );
        g.finishedFactor = calculateFinishLeaveTasksFactor(
          taskStore.treeTasksGroupByTaskGroupId[g.id]?.slice() || []
        );
      }
    });
  }
  localTaskEvent.on("createTask", (t) => updateTaskGroupProgress([t]));
  localTaskEvent.on("updateTask", (t) => updateTaskGroupProgress([t]));
  localTaskEvent.on("deleteTasks", updateTaskGroupProgress);

  return {
    taskGroups: readonly(taskGroups),
    taskGroupsDict: readonly(taskGroupsDict),
    nonArchivedTaskGroups: readonly(nonArchivedTaskGroups),
    archivedTaskGroups: readonly(archivedTaskGroups),

    createTaskGroup(
      taskGroup: GetAPIParams<typeof protocols.createTaskGroup>[0]
    ) {
      return backend
        .createTaskGroup({
          data: {
            ...taskGroup.data,
            color: taskGroup.data.color.toString(),
          },
        })
        .then((group) => {
          taskGroups.value.push(taskGroup2TaskGroupWithExtra(group, []));
          return group;
        });
    },
    archiveTaskGroup(id: string, isArchived = true) {
      return this.updateTaskGroupById(id, { isArchived });
    },
    updateTaskGroupById(id: string, taskGroup: Partial<TaskGroup>) {
      return backend
        .updateTaskGroupById({
          id,
          data: taskGroup,
        })
        .then((g) => {
          const taskGroup = taskGroups.value.find((v) => v.id === id);
          if (taskGroup && g) {
            Object.assign(taskGroup, {
              ...omit(g, "createdAt"),
              updatedAt: new Date(g.updatedAt),
            });
          }
        });
    },
    deleteTaskGroupById(id: string) {
      return backend.deleteTaskGroupById({ id }).then(async () => {
        const ind = taskGroups.value.findIndex((g) => g.id === id);
        if (ind > -1) {
          taskGroups.value = taskGroups.value.filter((g) => g.id !== id);
        }
      });
    },
    changeOrders(groups: ReadOnlyTaskGroupWithExtra[]) {
      const params = groups.map((g, i) => ({ id: g.id, sortOrder: i }));
      return backend.changeTaskGroupOrders({ datas: params }).then(() => {
        params.forEach((p) => {
          if (taskGroupsDict.value[p.id]) {
            Object.assign(taskGroupsDict.value[p.id]!, p);
          }
        });
      });
    },
  };
});
