import { Option } from "@/components/Select.vue"

export function getTabs<T extends string>(
  desc: Partial<Record<T, string>> = {},
) {
  return Object.keys(desc).map((d) => ({
    id: d as T,
    title: desc[d as T] || "",
  }))
}

export function getOptions<T extends string>(
  desc: Partial<Record<T, string>>,
): Option[] {
  return Object.keys(desc).map((d) => ({
    id: d as T,
    name: desc[d as T] || "",
  }))
}
