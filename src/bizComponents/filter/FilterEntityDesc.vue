<template>
  <div v-if="Object.keys(modelValue).length" class="text-sm">
    <div
      class="inline-h bg-primary items-center gap-2 rounded px-2 py-1 text-white"
    >
      <FilterOutlined></FilterOutlined>
      <Scope
        v-for="(v, k) in modelValue"
        :d="{
          condition: definedConditions[k as DefinedConditionKey],
        }"
        #default="{ condition }"
      >
        <Scope
          v-if="condition"
          :d="{
            description: (condition.valueDesc as any)(...(v as any)),
          }"
          #default="{ description }"
        >
          <div
            @click="
              () => {
                delete modelValue[k]
              }
            "
            class="h text-primary bg-bg cursor-pointer items-center gap-1 rounded px-1 duration-300 hover:opacity-85"
          >
            <div :class="[description ? 'font-semibold' : '']">
              {{ condition.name }}
            </div>
            <div v-if="description">
              {{ description }}
            </div>
          </div>
        </Scope>
      </Scope>
    </div>
  </div>
</template>
<script
  setup
  lang="ts"
  generic="FilterEntity extends Partial<Record<DefinedConditionKey, any[]>>"
>
import { DefinedConditionKey, useDefinedConditions } from "./conditions"

const definedConditions = useDefinedConditions()
const modelValue = defineModel<FilterEntity>("modelValue", { default: {} })
</script>
