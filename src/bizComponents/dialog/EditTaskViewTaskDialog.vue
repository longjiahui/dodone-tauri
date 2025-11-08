<template>
  <Dialog :dialog :title="$t('manageTaskInTaskViews')" size="small">
    <template #autoPadding>
      <template v-if="taskViews.length > 0">
        <Scope
          v-for="taskView in taskViews"
          :d="{
            isSelected: taskViewIds.includes(taskView.id),
          }"
          #default="{ isSelected }"
        >
          <SelectableTag
            @click="handleToggleTaskView(taskView)"
            :title="taskView.name"
            :content="taskView.description"
            :selected="isSelected"
          ></SelectableTag>
        </Scope>
      </template>
      <Empty v-else></Empty>
    </template>
    <template #footer>
      <Button @click="dialog.close()">{{ $t("close") }}</Button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { AnyDialogType } from "@/components/dialog/dialog";
import { useTaskStore } from "@/store/task";
import { useTaskViewStore } from "@/store/taskView";
import { TaskView } from "@/types";

const props = defineProps<{
  dialog: AnyDialogType;
  taskId: string;
}>();

const taskStore = useTaskStore();
const task = computed(() => taskStore.tasksDict[props.taskId]);
const taskViewStore = useTaskViewStore();
const taskViews = computed(() =>
  taskViewStore.taskViews.filter((tv) => tv.type === "ALTERNATIVE")
);
const taskViewIds = computed(
  () => task.value?.taskViewTasks.map((tvt) => tvt.taskViewId) || []
);

async function handleToggleTaskView(taskView: TaskView) {
  const taskViewTask = task.value?.taskViewTasks.find(
    (tvt) => tvt.taskViewId === taskView.id
  );
  if (taskViewTask) {
    // selected
    taskViewStore.deleteTaskViewTaskByTaskViewTask(taskViewTask);
  } else {
    taskViewStore.createTaskViewTask({
      taskId: task.value!.id,
      taskViewId: taskView.id,
    });
  }
}
</script>
