import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useCollectionStore } from '@stores/useCollectionStore';
import { useAuthStore } from '@stores/useAuthStore';

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../../views/LoginView.vue'),
    meta: { guest: true },
  },
  {
    path: '/setup',
    name: 'setup',
    component: () => import('../../views/SetupView.vue'),
    meta: { guest: true },
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('../../views/AdminView.vue'),
    meta: { admin: true },
  },
  {
    path: '/',
    component: () => import('@modules/workspace/WorkspaceLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'home', component: () => import('@modules/workspace/HomeView.vue') },
      {
        path: 'collections/:collectionId',
        name: 'collection',
        component: () => import('@modules/workspace/NodeView.vue'),
      },
      {
        path: 'collections/:collectionId/folders/:folderId',
        name: 'node',
        component: () => import('@modules/workspace/NodeView.vue'),
      },
      {
        path: 'collections/:collectionId/requests/:requestId',
        name: 'request',
        component: () => import('@modules/workspace/RequestView.vue'),
      },
      {
        path: 'unsorted/requests/:requestId',
        name: 'unsorted',
        component: () => import('@modules/workspace/RequestView.vue'),
      },
      {
        path: 'collections/:collectionId/workflows/:workflowId',
        name: 'workflow',
        component: () => import('@modules/workspace/WorkflowPage.vue'),
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  const store = useCollectionStore();

  if (!auth.initialized) {
    auth.restore();
  }

  let authCheck: { setupComplete: boolean; multiUser: boolean; forceLogin: boolean } | null = null;
  try {
    authCheck = await authCheck();
  } catch {
    // ignore
  }

  if (to.meta.guest) {
    if (auth.isAuthenticated) return { name: 'home' };
    return true;
  }

  if (to.meta.admin) {
    if (!auth.isAuthenticated || !auth.isAdmin) return { name: 'home' };
    return true;
  }

  if (to.meta.requiresAuth) {
    if (!authCheck?.setupComplete) return { name: 'setup' };
    if (authCheck?.multiUser && authCheck?.forceLogin && !auth.isAuthenticated) {
      return { name: 'login' };
    }
    if (!auth.isAuthenticated && authCheck?.multiUser) {
      return { name: 'login' };
    }
  }

  if (typeof to.params.collectionId === 'string' && to.params.collectionId !== '__unsorted__') {
    store.selectCollection(to.params.collectionId);
  }
  if (typeof to.params.requestId === 'string') {
    store.selectRequest(to.params.requestId);
  }
  return true;
});
