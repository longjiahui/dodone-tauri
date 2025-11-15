<template>
  <Dialog :dialog="dialog" :title="title ?? $t('select')" :width>
    <template #autoPadding>
      <div
        v-for="o in options"
        :key="o.id"
        class="bg-light-2 cursor-pointer rounded p-2 duration-300 hover:opacity-80"
        @click="dialog.finish(o)"
      >
        {{ o.name }}
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DialogType } from "@/components/dialog/dialog";
type Option = {
  name?: string;
  id?: string | number | symbol;
};
withDefaults(
  defineProps<{
    dialog: DialogType<any, Option>;
    title?: string;
    width?: string;
    options?: Option[];
  }>(),
  {
    width: "320px",
  }
);
</script>
