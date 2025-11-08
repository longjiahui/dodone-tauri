import { Directive, Plugin } from "vue"

export const focusDirective = {
  mounted(el) {
    nextTick(() => {
      setTimeout(() => {
        if (
          el instanceof HTMLInputElement ||
          el instanceof HTMLTextAreaElement
        ) {
          el.focus()
        } else {
          el.querySelector("input,textarea")?.focus?.()
        }
      })
    })
  },
} as Directive

export const focusPlugin = {
  install(app) {
    app.directive("focus", focusDirective)
  },
} as Plugin
