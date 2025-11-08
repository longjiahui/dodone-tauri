// 如果在dialogs中使用别的dialogs可能会产生循环引用，所以创建一个helper来在dialog中调用别的dialog
import plugins from "@/plugins"
import { ConfigProvider } from "ant-design-vue"
import type { AllowedComponentProps, VNodeProps } from "vue"
import { useI18n } from "vue-i18n"
import { DialogType, useDialog } from "./dialog"
import enUS from "ant-design-vue/es/locale/en_US"
import zhCN from "ant-design-vue/es/locale/zh_CN"

type ComponentProps<C extends Component> = C extends new (...args: any) => any
  ? Omit<
      InstanceType<C>["$props"],
      keyof VNodeProps | keyof AllowedComponentProps
    >
  : never

export type DialogParams<T extends Component> = Omit<
  ComponentProps<T>,
  "dialog"
>

export function openDialog<C extends Component = Component>(
  Component: C,
  params: DialogParams<C>,
) {
  const dialog = useDialog<
    any,
    ComponentProps<C>["dialog"] extends DialogType<any, infer U> ? U : void
  >()
  const app = createApp({
    render() {
      const i18n = useI18n()
      const locale = computed(
        () =>
          ({
            zh: zhCN,
            en: enUS,
          })[i18n.locale.value] || enUS,
      )
      return h(
        ConfigProvider,
        {
          locale: locale.value,
        },
        () => [
          h(Component, {
            dialog,
            ...params,
          }),
        ],
      )
    },
  })
  const div = document.createElement("div")
  document.body.append(div)
  app.use(plugins)
  app.mount(div)
  return dialog.show().finally(() => {
    setTimeout(() => {
      app?.unmount()
      div?.remove()
    }, 3000)
  })
}
