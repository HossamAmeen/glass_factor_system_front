<script setup lang="ts">
import { onMounted } from 'vue'

import { useHealthStore } from '@/stores/health'

const health = useHealthStore()

onMounted(() => {
  void health.check()
})
</script>

<template>
  <section class="home">
    <h1>Glass Factor System</h1>
    <p class="lede">Vue frontend wired to the Django REST API.</p>

    <div class="status-panel">
      <h2>Backend health</h2>

      <p v-if="health.loading">Checking API…</p>
      <p v-else-if="health.error" class="error">{{ health.error }}</p>
      <p v-else-if="health.data" class="ok">
        {{ health.data.service }} — {{ health.data.status }}
      </p>

      <button type="button" :disabled="health.loading" @click="health.check()">
        Recheck
      </button>
    </div>
  </section>
</template>

<style scoped>
.home h1 {
  margin: 0 0 0.5rem;
  font-size: 2rem;
}

.lede {
  margin: 0 0 2rem;
  color: var(--color-text);
}

.status-panel {
  padding: 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-background-soft);
}

.status-panel h2 {
  margin: 0 0 0.75rem;
  font-size: 1.1rem;
}

.ok {
  color: #1b7f4a;
}

.error {
  color: #b42318;
}

button {
  margin-top: 0.75rem;
  padding: 0.5rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
