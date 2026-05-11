import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes = [
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('../views/Home.vue')
      },
      {
        path: 'events',
        name: 'Events',
        component: () => import('../views/Events.vue')
      },
      {
        path: 'events/:id',
        name: 'EventDetail',
        component: () => import('../views/EventDetail.vue')
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/Profile.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'my-registrations',
        name: 'MyRegistrations',
        component: () => import('../views/MyRegistrations.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'my-orders',
        name: 'MyOrders',
        component: () => import('../views/MyOrders.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'bib/:id',
        name: 'BibNumber',
        component: () => import('../views/BibNumber.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('../views/admin/Dashboard.vue')
      },
      {
        path: 'events',
        name: 'AdminEvents',
        component: () => import('../views/admin/Events.vue')
      },
      {
        path: 'registrations',
        name: 'AdminRegistrations',
        component: () => import('../views/admin/Registrations.vue')
      },
      {
        path: 'orders',
        name: 'AdminOrders',
        component: () => import('../views/admin/Orders.vue')
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('../views/admin/Users.vue')
      },
      {
        path: 'stats',
        name: 'AdminStats',
        component: () => import('../views/admin/Stats.vue')
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.meta.requiresAdmin && userStore.user?.role !== 'admin') {
    next({ name: 'Home' })
  } else {
    next()
  }
})

export default router
