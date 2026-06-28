import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import staticRoutes from './routes/static'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...staticRoutes,
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/error/404.vue'),
      meta: { title: '404' }
    }
  ] as RouteRecordRaw[]
})

export default router