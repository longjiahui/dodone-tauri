import { v1 as uuid } from "uuid";
import { ref, reactive, computed } from "vue";

class DialogPromise extends Promise {
  constructor(resolver, rejector) {
    let r, reject;
    super((...rest) => {
      const [_r, _reject] = rest;
      r = _r;
      reject = _reject;
      resolver(...rest);
    }, rejector);
    this.r = r;
    this.reject = reject;
  }

  raw() {
    return this.then((d) => d);
  }

  whenFinish(cb) {
    return this.then(async (d) => {
      if (d.result === "finish") {
        await cb?.(d.data);
      }
      return d;
    });
  }

  whenClose(cb) {
    return this.then(async (d) => {
      if (d.result === "close") {
        await cb?.();
      }
      return d;
    });
  }

  finishPromise(cb) {
    return new Promise((r, reject) => {
      this.whenFinish((d) => r(cb ? cb(d) : d)).catch(reject);
    });
  }

  closePromise(cb) {
    return new Promise((r, reject) => {
      this.whenClose(() => r(cb())).catch(reject);
    });
  }
  finallyPromise(cb) {
    return new Promise((r, reject) => {
      this.whenClose(() => r(cb?.(false) ?? false)).catch(reject);
      this.whenFinish(() => r(cb?.(true) ?? true)).catch(reject);
    });
  }

  close() {
    this.r?.(dialogResult("close"));
  }
  finish(data) {
    this.r?.(dialogResult("finish", data));
  }
  finally(cb) {
    super.finally(cb);
    return this;
  }
}

export function dialogResult(result, data) {
  return {
    result,
    data,
  };
}
export function dialogFinishResult(d) {
  return {
    result: "finish",
    data: d,
  };
}
export function dialogCloseResult() {
  return {
    result: "close",
  };
}

export function useDialog(d, options = {}) {
  const { onShow } = options || {};

  const id = ref(uuid());
  const data = ref(d);
  const visible = ref(false);
  const processInstance = ref(0);
  const isProcessing = computed(() => processInstance.value > 0);
  const isGettingData = ref(false);
  const isLoading = computed(() => isProcessing.value || isGettingData.value);

  let promise;
  let resultBeforeResolve;
  const context = reactive({
    id,
    data,
    visible,
    isLoading,
    async process(cb) {
      processInstance.value += 1;
      return new Promise((r) => {
        r(cb?.());
      }).finally(() => {
        processInstance.value -= 1;
      });
    },
    show(d) {
      id.value = uuid();
      const tryGetData = async () => {
        if (d instanceof Function) {
          d = await this.process(d);
        }
        return d;
      };
      if (!promise) {
        promise = new DialogPromise((_r, reject) => {
          tryGetData()
            .then((d) => {
              data.value = d;
              onShow?.();
            })
            .catch(reject);
        }, context);
        promise
          .finally(() => {
            visible.value = false;
            promise = undefined;
          })
          .catch((err) => {
            console.error(err);
            throw err;
          });
        // 保证visible true 前 promise已经返回
        setTimeout(() => {
          visible.value = true;
        });
      }
      return promise;
    },
    finish(data) {
      promise?.finish(data);
    },
    close() {
      promise?.close();
    },
    setVisible(val) {
      visible.value = val;
    },
    // setResultBeforeResolve(result, data) {
    //     resultBeforeResolve = dialogResult(result, data)
    // },
    setFinish(data) {
      resultBeforeResolve = dialogFinishResult(data);
    },
    setClose() {
      resultBeforeResolve = dialogCloseResult();
    },
    resolve() {
      // this.setVisible(false)
      if (resultBeforeResolve?.result === "finish") {
        this.finish(resultBeforeResolve?.data);
      } else {
        this.close();
      }
    },
  });
  return context;
}
