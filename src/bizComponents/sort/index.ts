import { ReadOnlyTaskWithChildren } from "@/types"
import { useI18n } from "vue-i18n"

export const taskSortFields = [
  "content",
  "createdAt",
  "groupId",
  "priority",
  "startAt",
] satisfies (keyof Pick<
  ReadOnlyTaskWithChildren,
  "content" | "createdAt" | "groupId" | "priority" | "startAt"
>)[]
export type TaskSort = {
  field: (typeof taskSortFields)[number]
  order: "asc" | "desc"
}

export type SortTypeField = TaskSort["field"]

export function useSortTypeFieldDesc() {
  const { t } = useI18n()
  return computed<Record<SortTypeField, string>>(() => {
    return {
      groupId: t("taskGroup"),
      content: t("content"),
      priority: t("priority"),
      createdAt: t("startDate"),
      startAt: t("endDate"),
    }
  })
}

export function sortTasksByTaskSort(
  a: ReadOnlyTaskWithChildren,
  b: ReadOnlyTaskWithChildren,
  sort?: TaskSort,
) {
  if (sort) {
    const fieldA = a[sort.field]
    const fieldB = b[sort.field]
    if (fieldA === fieldB) {
      return 0
    }
    if (sort.order === "asc") {
      return fieldA! < fieldB! ? -1 : 1
    } else {
      return fieldA! > fieldB! ? -1 : 1
    }
  } else {
    return 0
  }
}
