import type { TaskTargetType, TaskViewType } from "@/types";
import { useI18n } from "vue-i18n";
import { GetAPIParams, protocols } from "@/protocol";

export enum Routes {
  taskPage = "taskPage",

  default = Routes.taskPage,
}

export enum StorageKey {
  locale = "locale",
}
export const defaultSortOrder = 0;
export const defaultTaskFactor = 1;
// export const maxTaskFactor = 999;
export const maxTaskRepeatTimes = 999;
export const defaultTaskPriority = 25;
export const highTaskPriority = 50;
export const lowTaskPriority = 0;
export const defaultTaskTargetType: TaskTargetType = "DEFAULT";
export const defaultTaskGroupIcon = "FolderOutlined";
export const defaultTaskViewIcon = (type: TaskViewType) =>
  type === "AUTO" ? "RobotOutlined" : "TagOutlined";
// export const defaultTaskGroupIcon = "FolderOutlined" satisfies Icon
// export const defaultTaskViewIcon = (type: TaskViewType) =>
//   (type === "AUTO" ? "RobotOutlined" : "TagOutlined") satisfies Icon

export const themeHSColorS = 91;
export const themeHSColorL = 59;
export const themeHSColorSString = `${themeHSColorS}%`;
export const themeHSColorLString = `${themeHSColorL}%`;
export function themeHSL(h: string | number, a = 1) {
  return `hsla(${h}, ${themeHSColorSString}, ${themeHSColorLString}, ${a})`;
}

export const taskScheduleHSColorS = themeHSColorS;
export const taskScheduleHSColorL = themeHSColorL;
export const taskScheduleHSColorA = 1;

export const taskScheduleHSColorSString = `${taskScheduleHSColorS}%`;
export const taskScheduleHSColorLString = `${taskScheduleHSColorL}%`;
export const taskScheduleHSColorAString = `${taskScheduleHSColorA}`;

export const defaultPrimaryHue = "221";

export const useWeekdayCH = () => {
  const { t } = useI18n();
  return computed(() => {
    return [
      t("mon"),
      t("tue"),
      t("wed"),
      t("thu"),
      t("fri"),
      t("sat"),
      t("sun"),
    ];
  });
};

export const drawerPaddingLevel = 4;
export const sidebarPaddingXLevel = 3;
export const sidebarPaddingX = `px-${sidebarPaddingXLevel}`;

type TaskViewCreatePreset = GetAPIParams<
  typeof protocols.createTaskView
>[0]["data"];
export const taskViewPresets = {
  today: {
    name: "今天",
    type: "AUTO",
    defineMode: "GUI",
    guijsonData: `{"groups":[{"relation":"or","conditions":[],"groups":[{"groups":[],"conditions":[{"fieldId":"startAt","value":{"type":"today0","offset":0},"operator":">="},{"fieldId":"startAt","value":{"type":"today24","offset":0},"operator":"<="}],"relation":"and"},{"groups":[],"conditions":[{"fieldId":"startAt","value":{"type":"today0","offset":0},"operator":"<="},{"fieldId":"endAt","value":{"type":"today0","offset":0},"operator":">="}],"relation":"and"}]}]}`,
  } satisfies TaskViewCreatePreset,
  tomorrow: {
    name: "明天",
    type: "AUTO",
    defineMode: "GUI",
    guijsonData: `{"groups":[{"relation":"or","conditions":[],"groups":[{"groups":[],"conditions":[{"fieldId":"startAt","value":{"type":"today24","offset":1},"operator":"<="},{"fieldId":"startAt","value":{"type":"today24","offset":0},"operator":">="}],"relation":"and"},{"groups":[],"conditions":[{"fieldId":"startAt","value":{"type":"today0","offset":1},"operator":"<="},{"fieldId":"endAt","value":{"type":"today0","offset":1},"operator":">="}],"relation":"and"}]}]}`,
  } satisfies TaskViewCreatePreset,
  dayAfterTomorrow: {
    name: "后天",
    type: "AUTO",
    defineMode: "GUI",
    guijsonData: `{"groups":[{"relation":"or","conditions":[],"groups":[{"groups":[],"conditions":[{"fieldId":"startAt","value":{"type":"today24","offset":1},"operator":">="},{"fieldId":"startAt","value":{"type":"today24","offset":2},"operator":"<="}],"relation":"and"},{"groups":[],"conditions":[{"fieldId":"startAt","value":{"type":"today0","offset":2},"operator":"<="},{"fieldId":"endAt","value":{"type":"today0","offset":2},"operator":">="}],"relation":"and"}]}]}`,
  } satisfies TaskViewCreatePreset,
  thisWeek: {
    name: "本周",
    type: "AUTO",
    defineMode: "SCRIPT",
    autoScript: `t => {
  if(t.startAt || t.endAt){
    const weekBetween = [dayjs().startOf('isoWeek'), dayjs().endOf('isoWeek')]
    if(!(t.startAt && t.endAt)){
      const d = dayjs(new Date(t.startAt) || new Date(t.endAt)).startOf('isoWeek')
      if(d.isSameOrAfter(weekBetween[0]) && d.isSameOrBefore(weekBetween[1])){
        return true
      }
    }else{
      // both startAt endAt
      const d = dayjs(t.endAt).startOf('isoWeek')
      return d.isSameOrAfter(weekBetween[0]) && d.isSameOrBefore(weekBetween[1])
    }
  }
  return false
}`,
  } satisfies TaskViewCreatePreset,
  thisMonth: {
    name: "本月",
    type: "AUTO",
    defineMode: "SCRIPT",
    autoScript: `t => {
  if(t.startAt || t.endAt){
    const monthBetween = [dayjs().startOf('month'), dayjs().endOf('month')]
    if(!(t.startAt && t.endAt)){
      const d = t.startAt || t.endAt
      if(dayjs(d).isBetween(...monthBetween)){
        return true
      }
    }else{
      // both startAt endAt
      return dayjs(t.endAt).isBetween(...monthBetween)
    }
  }
  return false
}`,
  } satisfies TaskViewCreatePreset,
};

export const motionDelay = (delay: number) => Math.min(delay * 40, 600);
export const motionTranslateX = 20;
