<template>
  <div v-if="hasEmoji(icon || '')">
    {{ icon }}
  </div>
  <!-- <AntdIcon v-else :icon="icon as any"></AntdIcon> -->
</template>
<script setup lang="ts">
import { hasEmoji } from "unicode-emoji-utils"

defineProps<{
  icon: string | null
}>()
</script>
