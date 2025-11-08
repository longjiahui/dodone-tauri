import { default as localDayjs } from "dayjs"

import relativeTime from "dayjs/plugin/relativeTime"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"
import isLeapYear from "dayjs/plugin/isLeapYear"
import weekOfYear from "dayjs/plugin/weekOfYear"
import isToday from "dayjs/plugin/isToday"
import weekday from "dayjs/plugin/weekday"
import isBetween from "dayjs/plugin/isBetween"
localDayjs.extend(relativeTime)
localDayjs.extend(isLeapYear)
localDayjs.extend(weekOfYear)
localDayjs.extend(isToday)
localDayjs.extend(isSameOrAfter)
localDayjs.extend(isSameOrBefore)
localDayjs.extend(weekday)
localDayjs.extend(isBetween)

declare global {
  interface Window {
    dayjs: typeof localDayjs
  }
}

window.dayjs = localDayjs

export function formatDate(d: any, format = "YYYY/MM/DD") {
  const val = localDayjs(d)
  return val.isValid() ? val.format(format) : "Invalid Date"
}
export function formatDateTime(d: any) {
  return formatDate(d, "YYYY/MM/DD HH:mm:ss")
}
export const dayjs = localDayjs
export type Dayjs = localDayjs.Dayjs

export function makeDayjsByDateTime(
  date: Date | Dayjs | string,
  time: Dayjs | Date | string,
  config = {
    dateFormat: "YYYY-MM-DD",
    timeFormat: "HH:mm:ss",
  },
) {
  const d =
    typeof date === "string" ? dayjs(date, config.dateFormat) : dayjs(date)
  const t =
    typeof time === "string" ? dayjs(time, config.timeFormat) : dayjs(time)
  return dayjs(
    d.format(config.dateFormat) + " " + t.format(config.timeFormat),
    config.dateFormat + " " + config.timeFormat,
  )
}
