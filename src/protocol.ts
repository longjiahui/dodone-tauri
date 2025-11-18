import {
  type TaskAnchor,
  type Task,
  type TaskGroup,
  NextTask,
  TaskView,
  TaskViewTask,
  TaskTargetRecord,
  TaskInDay,
  Notification,
  ProtocolReturnTask,
  TaskViewGetType,
  TaskInDayGetType,
  DateType,
} from "@/types";
export type { ProtocolReturnTask } from "@/types";
import { DoingWindowType, Database, ConstObject } from "@/types";

export type APIFunction<P extends any[], R> = (
  ...args: P
) => Promise<Awaited<R>>;
export type API<N extends string, P extends any[], R> = {
  name: N;
  api: APIFunction<P, R>;
};
export type GetAPIParams<A extends API<any, any, any>> = Parameters<A["api"]>;
export type GetAPIReturnType<A extends API<any, any, any>> = Awaited<
  ReturnType<A["api"]>
>;

function defineAPI<N extends string, Function extends APIFunction<any[], any>>(
  name: N,
  _apiFunction: Function
) {
  return { name, api: _apiFunction } satisfies API<
    N,
    Parameters<Function>,
    ReturnType<Function>
  > as API<N, Parameters<Function>, ReturnType<Function>>;
}

function defineAPIFunction<P extends any[], R>() {
  return undefined as unknown as APIFunction<P, R>;
}

function crud<
  D,
  Extra extends {
    required?: keyof D;
    GetType?: D;
    GetAllParams?: any;
    ExtraUpdateParams?: any;
  } = {},
>() {
  type GetType = "GetType" extends keyof Extra ? Extra["GetType"] : D;
  type GetAllParams = "GetAllParams" extends keyof Extra
    ? Extra["GetAllParams"] extends any[]
      ? Extra["GetAllParams"]
      : []
    : [];
  type ExtraUpdateParams = "ExtraUpdateParams" extends keyof Extra
    ? Extra["ExtraUpdateParams"] extends object
      ? Extra["ExtraUpdateParams"]
      : {}
    : {};
  return <N extends string>(name: N) => {
    const createName = `create${name}` as const;
    const updateName = `update${name}ById` as const;
    const deleteName = `delete${name}ById` as const;
    const getAllName = `get${name}s` as const;
    const getByIdName = `get${name}ById` as const;
    const createAPI = defineAPI(
      createName,
      defineAPIFunction<
        [
          {
            data: Extra["required"] extends keyof D
              ? Partial<D> & Required<Pick<D, Extra["required"]>>
              : Partial<D>;
          },
          // Pick<D, Exclude<keyof D, "id">>
        ],
        GetType
      >()
    );
    const updateAPI = defineAPI(
      updateName,
      defineAPIFunction<
        [
          {
            id: string;
            data?: Partial<D> & ExtraUpdateParams;
          },
        ],
        GetType | undefined
      >()
    );
    const deleteAPI = defineAPI(
      deleteName,
      defineAPIFunction<[{ id: string }], void>()
    );
    const getAllAPI = defineAPI(
      getAllName,
      defineAPIFunction<GetAllParams, GetType[]>()
    );
    const getByIdAPI = defineAPI(
      getByIdName,
      defineAPIFunction<[{ id: string }], GetType | undefined | null>()
    );

    return {
      [createName]: createAPI,
      [updateName]: updateAPI,
      [deleteName]: deleteAPI,
      [getAllName]: getAllAPI,
      [getByIdName]: getByIdAPI,
    } as {
      [k in typeof createName]: typeof createAPI;
    } & {
      [k in typeof updateName]: typeof updateAPI;
    } & {
      [k in typeof deleteName]: typeof deleteAPI;
    } & {
      [k in typeof getAllName]: typeof getAllAPI;
    } & {
      [k in typeof getByIdName]: typeof getByIdAPI;
    };
  };
}

type TaskRequiredKeys = "content" | "groupId";
export type NotificationRequiredKeys = "title" | "content" | "notifyAt";
export type EntityWithRequiredKey<
  Entity,
  RequiredKey extends keyof Entity,
> = Partial<Entity> & Required<Pick<Entity, RequiredKey>>;

export type BatchCreateTask = {
  task: Partial<
    Omit<
      Task,
      | "state"
      | "id"
      | "children"
      | "nextTask"
      | "createdAt"
      | "updatedAt"
      | "taskViewTasks"
    >
  > &
    Required<Pick<Task, TaskRequiredKeys>>;
  nextTask?: Omit<NextTask, "taskId" | "id" | "createdAt" | "updatedAt">;
  children?: BatchCreateTask[];
};

// export type Font = {
//   name: string
//   path: string
// }

