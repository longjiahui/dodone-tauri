<template>
  <Dropdown :trigger :placement>
    <slot></slot>
    <template #body>
      <div
        class="bg-bg inline-flex flex-col gap-1 overflow-hidden rounded text-sm shadow leading-none"
      >
        <div v-if="title" class="text-light px-3 py-2.5 bg-light">
          {{ title }}
        </div>
        <div
          type="text"
          v-for="(m, i) in finalMenus"
          :key="i"
          @click="
            () => {
              m.click?.(m);
              click?.(m);
            }
          "
          :class="[
            'min-w-[40px]',
            m.danger ? 'text-danger' : '',
            m.divider
              ? 'bg-light-3 mx-auto my-2 h-[1px] w-[calc(100%_-_16px)]'
              : 'hover:bg-light-1 flex cursor-pointer items-center gap-1 px-3 py-2 duration-300',
          ]"
        >
          <component :is="m.icon" v-if="m.icon"></component>
          <span>
            {{ m.name }}
          </span>
        </div>
      </div>
    </template>
  </Dropdown>
</template>
<script lang="ts">
export type Menu = {
  divider?: boolean;
  id?: string;
  name?: string;
  icon?: Component;
  show?: boolean;
  danger?: boolean;
  click?: (m: Menu) => void;
  selected?: boolean;
};
</script>
<script setup lang="ts">
import { Trigger, DropdownPlacement } from "@/types";

const props = defineProps<{
  title?: string;
  menus: Menu[];
  click?: Menu["click"];
  trigger?: Trigger;
  placement?: DropdownPlacement;
}>();
const finalMenus = computed(() => props.menus.filter((m) => m.show !== false));
</script>
