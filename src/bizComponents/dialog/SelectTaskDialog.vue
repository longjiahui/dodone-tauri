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
            >
              <template #title-prefix>
                <div
                  :class="[
                    'px-2 rounded',
                    selectedId === null ? 'bg-primary-dark' : 'bg-light-4',
                  ]"
                >
                  {{ $t("taskGroup") }}
                </div>
              </template>
            </SelectableTag>
            <Tree :loop-datas="tasks" expand-strategy="all">
              <!-- custom-expand-element -->
              <template #default="{ item }">
                <div class="p-1">
                  <SelectableTag
                    :selected="selectedId === item.id"
                    :title="item.data.content"
                    :content="item.data.description"
                    @click="selectedId = item.id"
                  >
                    <template #title-prefix v-if="item.data.state === 'DONE'">
                      <CheckCircleOutlined></CheckCircleOutlined>
                    </template>
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
        @click="
          dialog.finish({
            taskId: selectedId as string | null,
            groupId: selectedtaskGroupId,
          })
        "
        >{{ $t("resolve") }}</Button
      >
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DialogType } from "@/components/dialog/dialog";
import { LoopData } from "@/components/Loop.vue";
import { useTaskStore } from "@/store/task";
import { useTaskGroupStore } from "@/store/taskGroup";
import { ReadOnlyTaskWithChildren } from "@/types";
import { sortTasks } from "@/utils/biz";
import { mapTree } from "@/utils/traverse";
import { CheckCircleOutlined } from "@ant-design/icons-vue";

const props = defineProps<{
  dialog: DialogType<
    any,
    {
      taskId: string | null;
      groupId: string;
    }
  >;

  groupSelectable?: boolean;
  self?: ReadOnlyTaskWithChildren;
}>();

const taskStore = useTaskStore();
const taskGroupStore = useTaskGroupStore();

const taskGroup = computed(() =>
  taskGroupStore.taskGroups.find((g) => g.id === finalGroupId.value)
);
// const tasks = computed(() =>
//   taskStore.treeTasks.filter((t) => t.groupId === props.self.groupId),
// )
const tasks = computed(() => {
  return mapTree<ReadOnlyTaskWithChildren, LoopData<ReadOnlyTaskWithChildren>>(
    taskStore.treeTasksGroupByTaskGroupId[finalGroupId.value]?.slice() || [],
    (t) => {
      return {
        id: t.id,
        data: t,
        children: [],
      };
    },
    // satisfies LoopData<ReadOnlyTaskWithChildren>
    {
      ...(props.self?.id
        ? {
            preFilter: (t) =>
              t.id !== props.self!.id && t.groupId === props.self!.groupId,
          }
        : {}),
      sort: (a, b) => sortTasks(a.data, b.data),
    }
  );
});
const selectedId = ref<string | null>();
const selectedtaskGroupId = computed(
  () =>
    (selectedId.value != null
      ? taskStore.tasksDict[selectedId.value]?.groupId
      : null) ?? finalGroupId.value
);

const currentGroupId = ref<string | undefined>(props.self?.groupId);
const finalGroupId = computed(
  () =>
    taskGroupStore.taskGroups.find((g) => g.id === currentGroupId.value)?.id ??
    taskGroupStore.taskGroups[0]?.id
);
</script>
