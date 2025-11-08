<template>
  <ATabs v-model:active-key="modelValue">
    <ATabPane
      v-for="(t, i) in tabs"
      :key="t.id"
      :tab="$slots.default ? undefined : t.title"
    >
      <template v-if="$slots.default" #tab>
        <slot v-bind="{ tab: t, index: i }"></slot>
      </template>
    </ATabPane>
  </ATabs>
</template>
<script lang="ts">
type TabBase = {
  id: string
  title: string
}
</script>
<script setup lang="ts" generic="Tab extends TabBase">
defineProps<{
  tabs: Tab[]
}>()
const modelValue = defineModel<string>("modelValue")
</script>

<style lang="scss">
.ant-tabs-nav {
  height: 32px;
}

.ant-tabs-top > .ant-tabs-nav,
.ant-tabs-bottom > .ant-tabs-nav,
.ant-tabs-top > div > .ant-tabs-nav,
.ant-tabs-bottom > div > .ant-tabs-nav {
  margin: 0;
}
</style>
