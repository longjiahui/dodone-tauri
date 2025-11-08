<template>
  <Dialog :dialog :title="$t('selectTask')" size="large">
    <template #default>
      <div class="h stretch h-full items-stretch [&>div]:px-4">
        <div class="v border-light-3 gap-2 border-r">
          <SelectableTag
            v-for="g in taskGroupStore.taskGroups"
            :title="g.name"
            :content="g.description"
            :selected="g.id === finalGroupId"
            @click="currentGroupId = g.id"
          ></SelectableTag>
        </div>
        <div class="v stretch">
          <Scrollbar class="stretch">
            <SelectableTag
              @click="groupSelectable && (selectedId = null)"
              :title="taskGroup?.name"
              :content="taskGroup?.description"
              :selected="selectedId === null"
            ></SelectableTag>
            <Tree :loop-datas="tasks" default-expand-all>
              <template #default="{ item }">
                <div class="p-1">
                  <SelectableTag
                    :selected="selectedId === item.id"
                    :title="item.content"
                    :content="item.description"
                    @click="selectedId = item.id"
                  >
                  </SelectableTag>
                </div>
              </template>
            </Tree>
          </Scrollbar>
        </div>
      </div>
    </template>
    <template #footer>
      <Button @click="dialog.close()">{{ $t("cancel") }}</Button>
      <Button
        :disabled="
          selectedId === undefined ||
          (!!selectedId && !taskStore.tasksDict[selectedId!])
        "
        type="primary"
        @click="dialog.finish(selectedId!)"
        >{{ $t("resolve") }}</Button
      >
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DialogType } from "@/components/dialog/dialog"
import { useTaskStore } from "@/store/task"
import { useTaskGroupStore } from "@/store/taskGroup"
import { ReadOnlyTaskWithChildren } from "@/types"
import { mapTree } from "@/utils/traverse"

const props = defineProps<{
  dialog: DialogType<any, string | null>

  groupSelectable?: boolean
  self?: ReadOnlyTaskWithChildren
}>()

const taskStore = useTaskStore()
const taskGroupStore = useTaskGroupStore()

const taskGroup = computed(() =>
  taskGroupStore.taskGroups.find((g) => g.id === finalGroupId.value),
)
// const tasks = computed(() =>
//   taskStore.treeTasks.filter((t) => t.groupId === props.self.groupId),
// )
const tasks = computed(() =>
  props.self?.id
    ? mapTree(
        taskStore.treeTasksGroupByTaskGroupId[finalGroupId.value]?.slice() ||
          [],
        (t) => ({ ...t }),
        {
          preFilter: (t) =>
            t.id !== props.self!.id && t.groupId === props.self!.groupId,
        },
      )
    : taskStore.treeTasksGroupByTaskGroupId[finalGroupId.value]?.slice() || [],
)
const selectedId = ref<string | null>()

const currentGroupId = ref<string | undefined>(props.self?.groupId)
const finalGroupId = computed(
  () =>
    taskGroupStore.taskGroups.find((g) => g.id === currentGroupId.value)?.id ??
    taskGroupStore.taskGroups[0]?.id,
)
</script>
