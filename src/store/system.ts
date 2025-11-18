// import { applyColorMode } from "@/utils/color"
import { backend } from "@/utils/backend";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { defineStore } from "pinia";
import { backendEvent } from "./events";
//
// 关于颜色，现在prefers-color-schema暂时是用不了的，所以需要使用tauri本身的theme接口来做
export const imageProtocolNamePromise = backend.getImageProtocolName();
export const imageProtocolName = computedAsync(
  () => imageProtocolNamePromise,
  ""
);
export function useDefaultModifiedMarkdownContent(
  content: MaybeRef<string | undefined>
) {
  return asyncComputed(async () => {
    if (navigator.platform.startsWith("Win")) {
      return unref(content)?.replace(
        new RegExp(`(${imageProtocolName.value}://)`, "gs"),
        `//${imageProtocolName.value}.localhost/`
      );
    } else {
      return unref(content);
    }
  }, "");
}
export const useSystemStore = defineStore("systemStore", () => {
  // const中的配置、system/light/dark
  const colorMode = computedAsync(
    () => backend.getConst({ key: "colorMode" }),
    "system"
  );

  // 监听const配置更新
  backendEvent.on("updateConst", (constObject) => {
    colorMode.value = constObject.colorMode;
    locale.value = constObject.locale;
  });

  const isDarkMode = ref(false);
  const window = getCurrentWindow();
  window.theme().then((theme) => {
    isDarkMode.value = theme === "dark";
  });
  window.onThemeChanged((e) => {
    console.debug("darkmode changed!", e);
    isDarkMode.value = e.payload === "dark";
  });
  watch(
    isDarkMode,
    (val) => {
      console.debug("isDarkMode:", val);
      const el = document.querySelector(":root");
      if (el instanceof HTMLElement) {
        console.debug("origin color-scheme", el.style.colorScheme);
        console.debug("set color-scheme:", val ? "dark" : "light");
        if (val) {
          el.classList.add("dark");
          el.style.colorScheme = "dark";
        } else {
          el.classList.remove("dark");
          el.style.colorScheme = "light";
        }
      }
    },
    { immediate: true }
  );

  // // 监听最终是否为暗色模式
  // // 应该根据这个来判断
  // // media是根据electron-main中的 nativeTheme.themeSource 来判断的
  // const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  // const handleColorSchemeChange = (e: MediaQueryListEvent) => {
  //   isDarkMode.value = e.matches;
  // };
  // // onMounted(() => {
  // isDarkMode.value = mediaQuery.matches;
  // mediaQuery.addEventListener("change", handleColorSchemeChange);
  // // })

  const locale = computedAsync(() => backend.getConst({ key: "locale" }));
  return {
    colorMode,
    isDarkMode,
    locale,
    imageProtocolName,
    imageProtocolNamePromise,

    setColorMode(mode: typeof colorMode.value) {
      return backend.setConst({ key: "colorMode", value: mode });
    },
    setLocale(l: typeof locale.value) {
      return backend.setConst({ key: "locale", value: l });
    },
  };
});
