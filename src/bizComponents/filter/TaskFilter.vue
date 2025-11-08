<template>
  <DefaultDropdownMenu
    :menus="
      conditions
        .filter((k) => definedConditions[k])
        .map((k) => ({
          name: definedConditions[k]?.name,
          click: () => {
            const condition = definedConditions[k]
            return condition.getValue().then((v) => {
              if (v !== undefined) {
                modelValue[k] = v as any
              }
            })
          },
        }))
    "
  >
    <ClickableIcon :icon="FilterOutlined"></ClickableIcon>
  </DefaultDropdownMenu>
</template>

<script setup lang="ts" generic="K extends DefinedConditionKey">
import { FilterOutlined } from "@ant-design/icons-vue"
import {
  DefinedConditionKey,
  useDefinedConditions,
  GetTaskFilterModelValueType,
} from "./conditions"

defineProps<{
  conditions: K[]
}>()

const definedConditions = useDefinedConditions()
const modelValue = defineModel<GetTaskFilterModelValueType<K>>("modelValue", {
  default: {},
})
</script>