export const protocols = {
  ...crud<
    TaskGroup,
    {
      required: "name" | "color";
    }
  >()("TaskGroup"),
  ...crud<
    Task,
    {
      required: TaskRequiredKeys;
      GetType: ProtocolReturnTask;
      // GetAllParams: [];
    }
  >()("Task"),
  ...crud<TaskAnchor, { required: "taskId" }>()("TaskAnchor"),
  ...crud<NextTask, { required: "taskId" }>()("NextTask"),
  ...crud<
    TaskView,
    {
      required: "name" | "type";
      GetType: TaskViewGetType;
    }
  >()("TaskView"),
  ...crud<
    TaskViewTask,
    {
      required: "taskId" | "taskViewId";
      GetAllParams: [{ search: { taskViewId: string } }];
    }
  >()("TaskViewTask"),
  ...crud<
    TaskTargetRecord,
    {
      required: "taskId" | "value";
      // taskId
      GetAllParams: [{ search: { taskId: string } }];
    }
  >()("TaskTargetRecord"),
  ...crud<
    TaskInDay,
    {
      required: "type" | "taskId" | "date" | "startTime" | "endTime" | "color";
      GetAllParams: [
        {
          search: {
            startDate?: DateType;
            endDate?: DateType;
            isTaskDone?: boolean;
            take?: number;
            taskId?: string;
          };
        },
      ];
      GetType: TaskInDayGetType;
      ExtraUpdateParams: {
        notification?: EntityWithRequiredKey<
          Notification,
          NotificationRequiredKeys
        > | null;
      };
    }
  >()("TaskInDay"),

  ...crud<
    Notification,
    {
      required: NotificationRequiredKeys;
    }
  >()("Notification"),

  // deleteTaskInDayNotificationByTaskInDayId: defineAPI(
  //   "deleteTaskInDayNotificationByTaskInDayId",
  //   defineAPIFunction<[{ id: string }], TaskInDayGetType>()
  // ),
  // createTaskInDayNotification: defineAPI(
  //   "createTaskInDayNotification",
  //   defineAPIFunction<
  //     [
  //       string,
  //       Partial<Notification> & Pick<Notification, NotificationRequiredKeys>,
  //     ],
  //     Notification
  //   >()
  // ),

  // finishTask: defineAPI(
  //   "finishTask",
  //   defineAPIFunction<[string], Task | undefined>(),
  // ),
  // changeTaskParent: defineAPI(
  //   "changeTaskParent",
  //   // params [taskId, newParentId]
  //   defineAPIFunction<[string, string], ProtocolReturnTask | undefined>(),
  // ),
  batchEditTasks: defineAPI(
    "batchEditTasks",
    defineAPIFunction<
      [
        {
          create?: BatchCreateTask[];
          update?: (Pick<Task, "id"> & Partial<Task>)[];
        },
      ],
      { created: ProtocolReturnTask[]; updated: ProtocolReturnTask[] }
    >()
  ),
  restADay: defineAPI(
    "restADay",
    defineAPIFunction<
      [{ date: DateType }],
      {
        tasks: ProtocolReturnTask[];
        taskInDays: TaskInDay[];
      }
    >()
  ),

  changeTaskViewOrders: defineAPI(
    "changeTaskViewOrders",
    defineAPIFunction<[{ datas: { id: string; sortOrder: number }[] }], void>()
  ),
  changeTaskGroupOrders: defineAPI(
    "changeTaskGroupOrders",
    defineAPIFunction<[{ datas: { id: string; sortOrder: number }[] }], void>()
  ),
  changeTaskAnchorOrders: defineAPI(
    "changeTaskAnchorOrders",
    defineAPIFunction<[{ datas: { id: string; sortOrder: number }[] }], void>()
  ),

  // non api kind of api
  setWindowSize: defineAPI(
    "setWindowSize",
    defineAPIFunction<
      [
        {
          width: number;
          height: number;
          // animate?: boolean;
        },
      ],
      void
    >()
  ),
  getWindowSize: defineAPI(
    "getWindowSize",
    defineAPIFunction<[], [number, number]>()
  ),

  // doing window
  // params [taskId?]
  openDoingWindow: defineAPI(
    "openDoingWindow",
    defineAPIFunction<[{ search: { taskId?: string } }?], void>()
  ),
  // popupDoingWindowMoreMenu: defineAPI(
  //   "popupDoingWindowMoreMenu",
  //   defineAPIFunction<[], void>()
  // ),
  closeDoingWindow: defineAPI(
    "closeDoingWindow",
    defineAPIFunction<[], void>()
  ),
  resizeDoingWindow: defineAPI(
    "resizeDoingWindow",
    defineAPIFunction<
      [
        {
          width: number;
          height: number;
        },
      ],
      void
    >()
  ),

  // uploadImageFiles
  uploadImages: defineAPI(
    "uploadImages",
    defineAPIFunction<[{ files: number[][] }], string[]>()
  ),
  openImage: defineAPI(
    "openImage",
    // image://xxx
    defineAPIFunction<[{ url: string }], void>()
  ),
  getConst: defineAPI(
    "getConst",
    defineAPIFunction<[{ key: keyof ConstObject }], any>()
  ),
  setConst: defineAPI(
    "setConst",
    defineAPIFunction<[{ key: keyof ConstObject; value: any }], void>()
  ),
  getImageProtocolName: defineAPI(
    "getImageProtocolName",
    defineAPIFunction<[], string>()
  ),
  // broadcastConstUpdate: defineAPI(
  //   "broadcastConstUpdate",
  //   defineAPIFunction<[ConstObject], void>(),
  // ),
  // getSystemFonts: defineAPI(
  //   "getSystemFonts",
  //   // return family-name strings[]
  //   defineAPIFunction<[], Font[]>(),
  // ),

  // databasefile path
  getCurrentDbName: defineAPI(
    "getCurrentDbName",
    defineAPIFunction<[], string>()
  ),
  getDatabases: defineAPI("getDatabases", defineAPIFunction<[], Database[]>()),
  switchDatabase: defineAPI(
    "switchDatabase",
    // name
    defineAPIFunction<[{ name: string }], void>()
  ),
  createDatabase: defineAPI(
    "createDatabase",
    // name
    defineAPIFunction<[{ name: string }], void>()
  ),
  deleteDatabase: defineAPI(
    "deleteDatabase",
    // name
    defineAPIFunction<[{ name: string }], void>()
  ),

  // broadcastUpdateTaskInDay: defineAPI(
  //   "broadcastUpdateTaskInDay",
  //   // [taskInDayId]
  //   defineAPIFunction<[string], void>(),
  // ),
};

