<template>
  <Dialog :dialog :title :width>
    <template #autoPadding>
      <div v-if="typeof content === 'string'" class="text-light">
        {{ content }}
      </div>
      <component v-else-if="content" :is="content"></component>
      <!-- <Textarea v-model="inputValue"></Textarea> -->
      <Input
        :prefix
        :suffix
        :disabled
        :type
        @keypress.enter="dialog.finish(inputValue)"
        v-focus
        :placeholder
        class="text-md size-full resize-none bg-transparent outline-none"
        v-model="inputValue"
      ></Input>
      <div class="h gap-2 text-xs" v-if="quickOptions.length">
        <div
          v-for="option in quickOptions"
          @click="inputValue = option.value"
          :class="[
            'cursor-pointer rounded border px-1 py-0.5 duration-300 hover:opacity-75',
            option.danger ? 'bg-danger border-0 text-white' : '',
            option.primary ? 'bg-primary border-0 text-white' : '',
          ]"
        >
          {{ option.label }}
        </div>
      </div>
    </template>
    <template #footer>
      <Button @click="dialog.close()">{{ $t("cancel") }}</Button>
      <Button @click="dialog.finish(inputValue)" type="primary">{{
        $t("resolve")
      }}</Button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { DialogType } from "../dialog"

const props = withDefaults(
  defineProps<{
    dialog: DialogType<any, string>
    title?: string | null
    content?: string | Component
    prefix?: Component
    suffix?: Component
    value?: string | null
    placeholder?: string
    disabled?: boolean
    width?: string
    type?: "password" | "text" | "email" | "number"
    quickOptions?: {
      label: string
      value: string
      danger?: boolean
      primary?: boolean
    }[]
  }>(),
  {
    width: "320px",
    quickOptions: () => [],
  },
)

const inputValue = ref(props.value || "")
</script>
