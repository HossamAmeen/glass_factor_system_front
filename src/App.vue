<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

async function onLogout() {
  auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="app-shell">
    <header v-if="auth.isAuthenticated" class="topbar">
      <RouterLink class="brand" to="/clients">Glass Factor System</RouterLink>
      <nav>
        <RouterLink to="/clients">Clients</RouterLink>
        <button type="button" class="logout" @click="onLogout">Logout</button>
      </nav>
    </header>

    <main class="content" :class="{ narrow: !auth.isAuthenticated }">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.brand {
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--color-heading);
  text-decoration: none;
}

nav {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

nav a {
  color: var(--color-text);
  text-decoration: none;
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
}

nav a.router-link-exact-active {
  background: var(--color-background-soft);
  color: var(--color-heading);
}

.logout {
  padding: 0.35rem 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
}

.content {
  flex: 1;
  width: min(1100px, 100%);
  margin: 0 auto;
  padding: 1.5rem;
}

.content.narrow {
  width: min(520px, 100%);
}
</style>
