import { defineStore } from "pinia";
import {
  GetAPIParams,
  GetAPIReturnType,
  ProtocolReturnTask,
  protocols,
} from "@/protocol";
import {
  NextTask,
  Task,
  ReadOnlyTaskWithChildren,
  task2TaskWithChildren,
  TaskWithChildren,
  task2TaskLocal,
  taskLocal2TaskWithChildren,
  DateType,
} from "@/types";
import { flatMapTree, traverse, traverseSome } from "@/utils/traverse";
import { groupBy } from "@/utils/groupBy";
import { backend } from "@/utils/backend";
import { dayjs } from "@/utils/time";
import { dialogs } from "@/components/dialog";
import { cloneTasks, sortTasks } from "@/utils/biz";
import { useFetchDataStore } from "./fetchData";
import { backendEvent, localTaskEvent } from "./events";

export const useTaskStore = defineStore("task", () => {
  const flatTasks = ref<TaskWithChildren[]>([]);

  const fetchDataStore = useFetchDataStore();
  // 只读，做成ref是因为 效率问题
  // buildTree 过程需要注意析构的问题，需要保持对数据的引用
  const tasksDict = ref<Partial<Record<string, TaskWithChildren>>>({});
  const treeTasks = ref<TaskWithChildren[]>([]);
  // build tree

  function initTree(tasks: TaskWithChildren[]) {
    flatTasks.value = tasks;
    tasksDict.value = flatTasks.value.reduce(
      (acc, task) => {
        acc[task.id] = task;
        return acc;
      },
      {} as typeof tasksDict.value
    );

    treeTasks.value = [];
    flatTasks.value.forEach((t) => {
      if (!t.parentId) {
        if (tasksDict.value[t.id]) {
          treeTasks.value.push(tasksDict.value[t.id]!);
        }
      } else {
        const parent = tasksDict.value[t.parentId!];
        if (parent) {
          parent.children.push(t);
        }
      }
    });
  }

  function buildTree(tasks: TaskWithChildren[]) {
    const subTaskIdMap = new Map<string, boolean>();
    const taskMap = new Map<string, TaskWithChildren>();
    tasks.forEach((t) => taskMap.set(t.id, t));
    const roots: TaskWithChildren[] = [];
    taskMap.forEach((t) => {
      if (!t.parentId) {
        roots.push(t);
      } else {
        const parent = taskMap.get(t.parentId);
        if (parent) {
          parent.children.push(t);
          subTaskIdMap.set(t.parentId, true);
        }
      }
    });
    // 因为更新的父子任务可能处在某一个parentId下，这个时候，parentId不一定为空，但可能在局部的顶层
    taskMap.forEach((t) => {
      if (t.parentId && !subTaskIdMap.get(t.parentId)) {
        roots.push(t);
      }
    });
    return roots;
  }
  async function _upsertTasks2Tree(
    creates: ProtocolReturnTask[],
    updates: ProtocolReturnTask[] = []
  ) {
    const updateTaskLocals = updates.map((t) => task2TaskLocal(t));
    // update
    updateTaskLocals.forEach((t) => {
      if (tasksDict.value[t.id]) {
        Object.assign(tasksDict.value[t.id]!, t);
      }
    });

    const createTasks = creates.map((t) => task2TaskWithChildren(t));
    // create
    // 先把tasks中存在的tree build好，再push
    createTasks.forEach((t) => (tasksDict.value[t.id] = t));
    const tree = buildTree(createTasks);
    flatTasks.value.push(...createTasks);
    // treeTasks.value.push(...tree)
    tree.forEach((t) => {
      if (t.parentId) {
        const parent = tasksDict.value[t.parentId];
        if (parent) {
          parent.children.push(t);
        }
      } else {
        treeTasks.value.push(t);
      }
    });
    const promises: Promise<any>[] = [];
    const updateTasks = updateTaskLocals.map((d) =>
      taskLocal2TaskWithChildren(d)
    );
    promises.push(
      ...createTasks.map((t) => localTaskEvent.emit("createTask", t))
    );
    promises.push(
      ...updateTasks.map((t) => localTaskEvent.emit("updateTask", t))
    );
    // parents
    promises.push(
      ...[...createTasks, ...updateTasks].map(async (t) => {
        if (t.parentId) {
          const parent = tasksDict.value[t.parentId];
          if (parent) {
            return localTaskEvent.emit("updateTask", parent);
          }
        }
      })
    );
    await Promise.all(promises);
  }

  backendEvent.on("batchUpsertTasks", async (d) => {
    const { created, updated } = d || {};
    if (created?.length || updated?.length) {
      return _upsertTasks2Tree(created || [], updated || []);
    }
  });
  // function _upsertTasks2Tree(ts: ProtocolReturnTask[]) {
  //   // update
  //   ts.forEach((t) => {
  //     if (tasksDict.value[t.id]) {
  //       Object.assign(tasksDict.value[t.id]!, t)
  //     }
  //   })

  //   const tasks = ts.map((t) => task2TaskWithChildren(t))
  //   const createTasks = tasks.filter((t) => !tasksDict.value[t.id])
  //   // create
  //   // 先把tasks中存在的tree build好，再push
  //   createTasks.forEach((t) => (tasksDict.value[t.id] = t))
  //   const tree = buildTree(createTasks)
  //   flatTasks.value.push(...createTasks)
  //   // treeTasks.value.push(...tree)
  //   tree.forEach((t) => {
  //     if (t.parentId) {
  //       const parent = tasksDict.value[t.parentId]
  //       if (parent) {
  //         parent.children.push(t)
  //       }
  //     } else {
  //       treeTasks.value.push(t)
  //     }
  //   })
  //   // // 更新taskAnchor的task
  //   // 不更新了、在前端去找引用，保持唯一引用
  //   // const anchor = taskAnchorsDictByTaskId.value[task.id]
  //   // if (anchor) {
  //   //   Object.assign(anchor.task, task)
  //   // }
  // }

  async function _deleteTask2Tree(taskId: string) {
    const task = tasksDict.value[taskId];
    if (task) {
      const ids = flatMapTree([task], (t) => t.id);
      // task+其所有子任务
      const deletedTasks = ids
        .map((id) => tasksDict.value[id])
        .filter((d) => !!d)
        .map((d) => d!);
      flatTasks.value = flatTasks.value.filter((t) => !ids.includes(t.id));
      ids.forEach((id) => delete tasksDict.value[id]);
      if (task.parentId) {
        const parent = tasksDict.value[task.parentId];
        if (parent) {
          parent.children = parent.children.filter((c) => c.id !== taskId);
        }
      } else {
        treeTasks.value = treeTasks.value.filter((t) => t.id !== taskId);
      }
      const promises: Promise<any>[] = [];
      if (task.parentId) {
        const parent = tasksDict.value[task.parentId];
        if (parent) {
          promises.push(
            updateLocalTask(task.parentId, {
              children: parent.children.filter((c) => c.id !== taskId),
            })
          );
        }
      }
      promises.push(localTaskEvent.emit("deleteTasks", deletedTasks));
      await Promise.all(promises);
    } else {
      console.warn(`Task with id ${taskId} not found for deletion.`);
    }
  }

  const treeTasksGroupByTaskGroupId = computed<
    Partial<Record<string, TaskWithChildren[]>>
  >(() => groupBy(treeTasks.value, "groupId"));

  fetchDataStore.loadTasksPromise().then((tasks) => {
    initTree(tasks.map((t) => task2TaskWithChildren(t)));
  });

  async function updateLocalTask(
    taskId: string,
    task: Partial<TaskWithChildren>
  ) {
    const existingTask = tasksDict.value[taskId];
    if (existingTask) {
      Object.assign(existingTask, task);
      await localTaskEvent.emit("updateTask", existingTask);
    } else {
      console.warn(`Task with id ${taskId} not found for updateTask.`);
    }
  }
  backendEvent.on("createTaskViewTask", async (t) => {
    // })
    // taskViewEvent.on("createTaskViewTask", async (t) => {
    await updateLocalTask(t.taskId, {
      taskViewTasks: [...(tasksDict.value[t.taskId]?.taskViewTasks || []), t],
    });
  });
  backendEvent.on("deleteTaskViewTasks", async (ts) => {
    // taskViewEvent.on("deleteTaskViewTask", async (t) => {
    await Promise.all(
      ts.map((t) =>
        updateLocalTask(t.taskId, {
          taskViewTasks: (
            tasksDict.value[t.taskId]?.taskViewTasks || []
          ).filter((v) => v.id !== t.id),
        })
      )
    );
  });

  backendEvent.on("deleteTasks", async (ts) => {
    Promise.all(ts.map((t) => _deleteTask2Tree(t.id)));
  });
  backendEvent.on("deleteTaskGroup", async (group) => {
    const needDeletes = flatTasks.value.filter((t) => t.groupId === group.id);
    await Promise.all(
      needDeletes.map(async (d) => {
        await localTaskEvent.emit("deleteTasks", [d]);
        delete tasksDict.value[d.id];
      })
    );
    treeTasks.value = treeTasks.value.filter((t) => t.groupId !== group.id);
    flatTasks.value = flatTasks.value.filter((t) => t.groupId !== group.id);
  });

  function _updateTaskParent(
    t: ProtocolReturnTask,
    oldParentId: string | null
  ) {
    const newParentId = t.parentId;
    const id = t.id;
    const task = tasksDict.value[id];
    if (task) {
      const oldParent = oldParentId ? tasksDict.value[oldParentId] : null;
      const newParent = newParentId ? tasksDict.value[newParentId] : null;
      if (oldParent) {
        oldParent.children = oldParent.children.filter((c) => c.id !== id);
        localTaskEvent.emit("updateTask", oldParent);
      } else {
        // 从根节点删除
        treeTasks.value = treeTasks.value.filter((c) => c.id !== id);
      }
      if (newParent) {
        newParent.children.push(task);
        localTaskEvent.emit("updateTask", newParent);
      } else {
        // 加到根节点
        treeTasks.value.push(task);
      }
    } else {
      console.warn(
        `Task with id ${id} not found for update parent(_updateTaskParent).`
      );
    }
  }

  return {
    flatTasks: readonly(flatTasks),

    treeTasks: readonly(treeTasks),
    tasksDict: readonly(tasksDict) as Ref<
      Partial<Record<string, ReadOnlyTaskWithChildren>>
    >,
    treeTasksGroupByTaskGroupId: readonly(treeTasksGroupByTaskGroupId),

    async createTask(content: string, groupId: string, extra: Partial<Task>) {
      // return backend
      //   .createTask({
      //     content,
      //     groupId,
      //     ...extra,
      //   })
      //   .then(async (t) => {
      //     await _upsertTasks2Tree([t])
      //     return t
      //   })
      let sameLevelTasks: ReadOnlyTaskWithChildren[] = [];
      const parentId = extra.parentId;
      let hasParent = false;
      if (parentId) {
        const parent = tasksDict.value[parentId];
        if (parent) {
          hasParent = true;
          sameLevelTasks = parent.children.slice();
        }
      }
      if (!hasParent) {
        // sameLevelTasks = treeTasks.value.slice()
        sameLevelTasks =
          treeTasksGroupByTaskGroupId.value[groupId]?.slice() || [];
      }
      sameLevelTasks.sort(sortTasks);
      await this.batchEditTasks({
        create: [
          {
            task: {
              content,
              groupId,
              ...extra,
              sortOrder: 0,
            },
          },
        ],
        update: sameLevelTasks.map((t, i) => ({
          id: t.id,
          sortOrder: i + 1,
        })),
      });
    },
    updateTaskById(id: string, data: Partial<Task>) {
      return backend.updateTaskById({ id, data });
    },
    updateLocalTask,
    async updateTaskParent(
      id: string,
      parentId: string | null,
      extra: Partial<ReadOnlyTaskWithChildren> = {}
    ) {
      const task = tasksDict.value[id];
      if (task) {
        const oldParentId = task.parentId;
        const newParentId = parentId;
        if (oldParentId !== newParentId || Object.keys(extra).length > 0) {
          return backend
            .updateTaskById({ id, data: { parentId, ...extra } })
            .then(async (t) => {
              if (t) {
                return _updateTaskParent(t, oldParentId);
              } else {
                console.warn(`Task with id ${id} not found for update parent.`);
              }
            });
        }
      } else {
        throw new Error("task not found for update parent");
      }
    },
    batchEditTasks(...rest: Parameters<typeof backend.batchEditTasks>) {
      const d = rest?.[0] || {};
      if (!d.create) {
        d.create = [];
      }
      if (!d.update) {
        d.update = [];
      }
      return backend.batchEditTasks(d);
    },
    deleteTaskById(id: string) {
      return backend.deleteTaskById({ id });
    },
    batchDeleteTasks(ids: string[]) {
      return backend.batchDeleteTasks({ ids });
    },

    async finishTask(taskId: string) {
      /**
       * 如果有children未完成，提示会自动完成所有子任务
       */
      const task = tasksDict.value[taskId];
      if (task) {
        const extraCreates: NonNullable<
          GetAPIParams<typeof protocols.batchEditTasks>[0]["create"]
        > = [];
        // 如果有nextTask 设置，则弹窗获取nextTask时间
        if (
          task.nextTask &&
          (!task.nextTask.endDate ||
            dayjs(task.nextTask.endDate).endOf("day").isAfter(dayjs()))
        ) {
          await dialogs
            .EditNextTaskBeforeFinishDialog({
              finishTaskId: taskId,
            })
            .finishPromise((d) => {
              if (d) {
                extraCreates.push(...cloneTasks([d], task));
              }
            });
        }
        if (
          task.children.length &&
          traverseSome(task.children, (t) => t.state !== "DONE")
        ) {
          await dialogs
            .ConfirmDialog({
              content: "完成该任务会自动完成所有子任务，是否完成？",
            })
            .finishPromise();
        }

        function _getIdsNeedFinish(task: TaskWithChildren): string[] {
          const ret: string[] = [];
          if (task.state !== "DONE") {
            ret.push(task.id);
          }
          if (task.children.length) {
            traverse(task.children, (t) => {
              if (t.state !== "DONE") {
                ret.push(t.id);
              }
            });
          }
          return ret;
        }

        const ids = _getIdsNeedFinish(task);

        return this.batchEditTasks({
          create: extraCreates,
          update: ids.map((id) => {
            return {
              id,
              state: "DONE",
              doneAt: new Date().toISOString(),
            };
          }),
        });
      } else {
        console.warn(`Task with id ${taskId} not found for finish.`);
      }
    },

    cancelFinishTask(id: string) {
      const task = tasksDict.value[id];
      if (task) {
        if (task.state === "DONE") {
          return this.updateTaskById(task.id, {
            state: "UNDONE",
          });
        }
      } else {
        console.warn(`Task with id ${id} not found for cancel finish.`);
      }
    },
    toggleTaskState(id: string, toState?: boolean) {
      const task = tasksDict.value[id];
      if (task) {
        if (toState != null) {
          if (toState && task.state !== "DONE") {
            return this.finishTask(id);
          } else if (!toState && task.state === "DONE") {
            return this.cancelFinishTask(id);
          }
        } else {
          if (task.state === "DONE") {
            return this.cancelFinishTask(id);
          } else {
            return this.finishTask(id);
          }
        }
      } else {
        console.warn(`Task with id ${id} not found for toggle state.`);
      }
    },

    upsertNextTask(taskId: string, nextTask: Partial<NextTask>) {
      const task = tasksDict.value[taskId];
      if (task) {
        let ret: Promise<GetAPIReturnType<typeof protocols.getNextTaskById>>;
        if (task.nextTask) {
          ret = backend.updateNextTaskById({
            id: task.nextTask.id,
            data: nextTask,
          });
        } else {
          ret = backend.createNextTask({
            data: {
              taskId,
              ...nextTask,
            },
          });
        }
        return ret.then((nt) => {
          if (nt) {
            if (task.nextTask) {
              Object.assign(task.nextTask, nt);
            } else {
              task.nextTask = nt || null;
            }
          } else {
            console.warn("nextTask not found for task" + taskId);
          }
        });
      } else {
        throw new Error("task not found for nextTask" + taskId);
      }
    },
    deleteNextTask(taskId: string) {
      const task = tasksDict.value[taskId];
      if (task && task.nextTask) {
        return backend.deleteNextTaskById({ id: task.nextTask.id }).then(() => {
          task.nextTask = null;
          localTaskEvent.emit("updateTask", task);
        });
      } else {
        throw new Error("task not found: " + taskId);
      }
    },
    changeOrders(
      tasks: Pick<ReadOnlyTaskWithChildren, "sortOrder" | "id">[],
      extraUpdates: Parameters<typeof backend.batchEditTasks>[0]["update"] = []
    ) {
      // const extraUpdatesDict = Object.fromEntries(extraUpdates.map(u => [u.id, u]))
      const modifiedParentUpdates = extraUpdates.filter(
        (u) => u.parentId !== undefined
      );
      const oldParentIdDict = Object.fromEntries(
        modifiedParentUpdates.map((u) => {
          const t = tasksDict.value[u.id];
          return [u.id, t ? t.parentId : null];
        })
      );
      const pendingUpdates = [
        ...tasks.map((t) => ({
          id: t.id,
          sortOrder: t.sortOrder,
        })),
        ...extraUpdates,
      ];
      // 合并pendingUpdates中id一致的更新，后者覆盖前者
      const mergedUpdates = Object.values(
        pendingUpdates.reduce(
          (acc, update) => {
            acc[update.id] = { ...(acc[update.id] || {}), ...update };
            return acc;
          },
          {} as Record<string, (typeof pendingUpdates)[0]>
        )
      );
      return this.batchEditTasks({
        update: mergedUpdates,
      }).then((d) => {
        return modifiedParentUpdates.map(async (u) => {
          const found = d.updated.find((t) => t.id === u.id);
          if (found) {
            return _updateTaskParent(found, oldParentIdDict[found.id]);
          }
        });
      });
    },
    restADay(d: DateType) {
      return backend.restADay({ date: d });
    },
  };
});
