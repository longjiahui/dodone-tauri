import { createRouter, createWebHashHistory } from "vue-router"
import { Routes } from "./const"

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      redirect: {
        name: Routes.default,
      },
      children: [
        {
          path: "/default",
          component: () => import("@/views/layout/MainLayout.vue"),
          redirect: Routes.default,
          children: [
            {
              path: "/default/task",
              name: Routes.taskPage,
              component: () => import("@/views/default/TaskPage.vue"),
            },
          ],
        },
      ],
    },
  ],
})
