<template>
	<DefaultDropdown>
		<slot></slot>
		<template #body>
			<div class="p-s">
				<Textarea></Textarea>
			</div>
		</template>
	</DefaultDropdown>
</template>

<script lang="ts" setup></script>
