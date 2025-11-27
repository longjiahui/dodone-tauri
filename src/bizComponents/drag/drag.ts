import { Emitter } from "@/utils/emitter";

/*
  move-tasks 指当前移动的是 ReadonlyTaskWithChildren[]
  move-tasks-xxx 指当前移动的是 groupId 为xxx的 ReadonlyTaskWithChildren[]
  order-xxx 
    order-taskview
    order-task
    order-taskgroup
 */

export type DragDataType =
  | `move-tasks`
  | `move-tasks-${string}`
  | `order-${string}`;
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
