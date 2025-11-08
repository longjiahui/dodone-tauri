export function standardizeLocale(
  locale: string | undefined,
  defaultLocale?: string
): string {
  return locale ? locale.split("-")[0] : standardizeLocale(defaultLocale, "en");
}
