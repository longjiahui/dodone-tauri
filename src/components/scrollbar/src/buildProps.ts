import {
  EpPropConvert,
  EpPropFinalized,
  EpPropInput,
  IfEpProp,
  IfNativePropType,
  NativePropType,
  ResolvePropType,
  isEpProp
} from './props'
import { hasOwn, isObject } from '@vueuse/core'
import { warn } from 'vue'

export const epPropKey = '__epPropKey'

export type IfNever<T, Y = true, N = false> = [T] extends [never] ? Y : N
export type IfUnknown<T, Y, N> = [unknown] extends [T] ? Y : N
export type UnknownToNever<T> = IfUnknown<T, never, T>

export type EpPropMergeType<Type, Value, Validator> =
  | IfNever<UnknownToNever<Value>, ResolvePropType<Type>, never>
  | UnknownToNever<Value>
  | UnknownToNever<Validator>

export const buildProp = <
  Type = never,
  Value = never,
  Validator = never,
  Default extends EpPropMergeType<Type, Value, Validator> = never,
  Required extends boolean = false
>(
  prop: EpPropInput<Type, Value, Validator, Default, Required>,
  key?: string
): EpPropFinalized<Type, Value, Validator, Default, Required> => {
  // filter native prop type and nested prop, e.g `null`, `undefined` (from `buildProps`)
  if (!isObject(prop) || isEpProp(prop)) return prop as any

  const { values, required, default: defaultValue, type, validator } = prop

  const _validator =
    values || validator
      ? (val: unknown) => {
          let valid = false
          let allowedValues: unknown[] = []

          if (values) {
            allowedValues = Array.from(values)
            if (hasOwn(prop, 'default')) {
              allowedValues.push(defaultValue)
            }
            valid ||= allowedValues.includes(val)
          }
          if (validator) valid ||= validator(val)

          if (!valid && allowedValues.length > 0) {
            const allowValuesText = [...new Set(allowedValues)]
              .map((value) => JSON.stringify(value))
              .join(', ')
            warn(
              `Invalid prop: validation failed${
                key ? ` for prop "${key}"` : ''
              }. Expected one of [${allowValuesText}], got value ${JSON.stringify(val)}.`
            )
          }
          return valid
        }
      : undefined

  const epProp: any = {
    type,
    required: !!required,
    validator: _validator,
    [epPropKey]: true
  }
  if (hasOwn(prop, 'default')) epProp.default = defaultValue
  return epProp
}

function fromPairs(pairs: any) {
  let index = -1
  const length = pairs == null ? 0 : pairs.length
  const result: any = {}

  while (++index < length) {
    const pair = pairs[index]
    result[pair[0]] = pair[1]
  }
  return result
}
export const buildProps = <
  Props extends Record<
    string,
    { [epPropKey]: true } | NativePropType | EpPropInput<any, any, any, any, any>
  >
>(
  props: Props
): {
  [K in keyof Props]: IfEpProp<
    Props[K],
    Props[K],
    IfNativePropType<Props[K], Props[K], EpPropConvert<Props[K]>>
  >
} =>
  fromPairs(
    Object.entries(props).map(([key, option]) => [key, buildProp(option as any, key)])
  ) as any
