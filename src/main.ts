import "ant-design-vue/dist/reset.css";
import "./styles/index.css";
import { createApp } from "vue";
import App from "./App.vue";
import plugins from "./plugins";
// import { backend } from "./utils/electron"
// import { applyColorMode } from "./utils/color"

const app = createApp(App);

app.use(plugins);

app.mount("#app");

// color mode
// backend.getConst("colorMode").then((mode) => {
//   applyColorMode(mode)
// })
