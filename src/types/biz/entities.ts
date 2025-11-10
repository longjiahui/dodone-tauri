//   type TaskAnchor,
//   type Task,
//   type TaskGroup,
//   NextTask,
//   Prisma,
//   TaskView,
//   TaskViewTask,
//   TaskTargetRecord,
//   TaskInDay,
//   Notification,

export type TaskAnchor = {
  sortOrder: number;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  taskId: string;
};

export namespace $Enums {
  export type TaskState = "DONE" | "UNDONE";
  export type TaskTargetType = "DEFAULT" | "INCREMENT";
  export type TaskInDayType = "TASK" | "CUSTOM";
  export type NextTaskMode = "SIMPLE" | "COMPLEX";
  export type TaskViewType = "ALTERNATIVE" | "AUTO";
  export type TaskViewDefineMode = "GUI" | "SCRIPT";
}

export type TaskState = $Enums.TaskState;
export type TaskTargetType = $Enums.TaskTargetType;
export type TaskInDayType = $Enums.TaskInDayType;
export type NextTaskMode = $Enums.NextTaskMode;
export type TaskViewType = $Enums.TaskViewType;
export type TaskViewDefineMode = $Enums.TaskViewDefineMode;

export type Task = {
  sortOrder: number;
  id: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  content: string;
  groupId: string;
  doneAt: Date | null;
  startAt: Date | null;
  endAt: Date | null;
  state: $Enums.TaskState | null;
  priority: number;
  factor: number;
  parentId: string | null;
  createIndex: number;
  createdByTaskId: string | null;
  target: number | null;
  targetType: $Enums.TaskTargetType | null;
};

export type TaskGroup = {
  name: string;
  sortOrder: number;
  id: string;
  color: string;
  icon: string | null;
  description: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  isHideAnchors: boolean;
};

export type NextTask = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  taskId: string;
  mode: $Enums.NextTaskMode | null;
  a: number;
  b: number;
  endDate: Date | null;
};

export type TaskView = {
  name: string;
  sortOrder: number;
  id: string;
  icon: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  type: $Enums.TaskViewType;
  defineMode: $Enums.TaskViewDefineMode;
  GUIJSONData: string | null;
  autoScript: string | null;
};

export type TaskViewTask = {
  sortOrder: number;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  taskId: string;
  taskViewId: string;
};

export type TaskTargetRecord = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  taskId: string;
  value: number;
  recordAt: Date;
};
export type TaskInDay = {
  id: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  content: string | null;
  taskId: string;
  type: $Enums.TaskInDayType;
  notificationId: string | null;
  date: Date;
  startTime: Date;
  endTime: Date;
};
export type Notification = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  content: string;
  title: string;
  notifyAt: Date;
};

// 一些复合类型
export type ProtocolReturnTask = Task & {
  nextTask?: NextTask | null;
  taskViewTasks: TaskViewTask[];
};

export type TaskViewGetType = TaskView & {
  tasks: TaskViewTask[];
};

export type TaskInDayGetType = TaskInDay;

export type BatchEditTasksResult = {
  created: ProtocolReturnTask[];
  updated: ProtocolReturnTask[];
};
