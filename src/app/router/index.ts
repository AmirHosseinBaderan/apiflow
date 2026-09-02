import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'workspace',
    component: () => import('@modules/workspace/WorkspaceView.vue'),
  },
  {
    path: '/collections/:collectionId',
    name: 'collection',
    component: () => import('@modules/workspace/WorkspaceView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});