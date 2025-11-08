import Loading from "@/components/Loading.vue"
import { v1 as uuid } from "uuid"
import { App, createApp, Directive, ref, Transition } from "vue"

interface AppContext {
  app?: App<any>
  visible?: Ref<boolean>
  id?: string
}
const apps: Partial<Record<string, AppContext>> = {}
function getApp(el: HTMLElement) {
  const id = el.dataset?.loadingAppId
  return { ...(id ? apps[id] : {}), id }
}

function initPositionStyle(el: HTMLElement) {
  const style = window.getComputedStyle(el)
  const position = style?.position
  let needRelativePosition = true
  if (["fixed", "absolute", "sticky", "relative"].includes(position)) {
    needRelativePosition = false
  }
  if (needRelativePosition) {
    el.style.position = "relative"
  }
}
export const loadingDirective = {
  mounted(el, isLoading) {
    const visible = ref(isLoading?.value === false ? false : true)
    const id = uuid()
    el.setAttribute("data-loading-app-id", id)

    // 如果el没有relative 给加上
    initPositionStyle(el)

    const div = document.createElement("div")
    div.id = id
    const app = createApp({
      render() {
        return h(Transition, { name: "fade-slow", appear: true }, () =>
          visible.value
            ? h(
                "div",
                {
                  style: {
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    zIndex: 999,
                    background:
                      "var(--loading-mask-background-color, var(--bg-a60))",
                    top: 0,
                    left: 0,
                  },
                },
                [
                  h(
                    "div",
                    {
                      style: {
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                      },
                    },
                    [h(Loading)],
                  ),
                ],
              )
            : null,
        )
      },
    })
    el.appendChild(div)
    app.mount(div)
    apps[id] = {
      app,
      visible,
    }
  },
  updated(el, isLoading) {
    const { visible } = getApp(el)
    if (visible) {
      visible.value = isLoading?.value === false ? false : true
    }
    // isLoading是true,则让el不能被鼠标事件响应
    // el.style.pointerEvents = 'none'
  },
  beforeUnmount(el) {
    const { app, id } = getApp(el)
    app?.unmount()
    if (id) {
      delete apps[id]
    }
  },
} as Directive

export const loadingPlugin = {
  install(app: App) {
    app.directive("loading", loadingDirective)
  },
}
