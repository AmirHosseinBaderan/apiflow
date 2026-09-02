import {createRouter, createWebHistory, type RouteRecordRaw} from 'vue-router';
import {useCollectionStore} from '@stores/useCollectionStore';

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        component: () => import('@modules/workspace/WorkspaceLayout.vue'),
        children: [
            {path: '', name: 'home', component: () => import('@modules/workspace/HomeView.vue')},
            {
                path: 'collections/:collectionId',
                name: 'collection',
                component: () => import('@modules/workspace/NodeView.vue')
            },
            {
                path: 'collections/:collectionId/folders/:folderId',
                name: 'node',
                component: () => import('@modules/workspace/NodeView.vue')
            },
            {
                path: 'collections/:collectionId/requests/:requestId',
                name: 'request',
                component: () => import('@modules/workspace/RequestView.vue')
            },
        ],
    },
    {path: '/:pathMatch(.*)*', redirect: '/'},
];

export const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to) => {
    const store = useCollectionStore();
    if (typeof to.params.collectionId === 'string') store.selectCollection(to.params.collectionId);
    if (typeof to.params.requestId === 'string') store.selectRequest(to.params.requestId);
    return true;
});
