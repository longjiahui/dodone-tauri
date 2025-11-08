import { backend } from "@/utils/backend";
import { TaskAnchor } from "@/types";
import { defineStore } from "pinia";

export const useFetchDataStore = defineStore("fetchData", () => {
  const isLoading = ref(true);
  const loadTasksPromise = backend.getTasks();
  const loadTaskGroupsPromise = backend.getTaskGroups();
  const loadTaskViewsPromise = backend.getTaskViews();
  const loadTaskAnchorsPromise = loadTasksPromise.then(
    () =>
      new Promise<TaskAnchor[]>((r) =>
        setTimeout(() => r(backend.getTaskAnchors()), 0)
      )
  );
  const loadingPromise = Promise.all([
    loadTasksPromise,
    loadTaskGroupsPromise,
    loadTaskAnchorsPromise,
    loadTaskViewsPromise,
    //   initTree(tasks.map((t) => task2TaskWithChildren(t)))
    //  should After initTree, or else no tasksDict
  ]).then(() => new Promise((r) => setTimeout(r)));

  loadingPromise.finally(() => (isLoading.value = false));

  return {
    isLoading,
    isLoaded: computed(() => !isLoading.value),
    loadingPromise: () => loadingPromise,
    loadTaskGroupsPromise: () => loadTaskGroupsPromise,
    loadTasksPromise: () => loadTasksPromise,
    loadTaskAnchorsPromise: () => loadTaskAnchorsPromise,
    loadTaskViewsPromise: () => loadTaskViewsPromise,
  };
});
