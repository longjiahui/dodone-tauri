// import { ipcRenderer } from "electron";
import { protocols, webProtocols } from "@/protocol";
import { Replace, ConstObject } from "@/types";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

type WebProtocolObject = {
  [k in `on_${(typeof webProtocols)[keyof typeof webProtocols]["name"]}`]: (
    callback: (
      ...rest: Parameters<(typeof webProtocols)[Replace<k, "on_", "">]["api"]>
    ) => any
  ) => Promise<() => any>;
};

function camelToSnakeCase(str: string) {
  return str
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "");
}
function camelObjectToSnakeCase(obj: Record<string, any>) {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return obj;
  }
  const newObj: Record<string, any> = {};
  for (const key in obj) {
    const newKey = camelToSnakeCase(key);
    newObj[newKey] = obj[key];
    if (
      typeof obj[key] === "object" &&
      obj[key] !== null &&
      !Array.isArray(obj[key])
    ) {
      newObj[newKey] = camelObjectToSnakeCase(obj[key]);
    }
  }
  return newObj;
}

function snakeToCamelCase(str: string) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
function snakeObjectToCamelCase(obj: Record<string, any>) {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return obj;
  }
  const newObj: Record<string, any> = {};
  for (const key in obj) {
    const newKey = snakeToCamelCase(key);
    newObj[newKey] = obj[key];
    if (
      typeof obj[key] === "object" &&
      obj[key] !== null &&
      !Array.isArray(obj[key])
    ) {
      newObj[newKey] = snakeObjectToCamelCase(obj[key]);
    }
  }
  return newObj;
}

export default {
  // on(...args: Parameters<typeof ipcRenderer.on>) {
  //   const [channel, listener] = args
  //   return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  // },
  // off(...args: Parameters<typeof ipcRenderer.off>) {
  //   const [channel, ...omit] = args
  //   return ipcRenderer.off(channel, ...omit)
  // },
  // send(...args: Parameters<typeof ipcRenderer.send>) {
  //   const [channel, ...omit] = args
  //   return ipcRenderer.send(channel, ...omit)
  // },
  // invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
  //   const [channel, ...omit] = args
  //   return ipcRenderer.invoke(channel, ...omit)
  // },

  // You can expose other APTs you need here.
  // ...
  ...Object.entries(protocols).reduce(
    (t, [_k, a]) => {
      t[a.name] = ((...rest: any[]) => {
        return invoke(
          camelToSnakeCase(a.name),
          ...rest.map((d) => camelObjectToSnakeCase(d))
        ).then((d) => snakeObjectToCamelCase(d as any));
      }) as any;
      return t;
    },
    {} as {
      [k in (typeof protocols)[Exclude<
        keyof typeof protocols,
        "getConst" | "setConst"
      >]["name"]]: (
        ...args: Parameters<(typeof protocols)[k]["api"]>
      ) => ReturnType<(typeof protocols)[k]["api"]>;
    } & {
      // setconst getconst type fix
      // 因为protocol 的defineAPI不能动态决定参数类型
      getConst: <K extends keyof ConstObject>(
        key: K
      ) => Promise<ConstObject[K]>;
      setConst: <K extends keyof ConstObject>(
        key: K,
        value: ConstObject[K]
      ) => Promise<void>;
    }
  ),

  ...Object.entries(webProtocols).reduce((t, [_k, a]) => {
    t[`on_${a.name}`] = (callback: any) => {
      return listen(camelToSnakeCase(a.name), (_, ...rest) =>
        callback(...rest.map((d) => snakeObjectToCamelCase(d)))
      );
    };
    return t;
  }, {} as WebProtocolObject),
  // onSetDoingWindowType: (callback: any)=>{
  //   ipcRenderer.on('set-doing-window-type', (_, type: any)=>{
  //     callback(type)
  //   })
};
