import { dialogs } from "@/components/dialog";
import { Option } from "@/components/Select.vue";
import { useTaskGroupStore } from "@/store/taskGroup";
import { useTaskViewStore } from "@/store/taskView";
import { ReadOnlyTaskWithChildren, Slice } from "@/types";
import { backend } from "@/utils/backend";
import { dayjs } from "@/utils/time";
import { useI18n } from "vue-i18n";

export type Condition<Value extends any[]> = {
  validate: (
    t: ReadOnlyTaskWithChildren,
    ...rest: Value
  ) => Promise<boolean> | boolean;
  valueDesc: (...rest: Value) => string | undefined;
  name: string;
  // type: "select" | "input" | "boolean" | "range-number" | "range-date" | 'direct'
  // nullable: boolean
  // numberRange?: { min: number; max: number }
  //   dateRange?: {min: Date;max: Date}
  // options?: Option[]
  value?: Value;
  getValue: () => Promise<Value | undefined>;
};
export function createCondition<V extends any[]>(con: Condition<V>) {
  return con;
}

export type DefinedConditions = ReturnType<
  typeof useDefinedConditions
>["value"];
export type DefinedConditionKey = keyof DefinedConditions;
export type GetTaskFilterModelValueType<T extends DefinedConditionKey> =
  Partial<{
    [k in T]: Slice<Parameters<DefinedConditions[k]["validate"]>, 1>;
  }>;

export function useValidateTaskByFilterEntity<
  FilterEntity extends GetTaskFilterModelValueType<
    Partial<DefinedConditionKey>
  >,
>() {
  const definedConditions = useDefinedConditions();
  return (task: ReadOnlyTaskWithChildren, filterEntity: FilterEntity) => {
    return Promise.all(
      Object.keys(filterEntity).map(async (k) => {
        const key = k as DefinedConditionKey;
        const condition = definedConditions.value[key];
        const val = filterEntity[key] as any[];
        return (condition.validate as any)(task, ...val);
      })
    ).then((ds) => ds.every((d) => !!d));
  };
}

