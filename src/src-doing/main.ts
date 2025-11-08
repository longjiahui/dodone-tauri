import "ant-design-vue/dist/reset.css"
import "@/styles/index.css"
import { createApp } from "vue"
import App from "./App.vue"

import * as $const from "@/const"
import { focusPlugin } from "@/directives/focus"
import { i18nPlugin } from "@/i18n"
import { loadingPlugin } from "@/directives/loading"
import { wavePlugin } from "@/directives/wave"
import { store } from "@/store"

const app = createApp(App)
app.use(i18nPlugin)
app.use(focusPlugin)
app.use(loadingPlugin)
app.use(wavePlugin)
app.use(store)
app.config.globalProperties.$const = $const

app.mount("#app")
