<template>
  <DefaultDropdown trigger="click">
    <div
      class="h border-light-4 bg-bg size-[32px] cursor-pointer items-center justify-center rounded border"
    >
      <Icon v-if="finalIcon" :icon="finalIcon"></Icon>
      <!-- <div
        v-else
        class="bg-light-2 border-light-4 size-[16px] rounded border"
      ></div> -->
      <div v-else class="text-sm font-semibold"></div>
    </div>
    <template #body>
      <div class="v gap-2 py-4">
        <div class="px-4" @click.stop>
          <Input
            v-focus
            :prefix="Icons.SearchOutlined"
            v-model="searchText"
          ></Input>
        </div>
        <!-- <div @click.stop>
          <Pagination
            :total="emojis.length"
            v-model="page"
            :page-size
          ></Pagination>
        </div> -->
        <Scrollbar
          view-class="h max-h-[320px] max-w-[320px] flex-wrap justify-evenly p-4"
        >
          <div
            v-for="d in finalAntdIcons"
            @click="icon = d"
            class="hover:text-primary text-light hover:bg-light-2 h size-[50px] cursor-pointer items-center justify-center rounded text-3xl duration-300"
          >
            <!-- <template v-if="hasEmoji(d)"> -->
            <!-- {{ d }} -->
            <!-- </template> -->
            <AntdIcon :icon="d as any"></AntdIcon>
          </div>
        </Scrollbar>
        <div class="px-4">
          <Button @click="icon = null">{{ $t("clear") }}</Button>
        </div>
      </div>
    </template>
  </DefaultDropdown>
</template>

<script setup lang="ts">
import * as Icons from "@ant-design/icons-vue";
import { getAllEmojis, hasEmoji } from "unicode-emoji-utils";

const page = ref(1);
const pageSize = 40;
// const emojis = computed(() => finalAntdIcons.value.concat(...getAllEmojis()))
const emojis = computed(() => getAllEmojis());
const finalEmojis = computed(() => {
  const start = (page.value - 1) * pageSize;
  return emojis.value.slice(start, start + pageSize);
});
const icon = defineModel<string | null>("model-value", { default: null });

const searchText = ref("");
const finalIcon = computed<any>(() => icon.value);
const finalAntdIcons = computed(
  () =>
    Object.keys(Icons).filter(
      (key) =>
        (key.endsWith("Filled") || key.endsWith("Outlined")) &&
        key.toLowerCase().includes(searchText.value.toLowerCase())
    ) as any[]
);
</script>
