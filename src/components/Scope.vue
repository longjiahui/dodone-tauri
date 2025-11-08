<template>
	<slot
		v-bind="
			(d || {}) as keyof T extends never
				? Partial<NonNullable<T>>
				: T
		"
	></slot>
</template>

<script setup lang="ts" generic="T">
withDefaults(
	defineProps<{
		d: T
	}>(),
	{},
)
</script>
