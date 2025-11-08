<template>
	<div
		class="size-full stretch flex flex-col gap-xs justify-center items-center max-h-[320px]"
	>
		<AEmpty
			class="text-lightest"
			:description="description || $t('noData')"
		></AEmpty>
		<slot></slot>
	</div>
</template>
<script setup lang="ts">
defineProps<{ description?: string }>()
</script>
