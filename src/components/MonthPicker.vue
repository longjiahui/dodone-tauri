<template>
  <div class="flex items-stretch justify-between gap-4">
    <slot></slot>
    <div class="flex items-center gap-2">
      <div
        :class="['h size-[24px] cursor-pointer items-center']"
        @click="month = month.subtract(1, 'month')"
      >
        <LeftOutlined />
      </div>
      <!-- <div>
        <Input
          class="text-center"
          disabled
          :model-value="formatDate(month.startOf('month'), 'YYYY.MM')"
        >
        </Input>
      </div> -->
      <MonthPicker
        class="h-[24px]"
        :allow-clear="false"
        v-model:value="month"
        input-read-only
      >
      </MonthPicker>
      <!-- <div>
        {{ formatDate(month.startOf("month"), "YYYY.MM") }}
      </div> -->

      <div
        :class="['h size-[24px] cursor-pointer items-center']"
        @click="month = month.add(1, 'month')"
      >
        <RightOutlined />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { dayjs, Dayjs, formatDate } from "@/utils/time"
import { MonthPicker } from "ant-design-vue"

const month = defineModel<Dayjs>("modelValue", {
  default: dayjs(),
})
</script>
