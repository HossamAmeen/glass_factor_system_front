import { createRouter, createWebHistory } from 'vue-router'

import { getAccessToken } from '@/api/client'
import ClientsView from '@/views/ClientsView.vue'
import LoginView from '@/views/LoginView.vue'
import ServiceCategoriesView from '@/views/ServiceCategoriesView.vue'
import ServicesView from '@/views/ServicesView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { public: true },
    },
    {
      path: '/',
      redirect: { name: 'clients' },
    },
    {
      path: '/clients',
      name: 'clients',
      component: ClientsView,
    },
    {
      path: '/service-categories',
      name: 'service-categories',
      component: ServiceCategoriesView,
    },
    {
      path: '/services',
      name: 'services',
      component: ServicesView,
    },
  ],
})

router.beforeEach((to) => {
  const isPublic = Boolean(to.meta.public)
  const authenticated = Boolean(getAccessToken())

  if (!isPublic && !authenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.name === 'login' && authenticated) {
    return { name: 'clients' }
  }

  return true
})

export default router
