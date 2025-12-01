import { GetAPIParams, webProtocols } from "@/protocol";
import { ReadOnlyTaskWithChildren } from "@/types";
import { backend } from "@/utils/backend";
import { Emitter } from "@/utils/emitter";

// export const taskViewEvent = new Emitter<{
//   createTaskViewTask: (d: TaskViewTask) => void
//   deleteTaskViewTask: (d: TaskViewTask) => void
// }>()

// 需要taskEvent来在前端处理 children/factor等前端自己build的信息
export const localTaskEvent = new Emitter<{
  deleteTasks: (task: ReadOnlyTaskWithChildren[]) => void;
  updateTask: (task: ReadOnlyTaskWithChildren) => void;
  createTask: (task: ReadOnlyTaskWithChildren) => void;
}>();
// export const taskGroupEvent = new Emitter<{
//   createTaskGroup: (g: TaskGroup) => void
//   deleteTaskGroup: (g: TaskGroup) => void
// }>()

// export const defaultEvent = new Emitter<{
//   focusTask: (task: ReadOnlyTaskWithChildren) => void
// }>()

// 事件转发
export const backendEvent = new Emitter<{
  [k in keyof typeof webProtocols]: (
    ...rest: GetAPIParams<(typeof webProtocols)[k]>
  ) => void;
}>();
Object.keys(backend).forEach((k) => {
  if (k.startsWith("on_")) {
    backend[k as keyof typeof backend](((...rest: any[]) => {
      console.debug(
        `backend event received[${k.replace(/^on_/, "") as keyof typeof webProtocols}]: `,
        ...rest
      );
      return (backendEvent as any).emit(
        k.replace(/^on_/, "") as keyof typeof webProtocols,
        ...rest
      );
    }) as any);
  }
});
// export const backendEvent = new Emitter<{
//   updateTaskInDays: (ds: TaskInDay[]) => void;
//   deleteTaskInDay: (ds: TaskInDay) => void;
//   createTaskInDay: (ds: TaskInDay) => void;
// }>();
// backend.on_updateTaskInDays((...args) =>
//   backendEvent.emit("updateTaskInDays", ...args)
// );
// backend.on_deleteTaskInDay((...args) =>
//   backendEvent.emit("deleteTaskInDay", ...args)
// );
// backend.on_createTaskInDay((...args) =>
//   backendEvent.emit("createTaskInDay", ...args)
// );

// export const backendEvent = new Emitter<{
//   batchUpsertTaskTargetRecords: (d: {
//     created: TaskTargetRecord[];
//     updated: TaskTargetRecord[];
//   }) => void;
//   deleteTaskTargetRecords: (records: TaskTargetRecord[]) => void;
// }>();
// backend.on_batchUpsertTaskTargetRecords((...rest) =>
//   backendEvent.emit("batchUpsertTaskTargetRecords", ...rest)
// );
// backend.on_deleteTaskTargetRecords((...rest) =>
//   backendEvent.emit("deleteTaskTargetRecords", ...rest)
// );