export function useDefinedConditions() {
  const { t } = useI18n();
  const taskGroupStore = useTaskGroupStore();
  const taskViewStore = useTaskViewStore();

  return computed(() => {
    const taskGroupOptions = taskGroupStore.taskGroups.map(
      (g) =>
        ({
          id: g.id,
          name: g.name,
        }) satisfies Option
    );
    const taskViewOptions = taskViewStore.taskViews.map(
      (v) =>
        ({
          id: v.id,
          name: v.name,
        }) satisfies Option
    );
    return {
      group: createCondition<[string]>({
        name: t("taskGroup"),
        // type: "select",
        // options: taskGroupOptions.value,
        // nullable: false,
        validate: (t, groupId) => t.groupId === groupId,
        valueDesc: (val) => {
          console.debug(val, taskGroupStore.taskGroupsDict[val]?.name);
          return taskGroupStore.taskGroupsDict[val]?.name;
        },
        getValue() {
          return dialogs
            .SelectDialog({ options: taskGroupOptions })
            .finishPromise((d) => (d ? [d.id] : undefined));
        },
      }),
      state: createCondition<[boolean]>({
        name: t("state"),
        // type: "boolean",
        // nullable: false,
        validate: (t, val) => t.state === (val ? "DONE" : "UNDONE"),
        valueDesc: (val) => (val ? t("done") : t("undone")),
        getValue() {
          return dialogs
            .SelectDialog({
              options: [
                {
                  id: true,
                  name: t("done"),
                },
                {
                  id: false,
                  name: t("undone"),
                },
              ],
            })
            .finishPromise((d) => (d ? [d.id] : undefined));
        },
      }),
      // priority: createCondition<[[number, number]]>({
      //   name: t("priority"),
      //   // type: "range-number",
      //   // nullable: false,
      //   // numberRange: { min: -100, max: 100 },
      //   validate: (t, val) =>
      //     !!t.priority && t.priority >= val[0] && t.priority <= val[1],
      //   valueDesc: (val) => `${val[0]} ~ ${val[1]}`,
      //   getValue() {
      //     // return dialogs.range
      //     return Promise.resolve(undefined)
      //   },
      // }),
      startDate: createCondition<[[Date, Date]]>({
        name: t("startDate"),
        // type: "range-date",
        // nullable: true,
        validate: (t, val) => {
          return dayjs(t.startAt).isBetween(val[0], val[1]);
        },
        valueDesc: (val) => {
          return `${dayjs(val[0]).format("YYYY-MM-DD")} ~ ${dayjs(val[1]).format("YYYY-MM-DD")}`;
        },
        getValue() {
          return dialogs
            .DateRangePickerDialog()
            .finishPromise((d) =>
              d?.[0] && d?.[1] ? [[d[0]!.toDate(), d[1]!.toDate()]] : undefined
            );
        },
      }),
      endDate: createCondition<[[Date, Date]]>({
        name: t("endDate"),
        // type: "range-date",
        // nullable: true,
        validate: (t, val) => {
          return dayjs(t.endAt).isBetween(val[0], val[1]);
        },
        valueDesc: (val) => {
          return `${dayjs(val[0]).format("YYYY-MM-DD")} ~ ${dayjs(val[1]).format("YYYY-MM-DD")}`;
        },
        getValue() {
          return dialogs
            .DateRangePickerDialog()
            .finishPromise((d) =>
              d?.[0] && d?.[1] ? [[d[0]!.toDate(), d[1]!.toDate()]] : undefined
            );
        },
      }),
      notSetCalendar: createCondition<[]>({
        name: t("notSetCalendar"),
        // type: 'direct',
        getValue() {
          return Promise.resolve([]);
        },
        validate: (t) => t.startAt === null && t.endAt === null,
        valueDesc() {
          return undefined;
        },
      }),
      notScheduled: createCondition<[]>({
        name: t("notSetSchedule"),
        // type: 'direct',
        getValue() {
          return Promise.resolve([]);
        },
        validate: (t) =>
          backend
            .getTaskInDaysByTaskId(t.id)
            .then((days) => !dayjs || days.length === 0),
        valueDesc() {
          return undefined;
        },
      }),
      hasChildren: createCondition<[boolean]>({
        name: t("isHasChildren"),
        // type: "boolean",
        // nullable: false,
        validate: (t, val: boolean) =>
          val ? (t.children?.length ?? 0) > 0 : (t.children?.length ?? 0) === 0,
        valueDesc: (val) => (val ? t("hasChildren") : t("noChildren")),
        getValue() {
          return dialogs
            .SelectDialog({
              options: [
                {
                  id: true,
                  name: t("hasChildren"),
                },
                {
                  id: false,
                  name: t("noChildren"),
                },
              ],
            })
            .finishPromise((d) => (d ? [d.id] : undefined));
        },
      }),
      view: createCondition<[string]>({
        name: t("taskView"),
        // type: "select",
        // nullable: false,
        // options: taskViewOptions.value,
        validate: (t, viewId) => {
          return taskViewStore.validateIsTaskInView(t, viewId);
        },
        valueDesc: (val) => {
          return taskViewStore.viewsDict[val]?.name;
        },
        getValue() {
          return dialogs
            .SelectDialog({ options: taskViewOptions })
            .finishPromise((d) => (d ? [d.id] : undefined));
        },
      }),
      contentAndDescription: createCondition<[string]>({
        name: t("content"),
        // type: "input",
        // nullable: false,
        validate: (t, val: string) => {
          return !!t.content.includes(val) || !!t.description?.includes(val);
        },
        valueDesc: (val) => val,
        getValue() {
          return dialogs
            .InputDialog({
              title: t("inputContentKeywordDescription"),
            })
            .finishPromise((d) => (d ? [d] : undefined));
        },
      }),
    };
  });
}
