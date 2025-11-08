<template>
  <FinalIcon v-if="FinalIcon"></FinalIcon>
</template>
<script setup lang="ts">
import * as Icons from "@ant-design/icons-vue"

const props = defineProps<{
  icon: keyof typeof Icons
}>()

const FinalIcon = computed<any>(() => Icons[props.icon as keyof typeof Icons])
</script>
