<template>
	<ADatePicker
		v-model:value="modelValue"
		value-format="YYYY-MM-DD"
		:disabled-date
	></ADatePicker>
</template>
<script setup lang="ts">
import { Dayjs } from "dayjs"

const modelValue = defineModel<string | Dayjs>(
	"modelValue",
	{ required: true },
)
defineProps<{
	disabledDate?: (date: Dayjs) => boolean
}>()
</script>
