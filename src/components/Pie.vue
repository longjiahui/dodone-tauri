<template>
	<svg
		:style="{
			width: `${r * 2}px`,
			height: `${r * 2}px`,
		}"
		class="rotate-[270deg] rounded-full"
	>
		<circle
			:class="color"
			fill="none"
			stroke-width="2px"
			:r="r"
			:cx="r"
			:cy="r"
		></circle>
		<circle
			:class="[color, 'duration-300']"
			:cx="r"
			:cy="r"
			:r="r / 2"
			fill="none"
			:stroke-width="r"
			:style="{
				strokeDashoffset: Math.ceil(
					Math.PI * r * (1 - progress),
				),
				strokeDasharray: Math.ceil(Math.PI * r),
			}"
		></circle>
	</svg>
</template>
<script setup lang="ts">
const props = withDefaults(
	defineProps<{
		r?: number
		progress?: number
	}>(),
	{
		r: 6,
		progress: 0,
	},
)
const color = computed(() => {
	return {
		0: "stroke-primary",
		1: "stroke-primary",
		2: "stroke-warn",
		3: "stroke-danger",
		4: "stroke-danger",
	}[Math.floor((props.progress * 100) / 25)]
})
</script>
