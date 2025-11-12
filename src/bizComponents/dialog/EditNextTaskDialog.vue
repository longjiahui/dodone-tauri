<template>
  <Dialog :dialog width="400px" :title="$t('setNextTask')">
    <template #autoPadding>
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between font-semibold">
          <div>
            {{ $t("setRepeatConfig") }}
          </div>
          <Button type="text" @click="abs.push(['', '', '', 0])">{{
            $t("addReference")
          }}</Button>
        </div>
        <div
          class="self-start"
          @click="
            openDialog(DatePickerDialog, {
              title: $t('setEndDate'),
              value: entity.endDate ? dayjs(entity.endDate) : undefined,
            }).finishPromise((d) => {
              entity.endDate = d?.toDate();
            })
          "
        >
          <Button v-if="!entity.endDate" type="text">
            {{ $t("setEndDate") }}
          </Button>
          <div
            v-else
            class="bg-light-2 hover:bg-light-3 flex cursor-pointer items-center gap-2 rounded px-2 text-sm duration-300"
          >
            <EditOutlined class="text-link"></EditOutlined>
            <div>{{ formatDate(entity.endDate) }}</div>
          </div>
        </div>

        <div class="flex w-[144px] gap-4">
          <Input v-model="entity.a" placeholder="a" type="number"></Input>
          <Input v-model="entity.b" placeholder="b" type="number"></Input>
        </div>
        <div v-for="(_, i) in abs" :key="i" class="flex w-[144px] gap-4">
          <Input v-model="abs[i][0]" placeholder="a" type="number"></Input>
          <Input v-model="abs[i][1]" placeholder="b" type="number"></Input>
          <Input v-model="abs[i][3]" placeholder="offset" type="number"></Input>
        </div>
      </div>
      <HitBlockRaid
        length="40"
        :abs="
          (
            [[entity.a, entity.b], ...abs] as [
              number,
              number,
              string?,
              number?,
            ][]
          ).map((d, i) => ({
            a: d[0],
            b: d[1],
            name: d[2] || i.toString(),
            offset: d[3] ?? 0,
          }))
        "
      ></HitBlockRaid>
    </template>
    <template #footer>
      <Button @click="dialog.close()">{{ $t("cancel") }}</Button>
      <Button
        type="primary"
        danger
        v-if="nextTask?.id && nextTask.taskId"
        @click="
          () => {
            taskStore.deleteNextTask(nextTask!.taskId);
            dialog.close();
          }
        "
        >{{ $t("clear") }}</Button
      >
      <Button
        type="primary"
        @click="
          dialog.finish({
            a: toNumber(entity.a) || 1,
            b: toNumber(entity.b) || 1,
            endDate: entity.endDate,
          })
        "
        >{{ $t("resolve") }}</Button
      >
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DialogType } from "@/components/dialog/dialog";
import { useTaskStore } from "@/store/task";
import { toNumber } from "@/utils/number";
import { formatDate } from "@/utils/time";
import { NextTask } from "@/types";
import { dayjs } from "@/utils/time";
import { openDialog } from "@/components/dialog/helper";
import DatePickerDialog from "@/components/dialog/commonDialog/DatePickerDialog.vue";

const props = defineProps<{
  dialog: DialogType<any, Partial<NextTask>>;
  // createIndex: number
  nextTask?: NextTask | null;
}>();

const entity = ref<Partial<NextTask>>(props.nextTask || {});

// const daysAmount = 39
// const hits = computed(() => {
// 	const hits: number[] = []
// 	new Array(daysAmount).fill(0).map((_, i) => {
// 		const { a, b } = {
// 			a: +(entity.value.a || 0),
// 			b: +(entity.value.b || 0),
// 		}
// 		const lastHit = hits.slice(-1)?.[0] + 1 || 0
// 		if (
// 			i + 1 ===
// 			lastHit + a + (b ? hits.length % b : 0)
// 		) {
// 			hits.push(i)
// 		}
// 	})
// 	return hits.reduce(
// 		(t, d) => {
// 			t[d] = true
// 			return t
// 		},
// 		{} as Record<number, boolean>,
// 	)
// })

const abs = ref<[string, string, string?, number?][]>([]);
// const isComplex = computed(
// 	() => entity.value.mode === "complex",
// )

const taskStore = useTaskStore();
</script>
