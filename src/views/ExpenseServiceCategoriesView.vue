<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { ApiError } from '@/api/client'
import type { ExpenseServiceCategory } from '@/api/expenseServiceCategories'
import UiButton from '@/components/ui/UiButton.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiDialog from '@/components/ui/UiDialog.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiLabel from '@/components/ui/UiLabel.vue'
import { useAuthStore } from '@/stores/auth'
import { useExpenseServiceCategoriesStore } from '@/stores/expenseServiceCategories'

const auth = useAuthStore()
const categories = useExpenseServiceCategoriesStore()
const router = useRouter()

const dialogOpen = ref(false)
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

function openCreate() {
  resetForm()
  dialogOpen.value = true
}

function openEdit(category: ExpenseServiceCategory) {
  editingId.value = category.id
  form.name = category.name
  formError.value = null
  dialogOpen.value = true
}

function closeDialog() {
  dialogOpen.value = false
  resetForm()
}

async function handleAuthError(err: unknown) {
  if (err instanceof ApiError && err.status === 401) {
    auth.logout()
    await router.push({ name: 'login' })
  }
}

async function load() {
  try {
    categories.search = ''
    await categories.fetchAll()
  } catch (err) {
    await handleAuthError(err)
  }
}

async function onSubmit() {
  formError.value = null
  if (!form.name.trim()) {
    formError.value = 'الاسم مطلوب.'
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
    closeDialog()
    await categories.fetchAll()
  } catch (err) {
    await handleAuthError(err)
    formError.value = err instanceof ApiError ? 'تعذّر حفظ قسم الخدمات (المصروفات).' : 'فشل الحفظ.'
  } finally {
    saving.value = false
  }
}

async function onDelete(category: ExpenseServiceCategory) {
  if (!confirm(`حذف القسم «${category.name}»؟`)) return

  try {
    await categories.remove(category.id)
    if (editingId.value === category.id) closeDialog()
  } catch (err) {
    await handleAuthError(err)
  }
}

onMounted(() => {
  void load()
})
</script>

<template>
  <section>
    <header class="page-header">
      <div>
        <h1>أقسام خدمات المصروفات</h1>
        <p>إدارة الأقسام المستخدمة عند إضافة مصروف من نوع "خدمات"</p>
      </div>
      <UiButton @click="openCreate">إضافة قسم</UiButton>
    </header>

    <p v-if="categories.error" class="ui-error">{{ categories.error }}</p>

    <UiCard>
      <div class="ui-table-wrap">
        <table class="ui-table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>تاريخ الإضافة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="categories.loading">
              <td colspan="3" class="ui-empty">جارٍ التحميل…</td>
            </tr>
            <tr v-else-if="categories.items.length === 0">
              <td colspan="3" class="ui-empty">لا توجد أقسام بعد.</td>
            </tr>
            <tr v-for="category in categories.items" :key="category.id">
              <td>{{ category.name }}</td>
              <td>{{ new Date(category.created_at).toLocaleDateString('ar-EG') }}</td>
              <td>
                <div class="row-actions">
                  <UiButton variant="outline" size="sm" @click="openEdit(category)">تعديل</UiButton>
                  <UiButton variant="destructive" size="sm" @click="onDelete(category)">حذف</UiButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>

    <UiDialog
      v-model:open="dialogOpen"
      :title="editingId ? 'تعديل قسم' : 'قسم جديد'"
      description="أدخل اسم قسم خدمات المصروفات."
    >
      <form @submit.prevent="onSubmit">
        <div class="ui-field">
          <UiLabel html-for="category-name">الاسم</UiLabel>
          <UiInput id="category-name" v-model="form.name" required />
        </div>

        <p v-if="formError" class="ui-error">{{ formError }}</p>

        <div class="ui-dialog-footer">
          <UiButton type="submit" :disabled="saving">
            {{ saving ? 'جارٍ الحفظ…' : editingId ? 'تحديث' : 'حفظ' }}
          </UiButton>
          <UiButton type="button" variant="outline" @click="closeDialog">إلغاء</UiButton>
        </div>
      </form>
    </UiDialog>
  </section>
</template>
