<template>
	<ATimeRangePicker
		v-model:value="modelValue"
	></ATimeRangePicker>
</template>
<script setup lang="ts">
import { Dayjs } from "dayjs"

const modelValue = defineModel<[Dayjs, Dayjs]>(
	"modelValue",
	{ required: true },
)
</script>
