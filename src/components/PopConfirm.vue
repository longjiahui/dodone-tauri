<template>
  <APopconfirm
    :title="finalTitle"
    :confirm-text="finalConfirmText"
    :cancel-text="finalCancelText"
    @confirm="$emit('confirm')"
    @cancel="$emit('cancel')"
  >
    <slot></slot>
  </APopconfirm>
</template>
<script lang="ts" setup>
import { useI18n } from "vue-i18n";

const props = withDefaults(
  defineProps<{
    title?: string;
    confirmText?: string;
    cancelText?: string;
  }>(),
  {
    // title: "Confirm",
    // confirmText: "Yes",
    // cancelText: "No",
  }
);

const { t } = useI18n();
const finalTitle = computed(() => props.title || t("confirmOperation"));
const finalConfirmText = computed(() => props.confirmText || t("resolve"));
const finalCancelText = computed(() => props.cancelText || t("cancel"));

defineEmits<{
  (e: "confirm"): void;
  (e: "cancel"): void;
}>();
</script>
