export function toNumber<T>(value: T, defaultValue = 0): number {
  return isNaN(+value) ? defaultValue : +value
}
