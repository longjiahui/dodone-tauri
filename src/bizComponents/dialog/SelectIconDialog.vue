<template>
  <Dialog :dialog :title="$t('selectIcon')">
    <template #autoPadding>
      <div class="h">
        <div v-for="icon in icons">
          <!-- <AntdIcon :icon="icon"></AntdIcon> -->
          {{ icon }}
        </div>
      </div>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { DialogType } from "@/components/dialog/dialog";
import type { Icon } from "@/types";
import * as Icons from "@ant-design/icons-vue";

defineProps<{
  dialog: DialogType<any, Icon>;
  icon?: string | null;
}>();

const icons = Object.keys(Icons).filter((key) =>
  key.endsWith("Outlined")
) as Icon[];
</script>
