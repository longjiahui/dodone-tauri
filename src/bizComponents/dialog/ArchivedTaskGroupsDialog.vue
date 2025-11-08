<template>
  <Drawer :title="$t('archivedTaskGroup')" :dialog>
    <template #autoPadding>
      <Scrollbar
        v-if="archivedTaskGroups.length"
        class="stretch"
        view-class="v gap-2"
      >
        <SelectableTag
          @click="openDialog(EditTaskGroupDialog, { taskGroup: g })"
          v-for="g in archivedTaskGroups"
          :title="g.name"
          :content="g.description"
          :icon="g.icon || defaultTaskGroupIcon"
          :menus="[
            {
              name: $t('cancelArchive'),
              icon: CloseOutlined,
              click: () => taskGroupStore.archiveTaskGroup(g.id, false),
            },
            {
              name: $t('delete'),
              icon: DeleteOutlined,
              danger: true,
              async click() {
                await openDialog(ConfirmDialog, {
                  content: $t('deleteTaskGroupConfirm'),
                }).finishPromise()
                taskGroupStore.deleteTaskGroupById(g.id)
              },
            },
          ]"
        ></SelectableTag>
      </Scrollbar>
      <Empty v-else class="stretch"></Empty>
    </template>
  </Drawer>
</template>
<script setup lang="ts">
import type { AnyDialogType } from "@/components/dialog/dialog"
import { openDialog } from "@/components/dialog/helper"
import { defaultTaskGroupIcon } from "@/const"
import { useTaskGroupStore } from "@/store/taskGroup"
import { CloseOutlined, DeleteOutlined } from "@ant-design/icons-vue"
import EditTaskGroupDialog from "./EditTaskGroupDialog.vue"
import ConfirmDialog from "@/components/dialog/commonDialog/ConfirmDialog.vue"

defineProps<{
  dialog: AnyDialogType
}>()

const taskGroupStore = useTaskGroupStore()
const archivedTaskGroups = computed(() =>
  taskGroupStore.archivedTaskGroups.slice(),
)
</script>
