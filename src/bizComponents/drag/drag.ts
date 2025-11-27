import { ReadOnlyTaskViewWithExtra, ReadOnlyTaskWithChildren } from "@/types";
import { Emitter } from "@/utils/emitter";
import type { TaskGroupOrAnchor } from "@/views/default/TaskPage.vue";

/*
  move-tasks 指当前移动的是 ReadonlyTaskWithChildren[]
  move-tasks-xxx 指当前移动的是 groupId 为xxx的 ReadonlyTaskWithChildren[]
  order-xxx 
    order-taskview
    order-task
    order-taskgrouporanchor 数据是 TaskGroupOrAnchor[]
 */
export type DragDataType =
  | `move-tasks`
  | `move-tasks-${string}`
  | `order-${string}`;
export type GetDragDataType<T extends DragDataType> = T extends
  | "move-tasks"
  | "order-task"
  | `move-tasks-${infer _}`
  ? ReadOnlyTaskWithChildren[]
  : T extends `order-taskgrouporanchor`
    ? TaskGroupOrAnchor[]
    : T extends "order-taskview"
      ? ReadOnlyTaskViewWithExtra[]
      : never;

export interface DragData<T = any> {
  type: DragDataType;
  datas: T[];
}

export const dragEventEmitter = new Emitter<{
  dragstart: (e: DragEvent, channels: string[]) => any;
  dragend: (e: DragEvent) => any;
  // safari不支持related target，所以...
  dragenter: (e: DragEvent) => any;
  // dragleave: (e: DragEvent) => any;
}>();
