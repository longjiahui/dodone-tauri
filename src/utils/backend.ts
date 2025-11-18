import api from "@/api";
import { error } from "@tauri-apps/plugin-log";
import { copy } from "fast-copy";

function shortid() {
  return Math.random().toString(36).slice(-6);
}

// async function getDialogs() {
//   return import("@/components/dialog").then((d) => d.dialogs);
// }

export const backend = Object.entries(api).reduce(
  (t, [k, v]) => {
    Object.assign(t, {
      [k]: (...args: any[]) => {
        const id = shortid();
        console.debug(`[${id}]backend call ${k}`, ...args);
        const ret = (v as any)(
          // on_开头的参数是函数、不能经过JSON序列化和反序列化
          // 非on_开头的参数中不能传入函数等不能序列化的变量、所以使用了JSON序列化排除这些变量
          ...(k.startsWith("on_") ? args : copy(args))
        );
        if (ret instanceof Promise) {
          return ret
            .then((d) => {
              console.debug(`[${id}]backend call ${k} result`, d);
              return d;
            })
            .catch(async (err) => {
              const errorMessage = `[${id}]backend call ${k} error: ${err}`;
              console.error(errorMessage);
              error(errorMessage);
              try {
                error(
                  `${id}backend call ${k} parameters: ${JSON.stringify(args)}`
                );
              } catch (e) {
                error("call args stringify failed!");
              }
            });
        } else {
          return ret;
        }
      },
    });
    return t;
  },
  {} as typeof window.backend
);
