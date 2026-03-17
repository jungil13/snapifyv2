import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/photobooth',
      name: 'photobooth',
      component: () => import('../components/PhotoBooth.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/About.vue'),
    },
    {
      path: '/faq',
      name: 'faq',
      component: () => import('../views/FAQ.vue'),
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: () => import('../views/Privacy.vue'),
    },
  ],
})

export default router
