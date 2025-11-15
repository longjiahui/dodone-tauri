<template>
  <Drawer :dialog :title="$t('editSubTask')" placement="left">
    <template #autoPadding>
      <Task :model-value="localTask" :background="2"></Task>
      <Input
        v-focus
        :placeholder="$t('taskContentInputPlaceholder')"
        v-model="taskContent"
        @keyup.enter="handleSaveSubTask"
      ></Input>
      <TaskListWithTools
        class="stretch"
        :model-value="subTasks"
        :background="2"
        task-hide-group-name
      ></TaskListWithTools>
      <!-- <div class="v gap-2">
        <div class="font-semibold">名称</div>
        <Input v-model:value="group.name" />
      </div>
      <div class="v gap-2">
        <div class="font-semibold">描述</div>
        <Input v-model:value="group.description" />
      </div> -->
    </template>
    <!-- <template #footer> </template> -->
  </Drawer>
</template>

<script setup lang="ts">
import { DialogType } from "@/components/dialog/dialog";
import { useTaskStore } from "@/store/task";

const props = defineProps<{
  dialog: DialogType<any, { name: string; description: string }>;
  taskId: string;
}>();

// const group = ref({
//   name: props.task?.name || "",
//   description: props.task?.description || "",
// })
const taskStore = useTaskStore();
const localTask = computed(() => {
  const ret = taskStore.tasksDict[props.taskId];
  if (!ret) {
    throw new Error("任务不存在");
  }
  return ret;
});
const subTasks = computed(() => localTask.value.children.slice() || []);
const taskContent = ref("");
function handleSaveSubTask() {
  // return backend
  //   .createTask({
  //     content: taskContent.value,
  //     parentId: props.task.id,
  //     groupId: props.task.groupId,
  //   })
  //   .then((t) => {
  //     subTasks.value.push({ ...t, children: [] })
  //     taskContent.value = ""
  //   })
  return taskStore
    .createTask(taskContent.value, localTask.value.groupId, {
      parentId: props.taskId,
    })
    .then(() => {
      taskContent.value = "";
    });
}
</script>
