import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useCollectionStore } from '@stores/useCollectionStore';

export const routes: RouteRecordRaw[] = [  {
    path: '/',
    component: () => import('@modules/workspace/WorkspaceLayout.vue'),
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

router.beforeEach((to) => {
  const store = useCollectionStore();
  if (typeof to.params.collectionId === 'string' && to.params.collectionId !== '__unsorted__') store.selectCollection(to.params.collectionId);
  if (typeof to.params.requestId === 'string') store.selectRequest(to.params.requestId);
  return true;
});
