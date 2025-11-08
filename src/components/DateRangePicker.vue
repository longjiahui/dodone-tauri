<template>
	<ARangePicker
		v-model:value="modelValue"
		value-format="YYYY-MM-DD"
	></ARangePicker>
</template>
<script setup lang="ts">
import { Dayjs } from "dayjs"

const modelValue = defineModel<
	[string, string] | [Dayjs, Dayjs]
>("modelValue", { required: true })
</script>
