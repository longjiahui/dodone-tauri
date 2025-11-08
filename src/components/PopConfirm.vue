<template>
	<APopconfirm
		:title
		:confirm-text
		:cancel-text
		@confirm="$emit('confirm')"
		@cancel="$emit('cancel')"
	>
		<slot></slot>
	</APopconfirm>
</template>
<script lang="ts" setup>
withDefaults(
	defineProps<{
		title?: string
		confirmText?: string
		cancelText?: string
	}>(),
	{
		title: "Confirm",
		confirmText: "Yes",
		cancelText: "No",
	},
)

defineEmits<{
	(e: "confirm"): void
	(e: "cancel"): void
}>()
</script>
