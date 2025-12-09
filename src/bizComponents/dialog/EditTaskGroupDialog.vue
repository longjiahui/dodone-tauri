<template>
  <Dialog :dialog :title="$t('editTaskGroup')" size="small">
    <template #autoPadding>
      <div class="h gap-2">
        <div class="v gap-2">
          <div class="font-semibold">{{ $t("color") }}</div>
          <HSLAHuePicker
            :s="themeHSColorSString"
            :l="themeHSColorLString"
            a="1"
            v-model="group.color"
          ></HSLAHuePicker>
        </div>
        <div class="v gap-2">
          <div class="font-semibold">{{ $t("icon") }}</div>
          <SelectIcon
            :model-value="group.icon || defaultTaskGroupIcon"
            @update:model-value="(v) => (group.icon = v)"
          ></SelectIcon>
        </div>
        <div class="stretch v gap-2">
          <div class="font-semibold">{{ $t("name") }}</div>
          <Input v-focus v-model="group.name" @keyup.enter="resolve" />
        </div>
      </div>
      <div class="v gap-2">
        <div class="font-semibold">{{ $t("description") }}</div>
        <Input v-model="group.description" @keyup.enter="resolve" />
      </div>
    </template>
    <template #footer>
      <Button @click="dialog.close()">{{ $t("cancel") }}</Button>
      <Button @click="resolve" type="primary">{{ $t("resolve") }}</Button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { type AnyDialogType } from "@/components/dialog/dialog";
import {
  defaultTaskGroupIcon,
  themeHSColorLString,
  themeHSColorSString,
} from "@/const";
import { useTaskGroupStore } from "@/store/taskGroup";
import { getHSLHash, getRandomHue } from "@/utils/random";
import { TaskGroup } from "@/types";

const props = defineProps<{
  dialog: AnyDialogType;
  taskGroup?: Partial<TaskGroup>;
}>();

const group = ref({
  name: props.taskGroup?.name || "",
  description: props.taskGroup?.description || "",
  icon: props.taskGroup?.icon || null,
  color:
    props.taskGroup?.color ||
    (props.taskGroup?.id
      ? getHSLHash(props.taskGroup.id).toString()
      : getRandomHue().toString()),
});

const taskGroupStore = useTaskGroupStore();

async function resolve() {
  props.taskGroup?.id
    ? await taskGroupStore.updateTaskGroupById(props.taskGroup.id, {
        name: group.value.name,
        description: group.value.description,
        icon: group.value.icon || null,
        color: group.value.color.toString(),
      })
    : await taskGroupStore.createTaskGroup({ data: group.value });
  props.dialog.finish();
}
</script>
