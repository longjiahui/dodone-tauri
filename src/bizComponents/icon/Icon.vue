<template>
  <AntdIcon
    v-if="AntdIcons[icon as keyof typeof AntdIcons]"
    :icon="finalIcon"
  ></AntdIcon>
  <!-- <div
    v-else
    class="size-5 bg-center bg-cover"
    :style="{
      backgroundImage: `url(/icon/${icon}.png)`,
    }"
  ></div> -->
</template>
<script setup lang="ts">
// import { hasEmoji } from "unicode-emoji-utils";
import * as AntdIcons from "@ant-design/icons-vue";
const props = defineProps<{
  icon: string | null;
}>();

const finalIcon = computed(() => props.icon as any);
</script>
