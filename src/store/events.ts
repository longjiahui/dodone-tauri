import { ReadOnlyTaskWithChildren } from "@/types"
import { Emitter } from "@/utils/emitter"

// export const taskViewEvent = new Emitter<{
//   createTaskViewTask: (d: TaskViewTask) => void
//   deleteTaskViewTask: (d: TaskViewTask) => void
// }>()

// 需要taskEvent来在前端处理 children/factor等前端自己build的信息
export const taskEvent = new Emitter<{
  deleteTasks: (task: ReadOnlyTaskWithChildren[]) => void
  updateTask: (task: ReadOnlyTaskWithChildren) => void
  createTask: (task: ReadOnlyTaskWithChildren) => void
}>()
// export const taskGroupEvent = new Emitter<{
//   createTaskGroup: (g: TaskGroup) => void
//   deleteTaskGroup: (g: TaskGroup) => void
// }>()

// export const defaultEvent = new Emitter<{
//   focusTask: (task: ReadOnlyTaskWithChildren) => void
// }>()
