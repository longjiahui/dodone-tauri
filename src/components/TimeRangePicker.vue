<template>
  <ATimeRangePicker v-model:value="modelValue"></ATimeRangePicker>
</template>
<script setup lang="ts">
import { type Dayjs } from "@/utils/time";

const modelValue = defineModel<[Dayjs, Dayjs]>("modelValue", {
  required: true,
});
</script>
