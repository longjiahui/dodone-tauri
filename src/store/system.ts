// import { applyColorMode } from "@/utils/color"
import { backend } from "@/utils/backend";
import { defineStore } from "pinia";

export const useSystemStore = defineStore("systemStore", () => {
  // const中的配置、system/light/dark
  const colorMode = computedAsync(
    () => backend.getConst("colorMode"),
    "system"
  );

  // 监听const配置更新
  backend.on_updateConst((constObject) => {
    colorMode.value = constObject.colorMode;
    locale.value = constObject.locale;
  });

  // 监听最终是否为暗色模式
  // 应该根据这个来判断
  // media是根据electron-main中的 nativeTheme.themeSource 来判断的
  const isDarkMode = ref(false);
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleColorSchemeChange = (e: MediaQueryListEvent) => {
    isDarkMode.value = e.matches;
  };
  // onMounted(() => {
  isDarkMode.value = mediaQuery.matches;
  mediaQuery.addEventListener("change", handleColorSchemeChange);
  // })

  const locale = computedAsync(() => backend.getConst("locale"));
  return {
    colorMode,
    isDarkMode,
    locale,

    setColorMode(mode: typeof colorMode.value) {
      return backend.setConst("colorMode", mode);
    },
    setLocale(l: typeof locale.value) {
      return backend.setConst("locale", l);
    },
  };
});
