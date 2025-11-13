import { Notification } from "@/types";
import { backend } from "@/utils/backend";
import { Cron } from "croner";
import { defineStore } from "pinia";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

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

  const pendingNotifications = ref<Notification[]>([]);
  backend.getNotifications().then((ns) => {
    console.error("pendding", ns);
    console.warn("pending", ns);
    const pending = ns.filter((d) => new Date(d.notifyAt) > new Date());
    const passed = ns.filter((d) => new Date(d.notifyAt) <= new Date());
    pendingNotifications.value = pending;
    // 删除已经过期的通知
    passed.forEach((n) => {
      backend.deleteNotificationById({
        id: n.id,
      });
    });
  });

  console.debug(
    `scheduling pending notification (${pendingNotifications.value.length})`
  );
  // init pending jobs
  const jobs: Cron[] = pendingNotifications.value.map((n) =>
    notification2Job(n)
  );

  function scheduleNotification(n: Notification) {
    if (
      new Date(n.notifyAt) > new Date()
      //  && !n.notifiedAt
    ) {
      pendingNotifications.value.push(n);
      jobs.push(notification2Job(n));
    }
  }
  function notification2Job(n: Notification): Cron {
    const cron = new Cron(
      n.notifyAt,
      () => {
        const ind = jobs.findIndex((j) => j.name === n.id);
        if (ind > -1) {
          jobs.splice(ind, 1);
        }
        const ind2 = pendingNotifications.value.findIndex(
          (ln) => ln.id === n.id
        );
        if (ind2 > -1) {
          pendingNotifications.value.splice(ind2, 1);
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
    cron.schedule();
    return cron;
  }

  function rescheduleNotification(n: Notification) {
    const ind = pendingNotifications.value.findIndex((pn) => pn.id === n.id);
    if (ind > -1) {
      const jobInd = jobs.findIndex((j) => j.name === n.id);
      if (
        new Date(n.notifyAt) <= new Date()
        // || n.notifiedAt
      ) {
        pendingNotifications.value.splice(ind, 1);
        if (jobInd > -1) {
          jobs.splice(jobInd, 1);
        }
      } else if (jobInd > -1) {
        const job = jobs[jobInd]!;
        job.pause();
        if (new Date(n.notifyAt) > new Date()) {
          jobs[jobInd] = notification2Job(n);
        }
      }
    } else {
      if (
        new Date(n.notifyAt) > new Date()
        //  && !n.notifiedAt
      ) {
        return scheduleNotification(n);
      }
    }
  }

  return {
    notifications: readonly(pendingNotifications),
    scheduleNotification,
    rescheduleNotification,
  };
});
