import {
  DateTimeFieldTypeOptionId,
  FieldType,
  ReadOnlyTaskWithChildren,
  TaskViewGUIConditionOperator,
} from "@/types";
import { TaskState } from "@/types";
import { defineStore } from "pinia";
import { useTaskGroupStore } from "./taskGroup";
import { Dayjs, dayjs } from "@/utils/time";

export const useTaskViewGUIMetaStore = defineStore("taskViewGUIMeta", () => {
  const operatorOptions = ref<
    {
      id: string;
      name: string;
      func: (a: any, b: any) => boolean;
    }[]
  >(
    (
      [
        [
          "==",
          "等于",
          (a: any, b: any) => {
            if (a instanceof dayjs && b) {
              return (a as Dayjs).isSame(b);
            } else {
              return a == b;
            }
          },
        ],
        [
          "<",
          "小于",
          (a: any, b: any) => {
            if (a instanceof dayjs) {
              return (a as Dayjs).isBefore(b);
            } else if (a && b) {
              return a < b;
            } else {
              return false;
            }
          },
        ],
        [
          "<=",
          "小于等于",
          (a: any, b: any) => {
            if (a instanceof dayjs) {
              return (a as Dayjs).isBefore(b) && (a as Dayjs).isSame(b);
            } else if (a && b) {
              return a <= b;
            } else {
              return false;
            }
          },
        ],
        [
          ">",
          "大于",
          (a: any, b: any) => {
            if (a instanceof dayjs) {
              return (a as Dayjs).isAfter(b);
            } else if (a && b) {
              return a > b;
            } else {
              return false;
            }
          },
        ],
        [
          ">=",
          "大于等于",
          (a: any, b: any) => {
            if (a instanceof dayjs) {
              return (a as Dayjs).isAfter(b) && (a as Dayjs).isSame(b);
            } else if (a && b) {
              return a >= b;
            } else {
              return false;
            }
          },
        ],
        [
          "!=",
          "不等于",
          (a: any, b: any) => {
            if (a instanceof dayjs) {
              return !(a as Dayjs).isSame(b);
            } else {
              return a != b;
            }
          },
        ],
      ] satisfies [
        TaskViewGUIConditionOperator,
        string,
        (a: any, b: any) => boolean,
      ][]
    ).map((d) => {
      return {
        id: d[0],
        name: d[1],
        func: d[2],
      };
    })
  );
  const taskGroupStore = useTaskGroupStore();
  const fields = computed(() =>
    (
      [
        ["groupId", "groupId", "分组", "select", taskGroupStore.taskGroups],
        [
          "startAt",
          (d) => (d.startAt ? new Date(d.startAt) : d.startAt),
          "开始时间",
          "datetime-select",
        ],
        [
          "endAt",
          (d) => (d.endAt ? new Date(d.endAt) : d.endAt),
          "结束时间",
          "datetime-select",
        ],
        ["priority", "priority", "优先级", "number-input"],
        ["content", "content", "内容", "text-input"],
        [
          "doneAt",
          (d) => (d.doneAt ? new Date(d.doneAt) : d.doneAt),
          "完成时间",
          "datetime-select",
        ],
        ["factor", "factor", "工作量", "number-input"],
        ["parentId", "parentId", "父任务", "task-select"],
        [
          "childrenAmount",
          (d) => d.children.length,
          "子任务数量",
          "number-input",
        ],
        [
          "state",
          "state",
          "完成状态",
          "select",
          [
            { id: "DONE", name: "完成" },
            { id: "UNDONE", name: "未完成" },
          ] satisfies { id: TaskState; name: string }[],
        ],
        // ["nextTask", "nextTask", "重复任务", "switch"],
        // ["id", "id", "ID", ],
      ] satisfies [
        string,
        keyof ReadOnlyTaskWithChildren | ((d: ReadOnlyTaskWithChildren) => any),
        string,
        FieldType,
        any?,
      ][] as [
        string,
        keyof ReadOnlyTaskWithChildren | ((d: ReadOnlyTaskWithChildren) => any),
        string,
        FieldType,
        any?,
      ][]
    ).map((d) => ({
      id: d[0],
      value:
        typeof d[1] === "string"
          ? (t: ReadOnlyTaskWithChildren) =>
              t[d[1] as keyof ReadOnlyTaskWithChildren]
          : d[1],
      name: d[2],
      fieldType: d[3],
      params: d[4],
    }))
  );
  type Field = (typeof fields.value)[number];

  const fieldsMap = computed(() => {
    const map: Partial<Record<string, Field>> = {};
    fields.value.forEach((f) => {
      map[f.id] = f;
    });
    return map;
  });

  const datetimeFieldTypeOptions = ref<
    {
      id: DateTimeFieldTypeOptionId;
      name: string;
      value: (...rest: any[]) => Dayjs | null;
    }[]
  >([
    {
      id: "null",
      name: "空",
      value: () => null,
    },
    {
      id: "today0",
      name: "相对今天0点",
      value: (offset: number) => dayjs().add(offset, "day").startOf("day"),
    },
    {
      id: "today24",
      name: "相对今天24点",
      value: (offset: number) => dayjs().add(offset, "day").endOf("day"),
    },
    {
      id: "customDateTime",
      name: "自定义日期时间",
      value: (d: Dayjs) => d,
    },
  ]);

  return {
    fields: readonly(fields),
    fieldsMap: readonly(fieldsMap),
    operatorOptions: readonly(operatorOptions),
    datetimeFieldTypeOptions: readonly(datetimeFieldTypeOptions),
  };
});
