<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { ApiError } from '@/api/client'
import type { ServiceCategory } from '@/api/serviceCategories'
import { useAuthStore } from '@/stores/auth'
import { useServiceCategoriesStore } from '@/stores/serviceCategories'

const auth = useAuthStore()
const categories = useServiceCategoriesStore()
const router = useRouter()

const editingId = ref<number | null>(null)
const formError = ref<string | null>(null)
const saving = ref(false)

const form = reactive({
  name: '',
})

function resetForm() {
  editingId.value = null
  form.name = ''
  formError.value = null
}

function startEdit(category: ServiceCategory) {
  editingId.value = category.id
  form.name = category.name
  formError.value = null
}

async function handleAuthError(err: unknown) {
  if (err instanceof ApiError && err.status === 401) {
    auth.logout()
    await router.push({ name: 'login' })
  }
}

async function load() {
  try {
    await categories.fetchAll()
  } catch (err) {
    await handleAuthError(err)
  }
}

async function onSubmit() {
  formError.value = null
  if (!form.name.trim()) {
    formError.value = 'Name is required.'
    return
  }

  const payload = { name: form.name.trim() }

  saving.value = true
  try {
    if (editingId.value) {
      await categories.update(editingId.value, payload)
    } else {
      await categories.create(payload)
    }
    resetForm()
    await categories.fetchAll()
  } catch (err) {
    await handleAuthError(err)
    formError.value = err instanceof ApiError ? 'Could not save category.' : 'Save failed.'
  } finally {
    saving.value = false
  }
}

async function onDelete(category: ServiceCategory) {
  if (!confirm(`Delete category “${category.name}”?`)) return
  try {
    await categories.remove(category.id)
    if (editingId.value === category.id) resetForm()
  } catch (err) {
    await handleAuthError(err)
  }
}

async function onSearch() {
  await load()
}

onMounted(() => {
  void load()
})
</script>

<template>
  <section class="categories">
    <header class="page-header">
      <div>
        <h1>Service categories</h1>
        <p>Group services by category name.</p>
      </div>
    </header>

    <form class="toolbar" @submit.prevent="onSearch">
      <input v-model="categories.search" type="search" placeholder="Search name" />
      <button type="submit">Search</button>
      <button type="button" class="ghost" @click="categories.search = ''; load()">Clear</button>
    </form>

    <p v-if="categories.error" class="error">{{ categories.error }}</p>
    <p v-if="categories.loading">Loading…</p>

    <div class="layout">
      <form class="panel form" @submit.prevent="onSubmit">
        <h2>{{ editingId ? `Edit #${editingId}` : 'New category' }}</h2>

        <label>
          Name *
          <input v-model="form.name" type="text" required />
        </label>

        <p v-if="formError" class="error">{{ formError }}</p>

        <div class="actions">
          <button type="submit" :disabled="saving">
            {{ saving ? 'Saving…' : editingId ? 'Update' : 'Create' }}
          </button>
          <button v-if="editingId" type="button" class="ghost" @click="resetForm">Cancel</button>
        </div>
      </form>

      <div class="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!categories.loading && categories.items.length === 0">
              <td colspan="3">No categories yet.</td>
            </tr>
            <tr v-for="category in categories.items" :key="category.id">
              <td>{{ category.id }}</td>
              <td>{{ category.name }}</td>
              <td class="row-actions">
                <button type="button" class="ghost" @click="startEdit(category)">Edit</button>
                <button type="button" class="danger" @click="onDelete(category)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<style scoped>
.page-header {
  margin-bottom: 1.25rem;
}

h1 {
  margin: 0 0 0.35rem;
}

.page-header p {
  margin: 0;
  color: var(--color-text);
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.layout {
  display: grid;
  gap: 1rem;
}

@media (min-width: 960px) {
  .layout {
    grid-template-columns: 320px 1fr;
    align-items: start;
  }
}

.panel {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-background-soft);
  padding: 1rem;
}

.form {
  display: grid;
  gap: 0.75rem;
}

.form h2 {
  margin: 0;
  font-size: 1.1rem;
}

label {
  display: grid;
  gap: 0.35rem;
  font-size: 0.92rem;
}

input {
  padding: 0.5rem 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
  color: var(--color-text);
  font: inherit;
}

.actions,
.row-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

button {
  padding: 0.5rem 0.8rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
  cursor: pointer;
}

button.ghost {
  background: transparent;
}

button.danger {
  color: #b42318;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

th,
td {
  text-align: left;
  padding: 0.55rem 0.4rem;
  border-bottom: 1px solid var(--color-border);
  vertical-align: top;
}

.error {
  color: #b42318;
}
</style>
