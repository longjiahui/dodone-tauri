<template>
  <span v-if="startAt || endAt">
    <Scope
      :d="{
        start: dayjs(startAt),
        end: dayjs(endAt).endOf('day'),
      }"
      v-slot="{ start, end }"
    >
      <template v-if="!startAt"
        >{{
          $t("toEndDate", {
            endDate: formatDate(end),
          })
        }}
      </template>
      <template v-else-if="!endAt"
        >{{
          $t("fromStartDate", {
            startDate: formatDate(start),
          })
        }}
      </template>
      <template v-else
        >{{ formatDate(start) }} ~
        <span class="text-default font-semibold">
          {{ formatDate(end) }}
        </span>
      </template>
      <span
        v-if="endAt && !hideCountdown"
        :class="[
          'ml-1 rounded px-1.5 text-sm tracking-tighter',
          end.diff(dayjs(), 'day') < 0
            ? 'bg-danger text-white'
            : 'bg-light-3 text-dark',
        ]"
        >{{ end.fromNow() }}</span
      >
    </Scope>
  </span>
</template>
<script setup lang="ts">
import { formatDate } from "@/utils/time"
import { dayjs } from "@/utils/time"

defineProps<{
  startAt?: Date | string | null
  endAt?: Date | string | null
  hideCountdown?: boolean
}>()
</script>
