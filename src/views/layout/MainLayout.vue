<template>
  <div class="h size-full items-stretch">
    <!-- <div class="v bg-light-2 gap-2 p-2">
      <Tooltip :content="p.name" v-for="p in pages" placement="right">
        <div
          :class="[
            'v bg-light-4 size-[32px] cursor-pointer items-center justify-center gap-1 rounded text-lg duration-300',
            p.route === $route.name
              ? 'bg-primary text-white'
              : 'hover:bg-light-5',
          ]"
          v-wave
          @click="$router.push({ name: p.route })"
        >
          <component :is="p.icon" v-if="p.icon"></component>
        </div>
      </Tooltip>
    </div> -->
    <div class="stretch size-full overflow-hidden">
      <router-view></router-view>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Routes } from "@/const"
import { FileOutlined } from "@ant-design/icons-vue"
import type { Component } from "vue"

interface Page {
  route: Routes
  icon: Component
  name?: string
}

const pages = ref<Page[]>([
  {
    route: Routes.taskPage,
    icon: FileOutlined,
    name: "Task",
  },
])
</script>
