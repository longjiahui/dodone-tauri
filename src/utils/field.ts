export function omit<T extends Record<string, any>, K extends keyof T>(
  val: T,
  keys: K[] | K,
): Omit<T, K> {
  const ret = { ...val }
  keys = keys instanceof Array ? keys : [keys]
  keys.forEach((k) => delete ret[k])
  return ret
}

export function pick<T extends Record<string, any>, K extends keyof T>(
  val: T,
  keys: K | K[],
) {
  const ret: { [k in K]?: T[K] } = {}
  keys = keys instanceof Array ? keys : [keys]
  keys.forEach((k) => {
    ret[k] = val[k]
  })
  return ret as Pick<T, K>
}
