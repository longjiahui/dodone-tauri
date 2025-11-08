<template>
  <div class="h text-light items-center gap-2 text-sm">
    <div v-if="texts?.[0]" :class="[!modelValue ? 'text-primary' : '']">
      {{ texts[0] }}
    </div>
    <ASwitch v-model:checked="modelValue"></ASwitch>
    <div v-if="texts?.[1]" :class="[modelValue ? 'text-primary' : '']">
      {{ texts[1] }}
    </div>
  </div>
</template>

<script setup lang="ts">
const modelValue = defineModel<boolean>("modelValue")

defineProps<{
  texts?: [string, string?]
}>()
</script>
