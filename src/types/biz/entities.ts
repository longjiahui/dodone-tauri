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
export type DateType = string;
export type NumberType = string;

export type TaskAnchor = {
  sortOrder: number;
  id: string;
  createdAt: DateType;
  updatedAt: DateType;
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
  createdAt: DateType;
  updatedAt: DateType;
  content: string;
  groupId: string;
  doneAt: DateType | null;
  startAt: DateType | null;
  endAt: DateType | null;
  state: $Enums.TaskState | null;
  priority: number;
  factor: number;
  parentId: string | null;
  createIndex: number;
  createdByTaskId: string | null;
  target: NumberType | null;
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
  createdAt: DateType;
  updatedAt: DateType;
  isHideAnchors: boolean;
};

export type NextTask = {
  id: string;
  createdAt: DateType;
  updatedAt: DateType;
  taskId: string;
  mode: $Enums.NextTaskMode | null;
  a: number;
  b: number;
  endDate: DateType | null;
};

export type TaskView = {
  name: string;
  sortOrder: number;
  id: string;
  icon: string | null;
  description: string | null;
  createdAt: DateType;
  updatedAt: DateType;
  type: $Enums.TaskViewType;
  defineMode: $Enums.TaskViewDefineMode;
  guijsonData: string | null;
  autoScript: string | null;
};

export type TaskViewTask = {
  sortOrder: number;
  id: string;
  createdAt: DateType;
  updatedAt: DateType;
  taskId: string;
  taskViewId: string;
};

export type TaskTargetRecord = {
  id: string;
  createdAt: DateType;
  updatedAt: DateType;
  taskId: string;
  value: NumberType;
  recordAt: DateType;
};
export type TaskInDay = {
  id: string;
  color: string;
  createdAt: DateType;
  updatedAt: DateType;
  content: string | null;
  taskId: string;
  type: $Enums.TaskInDayType;
  notificationId: string | null;
  date: DateType;
  startTime: DateType;
  endTime: DateType;
};
export type Notification = {
  id: string;
  createdAt: DateType;
  updatedAt: DateType;
  content: string;
  title: string;
  notifyAt: DateType;
};

// 一些复合类型
export type ProtocolReturnTask = Task & {
  nextTask?: NextTask | null;
  taskViewTasks: TaskViewTask[];
};

export type TaskViewGetType = TaskView & {
  tasks: TaskViewTask[];
};

export type TaskInDayGetType = TaskInDay & {
  notification?: Notification | null;
};

export type BatchEditTasksResult = {
  created: ProtocolReturnTask[];
  updated: ProtocolReturnTask[];
};
