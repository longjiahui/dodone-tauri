// declare module '@/utils' {
//     export const dialog
import { UseFormReturnType } from "..";

// }
type ToRest<T, Extra = undefined> = T extends undefined | void
  ? Extra extends null | undefined | void
    ? []
    : [Extra]
  : Extra extends null | undefined | void
    ? [T]
    : [T, Extra];

type DialogResultEnum = "finish" | "close";

export interface DialogResult<
  T = any,
  Result extends DialogResultEnum = DialogResultEnum,
> {
  result: Result;
  data?: T;
}

export function dialogResult<Result extends DialogResultEnum, T>(
  r: Result,
  data?: T
): DialogResult<T, Result>;
export function dialogFinishResult<T>(data?: T): DialogResult<T, "finish">;
export function dialogCloseResult<T>(): DialogResult<T, "close">;

type GetResolveDataType<T> = T extends DialogResult<infer R> ? R : any;
declare class DialogPromise<
  P,
  R extends DialogResult,
> extends Promise<DialogResult> {
  raw(): DialogPromise<P, R>;
  whenFinish(cb: (d?: GetResolveDataType<R>) => any): DialogPromise<P, R>;
  whenClose(cb: () => any): DialogPromise<P, R>;
  finishPromise<T>(cb?: (d?: GetResolveDataType<R>) => T): Promise<Awaited<T>>;
  closePromise<T>(cb: () => T): Promise<T>;
  finallyPromise<T>(cb?: (isFinished: boolean) => T): Promise<T>;
  then<TResult1 = any, TResult2 = never>(
    onfulfilled?:
      | ((value: any) => TResult1 | PromiseLike<TResult1>)
      | null
      | undefined,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | null
      | undefined
  ): DialogPromise<P, TResult1 | TResult2>;
  finally(onfinally?: (() => void) | null | undefined): DialogPromise<P, R>;
  close(): void;
  finish(...data: toRest<R>);
}

export type DialogType<
  T,
  R = void,
  ShowParams = ToRest<T | (() => T | PromiseLike<T>)>,
  finishParams = ToRest<R>,
> = {
  id: string;
  data: T;
  visible: boolean;
  isLoading: boolean;
  promise(): DialogPromise<T, DialogResult<R>> | undefined;
  show(...rest: ShowParams): DialogPromise<T, DialogResult<R>>;
  process<R>(cb: () => R | PromiseLike<R>): Promise<R>;
  finish(...rest: finishParams): void;
  close(): void;
  // FyDialog.vue 用到这些接口，监听了visible的变化 再次统一判断是finish/close
  setVisible(val: boolean): void;
  // setResultBeforeResolve<T = any>(result: DialogResultEnum, data?: T): void
  setFinish(...rest: finishParams): void;
  setClose(): void;
  resolve(): void;
  hide(): void;
  f: UseFormReturnType<T>;
};

export function useDialog<T = undefined, R = void>(
  ...rest: ToRest<
    T,
    {
      // after set data
      onShow?: () => any;
    } | void
  >
): DialogType<T, R>;

export type AnyDialogType = DialogType<any, any, any, any>;
