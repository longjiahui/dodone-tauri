<template>
  <AButton
    v-wave
    v-if="type !== 'text'"
    :shape="circle ? 'circle' : 'default'"
    :type
    :loading="isLoading"
    :danger
    :ghost
    class="gap-xxs px-xs h items-center justify-start leading-none"
    :disabled
  >
    <slot> </slot>
  </AButton>
  <div
    v-else
    :class="[
      'gap-xxs inline-flex cursor-pointer items-center leading-none duration-300 hover:opacity-85',
      danger ? 'text-danger' : 'text-primary',
    ]"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: "primary" | "default" | "text"
    danger?: boolean
    ghost?: boolean
    circle?: boolean
    disabled?: boolean
    isLoading?: boolean
  }>(),
  {},
)
</script>
