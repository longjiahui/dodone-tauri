import { throttle as throttleBase } from "throttle-debounce"

export function throttle<F extends (...args: any[]) => any>(
  ...rest: Parameters<typeof throttleBase<F>>
): ReturnType<typeof throttleBase<F>> {
  return throttleBase(...rest)
}