// main to ipcrenderer [back to front]
// function defineWebAPI<Name extends String>(name: Name) {
//   return <Params extends any[]>() => {
//     return {
//       name,
//       paramsType: null as unknown as Params,
//     }
//   }
// }

// export type WebAPI<Name extends String, Params extends any[]> = ReturnType<
//   ReturnType<typeof defineWebAPI<Name>>
// >

export const webProtocols = {
  setDoingWindowParams: defineAPI(
    "setDoingWindowParams",
    // [type, taskId?]
    defineAPIFunction<[DoingWindowType, string?], void>()
  ),

  // taskInDay更新 params [taskInDay]
  createTaskInDay: defineAPI(
    "createTaskInDay",
    defineAPIFunction<[TaskInDay], void>()
  ),
  updateTaskInDays: defineAPI(
    "updateTaskInDays",
    defineAPIFunction<[TaskInDay[]], void>()
  ),
  deleteTaskInDay: defineAPI(
    "deleteTaskInDay",
    defineAPIFunction<[TaskInDay], void>()
  ),

  // task更新 params [taskId]
  // createTask: defineAPI(
  //   "createTask",
  //   defineAPIFunction<[ProtocolReturnTask], void>(),
  // ),
  // updateTask: defineAPI(
  //   "updateTask",
  //   defineAPIFunction<[ProtocolReturnTask], void>(),
  // ),
  deleteTask: defineAPI(
    "deleteTask",
    defineAPIFunction<[ProtocolReturnTask], void>()
  ),
  batchUpsertTasks: defineAPI(
    "batchUpsertTasks",
    // params: [creates, updates]
    defineAPIFunction<
      [
        {
          created: ProtocolReturnTask[];
          updated: ProtocolReturnTask[];
        },
      ],
      void
    >()
  ),
  batchUpsertTaskTargetRecords: defineAPI(
    "batchUpsertTaskTargetRecords",
    defineAPIFunction<
      [
        {
          created: TaskTargetRecord[];
          updated: TaskTargetRecord[];
        },
      ],
      void
    >()
  ),
  deleteTaskTargetRecords: defineAPI(
    "deleteTaskTargetRecords",
    defineAPIFunction<[TaskTargetRecord[]], void>()
  ),

  // 更改任务父任务独立于updateTask 因为有特殊处理
  // changeTaskParent: defineAPI(
  //   "changeTaskParent",
  //   // params: [newTask, oldTaskParentId]
  //   defineAPIFunction<[ProtocolReturnTask, string | null], void>(),
  // ),

  // taskViewTask更新 params [taskViewTask]
  createTaskViewTask: defineAPI(
    "createTaskViewTask",
    defineAPIFunction<[TaskViewTask], void>()
  ),
  deleteTaskViewTasks: defineAPI(
    "deleteTaskViewTasks",
    defineAPIFunction<[TaskViewTask[]], void>()
  ),

  // taskGroup更新 params [TaskGroup]
  createTaskGroup: defineAPI(
    "createTaskGroup",
    defineAPIFunction<[TaskGroup], void>()
  ),
  // updateTaskGroup: defineAPI(
  //   "updateTaskGroup",
  //   defineAPIFunction<[TaskGroup], void>(),
  // ),
  deleteTaskGroup: defineAPI(
    "deleteTaskGroup",
    defineAPIFunction<[TaskGroup], void>()
  ),

  // system setting update
  updateConst: defineAPI(
    "updateConst",
    defineAPIFunction<[ConstObject], void>()
  ),
};
