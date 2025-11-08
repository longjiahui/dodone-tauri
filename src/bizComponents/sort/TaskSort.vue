<template>
  <ClickableIcon
    @click="modelValue.order = modelValue.order === 'asc' ? 'desc' : 'asc'"
    :icon="
      modelValue.order === 'asc'
        ? SortAscendingOutlined
        : SortDescendingOutlined
    "
    :label="`${sortTypeFieldDesc[modelValue.field]}`"
    :menus="
      taskSortFields.map((field) => ({
        name: $t('sortByField', { field: sortTypeFieldDesc[field] }),
        click: () => (modelValue.field = field),
      }))
    "
  ></ClickableIcon>
</template>
<script setup lang="ts">
import {
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons-vue"
import { useSortTypeFieldDesc, TaskSort, taskSortFields } from "."

defineProps<{
  modelValue: TaskSort
}>()
const sortTypeFieldDesc = useSortTypeFieldDesc()
const modelValue = defineModel<TaskSort>("modelValue", { default: {} })
</script>
