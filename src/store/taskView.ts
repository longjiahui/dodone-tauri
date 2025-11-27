import { backend } from "@/utils/backend";
import { defineStore } from "pinia";
import { useTaskStore } from "./task";
import { GetAPIParams, protocols } from "@/protocol";
import { useFetchDataStore } from "./fetchData";
import {
  ReadOnlyTaskViewWithExtra,
  ReadOnlyTaskWithChildren,
  taskView2TaskViewWithExtra,
  TaskViewGUIGroup,
  TaskViewWithExtra,
  TVGCDateTimeSelect,
  type TaskViewTask,
} from "@/types";
import { backendEvent, localTaskEvent } from "./events";
import {
  calculateFinishLeaveTasksFactor,
  calculateTotalLeaveTasksFactor,
} from "@/utils/biz";
import { useTaskViewGUIMetaStore } from "./taskViewGUIMeta";
import { DeepReadonly } from "vue";
import { dayjs } from "@/utils/time";

export const useTaskViewStore = defineStore("taskView", () => {
  const taskViews = ref<TaskViewWithExtra[]>([]);
  const viewsDict = computed(() => {
    const dict: Partial<Record<string, TaskViewWithExtra>> = {};
    taskViews.value.forEach((tv) => {
      dict[tv.id] = tv;
    });
    return dict;
  });
  const taskStore = useTaskStore();
  const fetchDataStore = useFetchDataStore();

  const taskViewTasksMap = ref<
    Partial<
      Record<
        string,
        {
          loaded: boolean;
          taskView: ReadOnlyTaskViewWithExtra;
          tasks: ReadOnlyTaskWithChildren[];
          isScriptLoadedFailed: boolean;
          scriptLoadedFailedReason?: any; //error
        }
      >
    >
  >({});

  Promise.all([
    fetchDataStore.loadTasksPromise(),
    fetchDataStore.loadTaskViewsPromise(),
  ]).then(([_, tvs]) => {
    taskViews.value = tvs.map((d) => taskView2TaskViewWithExtra(d));
    setTimeout(() => {
      taskViews.value.forEach((tv) => {
        loadTasks(tv.id);
      });
    });
  });

  function initTaskViewTasksMapIfNeeded(taskView: ReadOnlyTaskViewWithExtra) {
    let ret = taskViewTasksMap.value[taskView.id];
    if (!ret) {
      ret = {
        loaded: false,
        taskView,
        tasks: [],
        isScriptLoadedFailed: false,
      };
      taskViewTasksMap.value[taskView.id] = ret;
    }
    return ret;
  }

  function getTaskViewAutoScriptFunction(
    // script: string,
    view: ReadOnlyTaskViewWithExtra
  ): (t: ReadOnlyTaskWithChildren) => boolean {
    if (view.type === "AUTO") {
      let scriptFunc: (t: ReadOnlyTaskWithChildren) => boolean;
      if (view.defineMode === "SCRIPT") {
        scriptFunc = taskViewAutoScript2ScriptFunction(view);
      } else if (view.defineMode === "GUI") {
        scriptFunc = taskViewGUI2ScriptFunction(view);
      } else {
        throw new Error("Task view is not in SCRIPT or GUI define mode");
      }
      return (d: ReadOnlyTaskWithChildren) =>
        scriptFunc(d); /* 只对叶子节点生效 */
      //  && !d.children?.length;
    } else {
      throw new Error("Task view is not of type AUTO");
    }
  }

  function taskViewAutoScript2ScriptFunction(
    view: ReadOnlyTaskViewWithExtra
  ): (t: ReadOnlyTaskWithChildren) => boolean {
    const script = view.autoScript || "";
    const item = initTaskViewTasksMapIfNeeded(view);
    try {
      const scriptFunc = eval(script);
      const ret = (t: ReadOnlyTaskWithChildren) => scriptFunc(t);
      if (typeof ret === "function") {
        item.isScriptLoadedFailed = false;
        return ret as (t: ReadOnlyTaskWithChildren) => boolean;
      } else {
        throw new Error("Auto script did not return a function");
      }
    } catch (err) {
      console.warn("Error in autoScript:", err);
      item.isScriptLoadedFailed = true;
      item.scriptLoadedFailedReason = err as any;
      throw err;
    }
  }

  function getTaskView(taskViewId: string) {
    const taskView = taskViews.value.find((tv) => tv.id === taskViewId);
    if (taskView) {
      return taskView;
    } else {
      throw new Error(`Task view with id ${taskViewId} not found`);
    }
  }
  backendEvent.on("createTaskViewTask", async (taskViewTask) => {
    // })
    // taskViewEvent.on("createTaskViewTask", (taskViewTask) => {
    const item = initTaskViewTasksMapIfNeeded(
      getTaskView(taskViewTask.taskViewId)
    );
    if (item.loaded) {
      item.tasks.push(taskStore.tasksDict[taskViewTask.taskId]!);
    }
    _updateTaskViewFactorProgress(taskViewTask.taskViewId);
  });

  function _deleteTaskViewTasks(ts: TaskViewTask[]) {
    for (const taskViewTask of ts) {
      const item = initTaskViewTasksMapIfNeeded(
        getTaskView(taskViewTask.taskViewId)
      );
      if (item.loaded) {
        const index = item.tasks.findIndex((t) => t.id === taskViewTask.taskId);
        if (index > -1) {
          item.tasks.splice(index, 1);
        }
      }
      _updateTaskViewFactorProgress(taskViewTask.taskViewId);
    }
  }
  backendEvent.on("deleteTaskGroup", async (group) => {
    for (const tv of taskViews.value) {
      const item = initTaskViewTasksMapIfNeeded(tv);
      if (item.loaded) {
        item.tasks = item.tasks.filter((t) => t.groupId !== group.id);
        _updateTaskViewFactorProgress(tv.id);
      }
    }
  });
  backendEvent.on("deleteTaskViewTasks", async (ts) => {
    // taskViewEvent.on("deleteTaskViewTask", (taskViewTask) => {
    return _deleteTaskViewTasks(ts);
  });

  async function _updateTaskViewFactorProgress(tvId: string) {
    const taskView = getTaskView(tvId);
    if (taskView) {
      const item = initTaskViewTasksMapIfNeeded(taskView);
      if (item.loaded) {
      } else {
        await loadTasks(tvId);
      }
      taskView.finishedFactor = calculateFinishLeaveTasksFactor(item.tasks);
      taskView.totalFactor = calculateTotalLeaveTasksFactor(item.tasks);
    } else {
      throw new Error(`Task view with id ${tvId} not found`);
    }
  }
  function _updateTask(
    task: ReadOnlyTaskWithChildren
    // autoTaskViews: TaskView[],
  ) {
    const autoTaskViews = taskViews.value.filter((tv) => tv.type === "AUTO");
    autoTaskViews.forEach((tv) => {
      const item = initTaskViewTasksMapIfNeeded(tv);
      if (!item.isScriptLoadedFailed) {
        const func = getTaskViewAutoScriptFunction(tv);
        if (item.loaded) {
          const targetInd = item.tasks.findIndex((t) => t.id === task.id);
          if (!func(task)) {
            if (targetInd > -1) {
              item.tasks.splice(targetInd, 1);
            }
          } else {
            if (targetInd === -1) {
              // 查找原始数据
              // setTimeout为了等待taskStore确实把数据设置到taskStore中
              setTimeout(() => {
                const t = taskStore.tasksDict[task.id];
                if (t) {
                  item.tasks.push(t);
                }
              });
            }
          }
        }
        _updateTaskViewFactorProgress(tv.id);
      }
    });
  }
  localTaskEvent.on("createTask", _updateTask);
  localTaskEvent.on("updateTask", _updateTask);
  localTaskEvent.on("deleteTasks", (ts) => {
    const ids = ts.map((t) => t.id);
    const autoTaskViews = taskViews.value.filter((tv) => tv.type === "AUTO");
    autoTaskViews.forEach((tv) => {
      const item = initTaskViewTasksMapIfNeeded(tv);
      if (item.loaded) {
        const targetInd = item.tasks.findIndex((d) => ids.includes(d.id));
        if (targetInd > -1) {
          item.tasks.splice(targetInd, 1);
        }
      }
    });
  });
  // localTaskEvent.on("deleteTask", async (t) => {
  //   await Promise.all(
  //     t.taskViewTasks.map((d) => {
  //       taskViewEvent.emit("deleteTaskViewTask", d)
  //     }),
  //   )
  // })

  function reloadTasks(taskViewId: string) {
    const taskView = taskViews.value.find((tv) => tv.id === taskViewId);
    if (taskView) {
      const item = initTaskViewTasksMapIfNeeded(taskView);
      item.loaded = false;
      item.tasks = [];
      return loadTasks(taskViewId);
    } else {
      throw new Error(`Task view with id ${taskViewId} not found`);
    }
  }
  const taskViewGUIMetaStore = useTaskViewGUIMetaStore();
  function _testTaskViewGUIGroup(
    view: ReadOnlyTaskViewWithExtra,
    task: ReadOnlyTaskWithChildren,
    group: DeepReadonly<TaskViewGUIGroup>
  ): boolean {
    const isAnd = group.relation === "and";
    const type = isAnd ? "every" : "some";
    const groupResults = group.groups[type]((sg) =>
      _testTaskViewGUIGroup(view, task, sg)
    );
    const conditionResults = group.conditions[type]((c) => {
      // _text condition
      const field = taskViewGUIMetaStore.fields.find((f) => f.id === c.fieldId);
      const operator = taskViewGUIMetaStore.operatorOptions.find(
        (o) => o.id === c.operator
      );
      if (field) {
        const taskFieldValue = field.value(task);
        let conditionValue: any;
        if (field.fieldType === "datetime-select") {
          const condition = c as TVGCDateTimeSelect;
          if (condition.value?.type === "today0") {
            conditionValue = dayjs()
              .startOf("day")
              .add(condition.value.offset || 0, "day");
          } else if (condition.value?.type === "today24") {
            conditionValue = dayjs()
              .endOf("day")
              .add(condition.value.offset || 0, "day");
          } else if (condition.value?.type === "customDateTime") {
            conditionValue = condition.value.value;
          }
        } else {
          conditionValue = c.value;
        }
        // console.debug(
        //   view.name,
        //   task.content,
        //   taskFieldValue,
        //   conditionValue,
        //   !!operator?.func(taskFieldValue, conditionValue),
        //   taskFieldValue <= conditionValue,
        // )
        return !!operator?.func(taskFieldValue, conditionValue);
      }
      return false;
    });
    return isAnd
      ? groupResults && conditionResults
      : groupResults || conditionResults;
  }
  function taskViewGUI2ScriptFunction(view: ReadOnlyTaskViewWithExtra) {
    if (view.defineMode === "GUI" && view.GUIData.groups.length > 0) {
      return (d: ReadOnlyTaskWithChildren) => {
        // console.debug(
        //   d.content,
        //   view.GUIData.groups.every((g) => _testTaskViewGUIGroup(view, d, g)),
        // )
        return view.GUIData.groups.every((g) =>
          _testTaskViewGUIGroup(view, d, g)
        );
      };
    } else {
      throw new Error("Task view is not in GUI define mode or has no GUI data");
    }
  }

  async function loadTasks(taskViewId: string) {
    await fetchDataStore.loadTasksPromise;
    const taskView = getTaskView(taskViewId);
    if (taskView) {
      const item = initTaskViewTasksMapIfNeeded(taskView);
      console.debug("loading Taskview: ", item);
      if (item.loaded) {
      } else {
        if (item.taskView.type === "ALTERNATIVE") {
          // ALTERNATIVE
          await backend
            .getTaskViewTasks({
              search: {
                taskViewId: taskView.id,
              },
            })
            .then((tvts) => {
              item.tasks = tvts
                .map((d) => taskStore.tasksDict[d.taskId]!)
                .filter((d) => !!d);
              item.loaded = true;
              return item;
            });
        } else {
          // AUTO
          // script
          if (item.taskView.type === "AUTO") {
            try {
              const scriptFunc = getTaskViewAutoScriptFunction(item.taskView);
              item.tasks = taskStore.flatTasks.filter((t) => {
                return scriptFunc(t);
              });
            } catch (err) {
              console.error("Error in autoScript:", err);
              item.tasks = [];
            }
          }
          item.loaded = true;
        }
      }
      _updateTaskViewFactorProgress(taskViewId);
      taskViewTasksMap.value[taskViewId] = { ...item };
      return item;
    } else {
      throw new Error(`Task view with id ${taskViewId} not found`);
    }
  }

  async function validateIsTaskInView(
    task: ReadOnlyTaskWithChildren,
    viewId: string
  ) {
    const view = viewsDict.value[viewId];
    if (!view) {
      throw new Error(`Task view with id ${viewId} not found`);
    }
    if (view.type === "AUTO") {
      const item = initTaskViewTasksMapIfNeeded(view);
      if (!item.loaded) {
        await loadTasks(view.id);
      }
      const func = getTaskViewAutoScriptFunction(view);
      return func(task);
    } else {
      return task.taskViewTasks.some((d) => d.taskViewId === view.id);
    }
  }

  return {
    taskViews: readonly(taskViews),
    taskViewTasksMap: readonly(taskViewTasksMap),
    viewsDict: readonly(viewsDict),

    initTaskViewTasksMapIfNeeded,
    loadTasks,
    reloadTasks,
    validateIsTaskInView,

    createTaskView(
      data: GetAPIParams<typeof protocols.createTaskView>[0]["data"]
    ) {
      return backend.createTaskView({ data }).then((tv) => {
        if (tv) {
          taskViews.value.push(taskView2TaskViewWithExtra(tv));
          loadTasks(tv.id);
        }
      });
    },
    updateTaskViewById(id: string, data: Partial<ReadOnlyTaskViewWithExtra>) {
      return backend.updateTaskViewById({ id, data }).then((tv) => {
        if (tv) {
          const tvExtra = taskView2TaskViewWithExtra(tv);
          const index = taskViews.value.findIndex((v) => v.id === id);
          if (index > -1) {
            const tvLocal = taskViews.value[index];
            Object.assign(tvLocal, tvExtra);
            return reloadTasks(tvLocal.id);
          }
        }
      });
    },
    deleteTaskViewById(id: string) {
      return backend.deleteTaskViewById({ id }).then(() => {
        const index = taskViews.value.findIndex((v) => v.id === id);
        if (index > -1) {
          taskViews.value.splice(index, 1);
        }
      });
    },
    createTaskViewTask(
      data: GetAPIParams<typeof protocols.createTaskViewTask>[0]["data"]
    ) {
      return backend.createTaskViewTask({ data });
    },
    deleteTaskViewTaskByTaskViewTask(taskViewTask: TaskViewTask) {
      return backend.deleteTaskViewTaskById({ id: taskViewTask.id });
    },
    changeOrders(views: ReadOnlyTaskViewWithExtra[]) {
      const params = views.map((v, i) => ({ id: v.id, sortOrder: i }));
      return backend.changeTaskViewOrders({ datas: params }).then(() => {
        params.forEach((p) => Object.assign(viewsDict.value[p.id] || {}, p));
      });
    },
  };
});
