<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const form = reactive({
  username: '',
  password: '',
})

const localError = ref<string | null>(null)

async function onSubmit() {
  localError.value = null
  try {
    await auth.login(form.username.trim(), form.password)
    await router.push({ name: 'clients' })
  } catch {
    localError.value = auth.error ?? 'Login failed'
  }
}
</script>

<template>
  <section class="login">
    <h1>Glass Factor System</h1>
    <p class="lede">Sign in with your username and password.</p>

    <form class="card" @submit.prevent="onSubmit">
      <label>
        Username
        <input v-model="form.username" type="text" autocomplete="username" required />
      </label>

      <label>
        Password
        <input
          v-model="form.password"
          type="password"
          autocomplete="current-password"
          required
        />
      </label>

      <p v-if="localError" class="error">{{ localError }}</p>

      <button type="submit" :disabled="auth.loading">
        {{ auth.loading ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>
  </section>
</template>

<style scoped>
.login {
  max-width: 420px;
  margin: 3rem auto 0;
}

h1 {
  margin: 0 0 0.4rem;
  font-size: 1.8rem;
}

.lede {
  margin: 0 0 1.5rem;
  color: var(--color-text);
}

.card {
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-background-soft);
}

label {
  display: grid;
  gap: 0.4rem;
  font-size: 0.95rem;
}

input {
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
  color: var(--color-text);
}

button {
  padding: 0.65rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
  cursor: pointer;
  font-weight: 600;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  margin: 0;
  color: #b42318;
}
</style>
