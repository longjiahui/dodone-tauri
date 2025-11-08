export function queueAsyncCall<T extends (...rest: any[]) => Promise<any>>(
  func: T,
) {
  // 这个函数传入一个异步函数，返回一个函数，这个函数调用后会按调用的顺序返回
  const promises: Promise<any>[] = []
  return (...rest: Parameters<T>) => {
    return new Promise<Awaited<ReturnType<T>>>((r) => {
      Promise.all(promises).finally(() => {
        const ret = func(...rest)
        if (ret instanceof Promise) {
          promises.push(ret)
          ret.finally(() => {
            const ind = promises.findIndex((p) => p === ret)
            if (ind > -1) {
              promises.splice(ind, 1)
            }
          })
        }
        r(ret)
      })
    })
  }
}
