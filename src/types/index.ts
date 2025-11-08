export type { Placement as DropdownPlacement } from "ant-design-vue/es/vc-select/BaseSelect";
export type { TooltipPlacement } from "ant-design-vue/es/tooltip";
export * from "./biz";

// export type Placement =
//   | "bottomLeft"
//   | "bottom"
//   | "bottomRight"
//   | "topLeft"
//   | "top"
//   | "topRight"
//   | "leftTop"
//   | "left"
//   | "leftBottom"
//   | "right"
//   | "rightTop"
// export type Trigger = "click" | "hover" | "focus"
export type { Trigger } from "ant-design-vue/es/dropdown/props";

// export type Icon = keyof typeof import("@ant-design/icons-vue")
export type Icon = string;
//  | keyof typeof import("@ant-design/icons-vue")

export type DoingWindowType = "auto-task-in-day" | "specific-task";
export {};

// Slice the first element of an array
type _Slice0<T extends any> = T extends [any, ...infer B] ? B : never;
// Slice the last element of an array
type _SliceLast<T extends any> = T extends [...infer B, any] ? B : never;

type Tuple<T extends number, U extends any[] = []> = U["length"] extends T
  ? U
  : Tuple<T, [...U, any]>;

// 数字相减
type Subtract<A extends number, B extends number> =
  Tuple<A> extends [...Tuple<B>, ...infer R] ? R["length"] : never;

// 数字相加
// type Add<A extends number, B extends number> = [
//   ...Tuple<A>,
//   ...Tuple<B>
// ] extends [...infer T]
//   ? T["length"]
//   : never

// Slice array [T] from [From] to [To]
export type Slice<
  T extends any[],
  From extends number = 0,
  To extends number = 0,
> = From extends 0
  ? To extends 0
    ? T
    : Slice<_SliceLast<T>, From, Subtract<To, 1>>
  : Slice<_Slice0<T>, Subtract<From, 1>, To>;

// export type DropChar<
//   S extends string,
//   R extends string,
// > = S extends `${infer A}${R}${infer B}` ? DropChar<`${A}${B}`, R> : S

// // Drop string S from R
// export type DropString<
//   S extends string,
//   R extends string,
// > = R extends `${infer F}${infer L}` ? DropString<DropChar<S, F>, L> : S

export type Replace<
  T extends string,
  C extends string,
  RC extends string,
  F extends string = "",
> =
  // 空格替换 特殊处理
  C extends ""
    ? T extends ""
      ? RC
      : `${RC}${T}`
    : T extends `${infer L}${C}${infer R}` // 匹配模式
      ? Replace<R, C, RC, `${F}${L}${RC}`> // 结果拼接并替换
      : `${F}${T}`;

export type StringArrayToUnion<T extends string[]> = T[number];
