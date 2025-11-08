import { defineStore } from "pinia";

export const useNotificationStore = defineStore("notification", () => {
  //   const pendingNotifications = ref<Notification[]>([])
  //   backend.getNotifications(dayjs().toDate()).then((ns) => {
  //     pendingNotifications.value = ns
  //   })
  //   const shceduledNotificationIds = ref<Partial<Record<string, boolean>>>({})
  //   watch(pendingNotifications, (ns) => {
  //     ns.forEach((n) => {
  //       if (!shceduledNotificationIds.value[n.id]) {
  //       }
  //     })
  //   })
  //   return {
  //     notifications: readonly(pendingNotifications),
  //     createNotification(title: string, content: string, notifyAt: Date) {
  //       return backend
  //         .createNotification({
  //           title,
  //           content,
  //           notifyAt,
  //         })
  //         .then((n) => {
  //           if (dayjs(n.notifyAt).isAfter(dayjs())) {
  //             pendingNotifications.value.push(n)
  //           }
  //         })
  //     },
  //   }
});
