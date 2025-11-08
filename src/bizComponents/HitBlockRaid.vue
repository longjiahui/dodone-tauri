<template>
  <div class="flex flex-wrap items-stretch gap-2">
    <div
      v-for="(ns, i) in hitList"
      :key="i"
      :class="[
        'flex size-[20px] items-stretch overflow-hidden rounded',
        ns.length > 0 ? 'bg-primary-lighter' : 'bg-light-4',
      ]"
    >
      <div
        v-for="(n, i) in ns"
        :key="i"
        :class="['stretch']"
        :style="{
          background: `hsl(${getHSLHash(n)}deg, 70%, 50%)`,
        }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getHSLHash } from "@/utils/random"

const props = defineProps<{
  length: number | string
  abs: {
    a: number
    b: number
    offset?: number
    name?: string
  }[]
}>()

const finalLength = computed(() => (isNaN(+props.length) ? 0 : +props.length))

const hitList = computed(() => {
  const infos = props.abs.map((ab) => {
    let { a, b, name, offset } = ab
    a = isNaN(+a) ? 0 : +a
    b = isNaN(+b) ? 0 : +b
    offset = isNaN(+(offset || 0)) ? 0 : +offset!
    const hits: number[] = []
    new Array(finalLength.value).fill(0).map((_, i) => {
      const lastHit = hits.slice(-1)?.[0] + 1 || 0
      const finalOffset = hits.length > 0 ? 0 : offset
      if (i + 1 === finalOffset + lastHit + a + (b ? hits.length % b : 0)) {
        hits.push(i)
      }
    })
    return {
      name: name || Math.random() + "",
      hits: hits.reduce(
        (t, d) => {
          t[d] = true
          return t
        },
        {} as Record<number, boolean>,
      ),
    }
  })
  return new Array(finalLength.value).fill(0).map((_, i) => {
    return infos.filter((info) => info.hits[i]).map((info) => info.name!)
  })
})
</script>
