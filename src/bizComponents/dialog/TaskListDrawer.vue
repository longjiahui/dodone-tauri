<template>
  <Drawer :dialog :title="title ?? $t('taskList')">
    <template #default>
      <Scrollbar class="stretch" :view-class="[`px-${drawerPaddingLevel}`]">
        <TaskList :model-value="tasks" :background="2"></TaskList>
      </Scrollbar>
    </template>
  </Drawer>
</template>
<script setup lang="ts">
import { AnyDialogType } from "@/components/dialog/dialog"
import { drawerPaddingLevel } from "@/const"
import { useTaskStore } from "@/store/task"

const props = defineProps<{
  dialog: AnyDialogType
  title?: string
  taskIds: string[]
}>()
const taskStore = useTaskStore()
// 使用计算属性是因为在 TaskList组件中如果有任务更新 则这里能够响应式更新
const tasks = computed(() =>
  props.taskIds
    .map((id) => taskStore.tasksDict[id])
    .filter((t) => !!t)
    .map((t) => t!),
)
</script>
