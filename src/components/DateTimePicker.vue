<template>
  <ADatePicker
    class="stretch size-full"
    v-model:value="modelValue"
    value-format="YYYY-MM-DD HH:mm:ss"
    show-time
    :disabled-date
  ></ADatePicker>
</template>
<script setup lang="ts">
import { Dayjs } from "dayjs"

const modelValue = defineModel<string | Dayjs>("modelValue", { required: true })
defineProps<{
  disabledDate?: (date: Dayjs) => boolean
}>()
</script>
