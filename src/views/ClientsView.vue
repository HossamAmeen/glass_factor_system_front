<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { ApiError } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useClientsStore } from '@/stores/clients'
import type { Client } from '@/api/clients'

const auth = useAuthStore()
const clients = useClientsStore()
const router = useRouter()

const editingId = ref<number | null>(null)
const formError = ref<string | null>(null)
const saving = ref(false)

const form = reactive({
  name: '',
  phone: '',
  email: '',
  address: '',
  note: '',
})

function resetForm() {
  editingId.value = null
  form.name = ''
  form.phone = ''
  form.email = ''
  form.address = ''
  form.note = ''
  formError.value = null
}

function startEdit(client: Client) {
  editingId.value = client.id
  form.name = client.name
  form.phone = client.phone
  form.email = client.email
  form.address = client.address
  form.note = client.note
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
    await clients.fetchAll()
  } catch (err) {
    await handleAuthError(err)
  }
}

async function onSubmit() {
  formError.value = null
  if (!form.name.trim() || !form.phone.trim()) {
    formError.value = 'Name and phone are required.'
    return
  }

  const payload = {
    name: form.name.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    address: form.address.trim(),
    note: form.note.trim(),
  }

  saving.value = true
  try {
    if (editingId.value) {
      await clients.update(editingId.value, payload)
    } else {
      await clients.create(payload)
    }
    resetForm()
    await clients.fetchAll()
  } catch (err) {
    await handleAuthError(err)
    formError.value = err instanceof ApiError ? 'Could not save client.' : 'Save failed.'
  } finally {
    saving.value = false
  }
}

async function onDelete(client: Client) {
  if (!confirm(`Delete client “${client.name}”?`)) return
  try {
    await clients.remove(client.id)
    if (editingId.value === client.id) resetForm()
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
  <section class="clients">
    <header class="page-header">
      <div>
        <h1>Clients</h1>
        <p>Manage client records (name, phone, optional email/address/note).</p>
      </div>
    </header>

    <form class="toolbar" @submit.prevent="onSearch">
      <input v-model="clients.search" type="search" placeholder="Search name, phone, email" />
      <button type="submit">Search</button>
      <button type="button" class="ghost" @click="clients.search = ''; load()">Clear</button>
    </form>

    <p v-if="clients.error" class="error">{{ clients.error }}</p>
    <p v-if="clients.loading">Loading…</p>

    <div class="layout">
      <form class="panel form" @submit.prevent="onSubmit">
        <h2>{{ editingId ? `Edit #${editingId}` : 'New client' }}</h2>

        <label>
          Name *
          <input v-model="form.name" type="text" required />
        </label>
        <label>
          Phone *
          <input v-model="form.phone" type="text" required />
        </label>
        <label>
          Email
          <input v-model="form.email" type="email" />
        </label>
        <label>
          Address
          <textarea v-model="form.address" rows="2" />
        </label>
        <label>
          Note
          <textarea v-model="form.note" rows="2" />
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
              <th>Phone</th>
              <th>Email</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!clients.loading && clients.items.length === 0">
              <td colspan="5">No clients yet.</td>
            </tr>
            <tr v-for="client in clients.items" :key="client.id">
              <td>{{ client.id }}</td>
              <td>{{ client.name }}</td>
              <td>{{ client.phone }}</td>
              <td>{{ client.email || '—' }}</td>
              <td class="row-actions">
                <button type="button" class="ghost" @click="startEdit(client)">Edit</button>
                <button type="button" class="danger" @click="onDelete(client)">Delete</button>
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

input,
textarea {
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
