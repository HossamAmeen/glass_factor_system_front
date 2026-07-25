<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { ApiError } from '@/api/client'
import type { Service } from '@/api/services'
import { useAuthStore } from '@/stores/auth'
import { useServiceCategoriesStore } from '@/stores/serviceCategories'
import { useServicesStore } from '@/stores/services'

const auth = useAuthStore()
const services = useServicesStore()
const categories = useServiceCategoriesStore()
const router = useRouter()

const editingId = ref<number | null>(null)
const formError = ref<string | null>(null)
const saving = ref(false)

const form = reactive({
  name: '',
  service_category: '' as string | number,
  cost: '',
  is_fixed_cost: false,
  is_additional_service: false,
})

function resetForm() {
  editingId.value = null
  form.name = ''
  form.service_category = ''
  form.cost = ''
  form.is_fixed_cost = false
  form.is_additional_service = false
  formError.value = null
}

function startEdit(service: Service) {
  editingId.value = service.id
  form.name = service.name
  form.service_category = service.service_category
  form.cost = service.cost
  form.is_fixed_cost = service.is_fixed_cost
  form.is_additional_service = service.is_additional_service
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
    await Promise.all([services.fetchAll(), categories.fetchAll()])
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
  if (form.service_category === '' || form.service_category == null) {
    formError.value = 'Service category is required.'
    return
  }
  if (!form.cost.trim()) {
    formError.value = 'Cost is required.'
    return
  }

  const payload = {
    name: form.name.trim(),
    service_category: Number(form.service_category),
    cost: form.cost.trim(),
    is_fixed_cost: form.is_fixed_cost,
    is_additional_service: form.is_additional_service,
  }

  saving.value = true
  try {
    if (editingId.value) {
      await services.update(editingId.value, payload)
    } else {
      await services.create(payload)
    }
    resetForm()
    await services.fetchAll()
  } catch (err) {
    await handleAuthError(err)
    formError.value = err instanceof ApiError ? 'Could not save service.' : 'Save failed.'
  } finally {
    saving.value = false
  }
}

async function onDelete(service: Service) {
  if (!confirm(`Delete service “${service.name}”?`)) return
  try {
    await services.remove(service.id)
    if (editingId.value === service.id) resetForm()
  } catch (err) {
    await handleAuthError(err)
  }
}

async function onSearch() {
  try {
    await services.fetchAll()
  } catch (err) {
    await handleAuthError(err)
  }
}

onMounted(() => {
  void load()
})
</script>

<template>
  <section class="services">
    <header class="page-header">
      <div>
        <h1>Services</h1>
        <p>Manage services with category, cost, and cost flags.</p>
      </div>
    </header>

    <form class="toolbar" @submit.prevent="onSearch">
      <input v-model="services.search" type="search" placeholder="Search name or category" />
      <select v-model="services.categoryFilter">
        <option :value="null">All categories</option>
        <option v-for="category in categories.items" :key="category.id" :value="category.id">
          {{ category.name }}
        </option>
      </select>
      <button type="submit">Search</button>
      <button
        type="button"
        class="ghost"
        @click="
          services.search = '';
          services.categoryFilter = null;
          onSearch()
        "
      >
        Clear
      </button>
    </form>

    <p v-if="services.error" class="error">{{ services.error }}</p>
    <p v-if="services.loading">Loading…</p>

    <div class="layout">
      <form class="panel form" @submit.prevent="onSubmit">
        <h2>{{ editingId ? `Edit #${editingId}` : 'New service' }}</h2>

        <label>
          Name *
          <input v-model="form.name" type="text" required />
        </label>
        <label>
          Service category *
          <select v-model="form.service_category" required>
            <option disabled value="">Select category</option>
            <option v-for="category in categories.items" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </label>
        <label>
          Cost *
          <input v-model="form.cost" type="number" min="0" step="0.01" required />
        </label>
        <label class="checkbox">
          <input v-model="form.is_fixed_cost" type="checkbox" />
          Fixed cost
        </label>
        <label class="checkbox">
          <input v-model="form.is_additional_service" type="checkbox" />
          Additional service
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
              <th>Category</th>
              <th>Cost</th>
              <th>Fixed</th>
              <th>Additional</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!services.loading && services.items.length === 0">
              <td colspan="7">No services yet.</td>
            </tr>
            <tr v-for="service in services.items" :key="service.id">
              <td>{{ service.id }}</td>
              <td>{{ service.name }}</td>
              <td>{{ service.service_category_name }}</td>
              <td>{{ service.cost }}</td>
              <td>{{ service.is_fixed_cost ? 'Yes' : 'No' }}</td>
              <td>{{ service.is_additional_service ? 'Yes' : 'No' }}</td>
              <td class="row-actions">
                <button type="button" class="ghost" @click="startEdit(service)">Edit</button>
                <button type="button" class="danger" @click="onDelete(service)">Delete</button>
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

label.checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

input,
select {
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
