import * as CommonDialogs from "./commonDialog"
import * as BizDialogs from "@/bizComponents/dialog"
import { type DialogParams, openDialog } from "./helper"

export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K
}[keyof T]

export type Dialogs = typeof CommonDialogs & typeof BizDialogs
export const dialogs: {
  [k in keyof Dialogs]: (
    ..._: RequiredKeys<DialogParams<Dialogs[k]>> extends never
      ? [DialogParams<Dialogs[k]>?]
      : [DialogParams<Dialogs[k]>]
  ) => ReturnType<typeof openDialog<Dialogs[k]>>
} = Object.keys({
  ...CommonDialogs,
  ...BizDialogs,
}).reduce(
  (t, k) => {
    t[k as keyof typeof t] = (params) =>
      openDialog(
        CommonDialogs[k as keyof typeof CommonDialogs] ||
          BizDialogs[k as keyof typeof BizDialogs],
        (params || {}) as any,
      )
    return t
  },
  {} as typeof dialogs,
)
