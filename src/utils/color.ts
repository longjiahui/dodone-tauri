import { ConstObject } from "../../electron/const"

type ThemeConfigType = {
  s: number
  l: number
  a: number
}

export function calculateTheme(
  hue:
    | ComputedRef<string | number | undefined>
    | MaybeRef<string | number | undefined>,
  config: ComputedRef<ThemeConfigType> | MaybeRef<ThemeConfigType>,
) {
  const theme = `hsla(${unref(hue)}, ${unref(config).s}%, ${unref(config).l}%, ${unref(config).a})`
  const themeDark = `hsla(${unref(hue)}, ${unref(config).s}%, ${unref(config).l - 20}%, ${unref(config).a})`
  const themeLight = `hsla(${unref(hue)}, ${unref(config).s}%, ${unref(config).l + 10}%, ${unref(config).a})`
  const themeLight2 = `hsla(${unref(hue)}, ${unref(config).s}%, ${unref(config).l + 20}%, ${unref(config).a})`
  const themeLight3 = `hsla(${unref(hue)}, ${unref(config).s}%, ${unref(config).l + 30}%, ${unref(config).a})`
  const themeLight4 = `hsla(${unref(hue)}, ${unref(config).s}%, ${unref(config).l + 35}%, ${unref(config).a})`
  const isLightHue = +unref(hue)! >= 40 && +unref(hue)! <= 185
  const themeTextColor = isLightHue
    ? `hsla(${unref(hue)}, ${unref(config).s}%, ${unref(config).l - 40}%, ${unref(config).a})`
    : "#fff"
  const themeTextBackground = isLightHue ? themeLight3 : theme
  return {
    theme,
    themeDark,
    themeLight,
    themeLight1: themeLight,
    themeLight2,
    themeLight3,
    themeLight4,

    themeTextBackground: themeTextBackground,
    themeTextColor,
    cssVariables: {
      "--theme": theme,
      "--theme-dark": themeDark,
      "--theme-light": themeLight,
      "--theme-light-1": themeLight,
      "--theme-light-2": themeLight2,
      "--theme-light-3": themeLight3,
      "--theme-light-4": themeLight4,

      "--theme-text-background": themeTextBackground,
      "--theme-text-color": themeTextColor,
    },
  }
}

export function useTheme(
  hue:
    | ComputedRef<string | number | undefined>
    | MaybeRef<string | number | undefined>,
  config: ComputedRef<ThemeConfigType> | MaybeRef<ThemeConfigType>,
) {
  return computed(() => calculateTheme(hue, config))
}

// export function applyColorMode(
//   mode: ConstObject["colorMode"],
//   oldMode?: ConstObject["colorMode"],
// ) {
//   if (mode) {
//     document.querySelector("html")?.classList.add(mode)
//   }
//   if (oldMode) {
//     document.querySelector("html")?.classList.remove(oldMode)
//   }
// }
