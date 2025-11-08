import { Emitter } from "@/utils/emitter"
export type DragDataType =
  | `move-tasks`
  | `move-tasks-${string}`
  | `order-${string}`
export interface DragData<T = any> {
  type: DragDataType
  datas: T[]
}

export const dragEventEmitter = new Emitter<{
  dragstart: (e: DragEvent, channels: string[]) => any
  dragend: (e: DragEvent) => any
}>()
