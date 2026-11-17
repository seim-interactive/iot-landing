import { createRouter, createWebHistory, START_LOCATION } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'landing',
    component: () => import('@/views/Landing.vue'),
  },
  // Zona cliente ------------------------------------------------------------
  {
    path: '/brief',
    name: 'brief-gate',
    component: () => import('@/views/BriefGate.vue'),
  },
  {
    // sessionId = hash del codigo. Se llega aca despues de validar en el gate.
    path: '/brief/:sessionId',
    name: 'brief-wizard',
    component: () => import('@/views/BriefWizard.vue'),
  },
  // Zona admin --------------------------------------------------------------
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('@/views/AdminLogin.vue'),
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/views/AdminDashboard.vue'),
    meta: { requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'admin-responses',
        component: () => import('@/views/AdminResponses.vue'),
      },
      {
        path: 'forms',
        name: 'admin-forms',
        component: () => import('@/views/AdminForms.vue'),
      },
      {
        path: 'forms/:templateId',
        name: 'admin-form-edit',
        component: () => import('@/views/AdminFormBuilder.vue'),
      },
      {
        path: 'clients',
        name: 'admin-clients',
        component: () => import('@/views/AdminClients.vue'),
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from) {
    // En la primera carga manda el navegador: respeta el #ancla del link o el scroll
    // al recargar, en vez de saltar arriba cuando termina de cargar el JS.
    if (from === START_LOCATION) return false
    return { top: 0 }
  },
  routes,
})

// Guard: las rutas de admin requieren un usuario logueado con email/password.
// Firebase se carga recién al entrar a una ruta de admin: la landing no depende de él
// (ni de sus credenciales) para renderizar.
router.beforeEach(async (to) => {
  if (!to.meta.requiresAdmin) return true
  const { waitForAuth, isAdmin } = await import('@/services/auth')
  await waitForAuth()
  if (!isAdmin()) {
    return { name: 'admin-login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
