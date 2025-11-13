import { Notification } from "@/types";
import { backend } from "@/utils/backend";
import { Cron } from "croner";
import { defineStore } from "pinia";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

interface NotifcationContext {
  notification: Notification;
  job?: Cron;
}

export const useNotificationStore = defineStore("notification", () => {
  async function notify(...rest: Parameters<typeof sendNotification>) {
    // 你有发送通知的权限吗？
    let permissionGranted = await isPermissionGranted();

    // 如果没有，我们需要请求它
    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === "granted";
    }

    // 一旦获得许可，我们就可以发送通知
    if (permissionGranted) {
      return sendNotification(...rest);
    }
  }

  const contexts = ref<NotifcationContext[]>([]);
  // init pending jobs
  backend.getNotifications().then((ns) => {
    const pending = ns.filter((d) => new Date(d.notifyAt) > new Date());
    const passed = ns.filter((d) => new Date(d.notifyAt) <= new Date());
    contexts.value = pending.map((d) => ({
      notification: d,
    }));
    // 删除已经过期的通知
    passed.forEach((n) => {
      backend.deleteNotificationById({
        id: n.id,
      });
    });
    console.debug(`scheduling pending notification (${contexts.value.length})`);
    contexts.value.forEach((c) => (c.job = notification2Job(c.notification)));
  });

  function scheduleNotification(n: Notification) {
    const found = contexts.value.find((c) => c.notification.id === n.id);
    if (found) {
      if (found.job) {
        found.job.stop();
        found.job = undefined;
      }
      found.job = notification2Job(n);
    } else {
      contexts.value.push({
        notification: n,
        job: notification2Job(n),
      });
    }
  }
  function notification2Job(n: Notification): Cron | undefined {
    console.debug("scheduling notification: ", n);
    if (new Date(n.notifyAt) > new Date()) {
      const cron = new Cron(
        n.notifyAt,
        () => {
          console.debug("notifying!!: ", n);
          const contextIndex = contexts.value.findIndex(
            (c) => c.notification.id === n.id
          );
          if (contextIndex > -1) {
            contexts.value.splice(contextIndex, 1);
          }
          backend.deleteNotificationById({
            id: n.id,
          });
          // send notification
          return notify({
            title: n.title,
            body: n.content,
            // icon: '',
            // icon: defaultIcon,
          });
        },
        {
          maxRuns: 1,
        }
      );
      cron.name = n.id;
      return cron;
    } else {
      return undefined;
    }
  }

  return {
    contexts: readonly(contexts),
    scheduleNotification,
  };
});
