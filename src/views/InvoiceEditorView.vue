<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ApiError } from '@/api/client'
import type { CostMethod } from '@/api/invoices'
import type { Service } from '@/api/services'
import UiButton from '@/components/ui/UiButton.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiLabel from '@/components/ui/UiLabel.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import UiTextarea from '@/components/ui/UiTextarea.vue'
import { useAuthStore } from '@/stores/auth'
import { useClientsStore } from '@/stores/clients'
import { useInvoicesStore } from '@/stores/invoices'
import { useServiceCategoriesStore } from '@/stores/serviceCategories'
import { useServicesStore } from '@/stores/services'

const props = defineProps<{ id?: string }>()

const auth = useAuthStore()
const invoices = useInvoicesStore()
const clients = useClientsStore()
const categories = useServiceCategoriesStore()
const services = useServicesStore()
const router = useRouter()
const route = useRoute()

const headerError = ref<string | null>(null)
const itemError = ref<string | null>(null)
const savingHeader = ref(false)
const savingItem = ref(false)
const acting = ref(false)

const header = reactive({
  client: '' as string | number,
  discount_amount: '0',
  notes: '',
  issue_date: new Date().toISOString().slice(0, 10),
})

const itemForm = reactive({
  category: '' as string | number,
  service: '' as string | number,
  unit_price: '',
  quantity: '',
  length: '',
  width: '',
  discount_amount: '0',
})

const invoice = computed(() => invoices.current)
const isNew = computed(() => !props.id && !invoice.value?.id)
const isDraft = computed(() => !invoice.value || invoice.value.status === 'draft')
const editable = computed(() => isNew.value || isDraft.value)

const filteredServices = computed(() => {
  if (itemForm.category === '' || itemForm.category == null) return services.items
  return services.items.filter((s) => s.service_category === Number(itemForm.category))
})

const selectedService = computed(() =>
  services.items.find((s) => s.id === Number(itemForm.service)),
)

const costMethodLabels: Record<CostMethod, string> = {
  fixed: 'ثابت',
  quantity: 'كمية',
  perimeter: 'محيط',
  area: 'مساحة',
}

const statusLabels = {
  draft: 'مسودة',
  confirmed: 'مؤكدة',
  cancelled: 'ملغاة',
} as const

async function handleAuthError(err: unknown) {
  if (err instanceof ApiError && err.status === 401) {
    auth.logout()
    await router.push({ name: 'login' })
  }
}

function apiErrorMessage(err: unknown, fallback: string) {
  if (err instanceof ApiError && err.body && typeof err.body === 'object') {
    const body = err.body as Record<string, unknown>
    const first = Object.values(body)[0]
    if (Array.isArray(first)) return String(first[0])
    if (typeof first === 'string') return first
  }
  return fallback
}

function resetItemForm() {
  itemForm.category = categories.items[0]?.id ?? ''
  itemForm.service = ''
  itemForm.unit_price = ''
  itemForm.quantity = ''
  itemForm.length = ''
  itemForm.width = ''
  itemForm.discount_amount = '0'
  itemError.value = null
}

function onServiceChange() {
  const service = selectedService.value
  if (!service) return
  itemForm.unit_price = service.cost
  itemForm.category = service.service_category
}

watch(
  () => itemForm.service,
  () => onServiceChange(),
)

async function loadLookups() {
  await Promise.all([clients.fetchAll(), categories.fetchAll(), services.fetchAll()])
  if (!header.client && clients.items[0]) header.client = clients.items[0].id
  if (!itemForm.category && categories.items[0]) {
    itemForm.category = categories.items[0].id
  }
}

async function loadInvoice(id: number) {
  const data = await invoices.fetchOne(id)
  header.client = data.client
  header.discount_amount = data.discount_amount
  header.notes = data.notes
  header.issue_date = data.issue_date
}

async function saveAndContinue() {
  if (savingHeader.value) return
  headerError.value = null
  if (header.client === '' || header.client == null) {
    headerError.value = 'العميل مطلوب.'
    return
  }
  savingHeader.value = true
  try {
    if (isNew.value) {
      const created = await invoices.create({
        client: Number(header.client),
        discount_amount: header.discount_amount || '0',
        notes: header.notes,
        issue_date: header.issue_date,
      })
      await router.replace({ name: 'invoice-edit', params: { id: created.id } })
    } else if (invoice.value) {
      await invoices.updateHeader(invoice.value.id, {
        client: Number(header.client),
        discount_amount: header.discount_amount || '0',
        notes: header.notes,
        issue_date: header.issue_date,
      })
    }
  } catch (err) {
    await handleAuthError(err)
    headerError.value = apiErrorMessage(err, 'تعذر حفظ الفاتورة.')
  } finally {
    savingHeader.value = false
  }
}

function needsQuantity(method?: CostMethod) {
  return method === 'quantity'
}
function needsDims(method?: CostMethod) {
  return method === 'perimeter' || method === 'area'
}

async function addItem() {
  if (savingItem.value || !invoice.value || !editable.value) return
  itemError.value = null
  const service = selectedService.value
  if (!service) {
    itemError.value = 'اختر خدمة.'
    return
  }
  if (!itemForm.unit_price) {
    itemError.value = 'السعر مطلوب.'
    return
  }
  if (needsQuantity(service.cost_method) && !itemForm.quantity) {
    itemError.value = 'الكمية مطلوبة.'
    return
  }
  if (needsDims(service.cost_method) && (!itemForm.length || !itemForm.width)) {
    itemError.value = 'الطول والعرض مطلوبان.'
    return
  }

  savingItem.value = true
  try {
    await invoices.addItem(invoice.value.id, {
      service: service.id,
      unit_price: itemForm.unit_price,
      quantity: itemForm.quantity || undefined,
      length: itemForm.length || undefined,
      width: itemForm.width || undefined,
      discount_amount: itemForm.discount_amount || '0',
    })
    resetItemForm()
  } catch (err) {
    await handleAuthError(err)
    itemError.value = apiErrorMessage(err, 'تعذر إضافة البند.')
  } finally {
    savingItem.value = false
  }
}

async function removeItem(itemId: number) {
  if (!invoice.value || !editable.value || acting.value) return
  acting.value = true
  try {
    await invoices.removeItem(invoice.value.id, itemId)
  } catch (err) {
    await handleAuthError(err)
    itemError.value = apiErrorMessage(err, 'تعذر حذف البند.')
  } finally {
    acting.value = false
  }
}

async function confirm() {
  if (!invoice.value || acting.value) return
  if (!invoice.value.items.length) {
    itemError.value = 'أضف بندًا واحدًا على الأقل قبل التأكيد.'
    return
  }
  acting.value = true
  try {
    await invoices.confirm(invoice.value.id)
  } catch (err) {
    await handleAuthError(err)
    itemError.value = apiErrorMessage(err, 'تعذر تأكيد الفاتورة.')
  } finally {
    acting.value = false
  }
}

async function cancel() {
  if (!invoice.value || acting.value) return
  acting.value = true
  try {
    await invoices.cancel(invoice.value.id)
  } catch (err) {
    await handleAuthError(err)
    itemError.value = apiErrorMessage(err, 'تعذر إلغاء الفاتورة.')
  } finally {
    acting.value = false
  }
}

function measureLabel(service: Service) {
  return costMethodLabels[service.cost_method]
}

onMounted(async () => {
  try {
    await loadLookups()
    const routeId = props.id ?? (route.params.id as string | undefined)
    if (routeId) await loadInvoice(Number(routeId))
    else invoices.current = null
  } catch (err) {
    await handleAuthError(err)
  }
})

watch(
  () => props.id,
  async (id) => {
    if (id) {
      try {
        await loadInvoice(Number(id))
      } catch (err) {
        await handleAuthError(err)
      }
    }
  },
)
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>{{ isNew ? 'فاتورة جديدة' : invoice?.number }}</h1>
        <p v-if="invoice" class="muted">
          الحالة:
          <span class="pill" :data-status="invoice.status">
            {{ statusLabels[invoice.status] }}
          </span>
        </p>
        <p v-else class="muted">أدخل العميل ثم احفظ للمتابعة وإضافة البنود</p>
      </div>
      <UiButton variant="outline" @click="router.push({ name: 'invoices' })">
        رجوع
      </UiButton>
    </header>

    <UiCard>
      <h2 class="section-title">رأس الفاتورة</h2>
      <div class="grid">
        <div>
          <UiLabel>العميل</UiLabel>
          <UiSelect v-model="header.client" :disabled="!editable">
            <option disabled value="">اختر عميلًا</option>
            <option v-for="c in clients.items" :key="c.id" :value="c.id">
              {{ c.name }} — {{ c.phone }}
            </option>
          </UiSelect>
        </div>
        <div>
          <UiLabel>التاريخ</UiLabel>
          <UiInput v-model="header.issue_date" type="date" :disabled="!editable" />
        </div>
        <div>
          <UiLabel>خصم الفاتورة</UiLabel>
          <UiInput v-model="header.discount_amount" type="number" min="0" step="0.01" :disabled="!editable" />
        </div>
        <div class="full">
          <UiLabel>ملاحظات</UiLabel>
          <UiTextarea v-model="header.notes" :disabled="!editable" :rows="2" />
        </div>
      </div>
      <p v-if="headerError" class="error">{{ headerError }}</p>
      <div v-if="editable" class="actions">
        <UiButton :disabled="savingHeader" @click="saveAndContinue">
          {{ savingHeader ? 'جاري الحفظ...' : isNew ? 'حفظ ومتابعة' : 'حفظ الرأس' }}
        </UiButton>
      </div>
    </UiCard>

    <template v-if="invoice">
      <UiCard>
        <h2 class="section-title">بنود الفاتورة</h2>

        <div class="items">
          <article v-for="item in invoice.items" :key="item.id" class="item-card">
            <div>
              <strong>{{ item.service_name }}</strong>
              <p class="muted">
                {{ costMethodLabels[item.cost_method] }} · سعر {{ item.unit_price }}
                <template v-if="item.quantity"> · كمية {{ item.quantity }}</template>
                <template v-if="item.length != null">
                  · {{ item.length }}×{{ item.width }}
                </template>
              </p>
            </div>
            <div class="item-total">
              <span>{{ item.line_total }}</span>
              <UiButton
                v-if="editable"
                variant="outline"
                :disabled="acting"
                @click="removeItem(item.id)"
              >
                حذف
              </UiButton>
            </div>
          </article>
          <p v-if="!invoice.items.length" class="muted">لا توجد بنود بعد.</p>
        </div>

        <div v-if="editable" class="item-form">
          <h3>إضافة بند</h3>
          <div class="grid">
            <div>
              <UiLabel>تصنيف (فلتر)</UiLabel>
              <UiSelect v-model="itemForm.category">
                <option value="">الكل</option>
                <option v-for="cat in categories.items" :key="cat.id" :value="cat.id">
                  {{ cat.name }}
                </option>
              </UiSelect>
            </div>
            <div>
              <UiLabel>الخدمة</UiLabel>
              <UiSelect v-model="itemForm.service">
                <option disabled value="">اختر خدمة</option>
                <option v-for="s in filteredServices" :key="s.id" :value="s.id">
                  {{ s.name }} — {{ measureLabel(s) }}
                </option>
              </UiSelect>
            </div>
            <div>
              <UiLabel>السعر</UiLabel>
              <UiInput v-model="itemForm.unit_price" type="number" min="0" step="0.01" />
            </div>
            <div v-if="selectedService && needsQuantity(selectedService.cost_method)">
              <UiLabel>الكمية</UiLabel>
              <UiInput v-model="itemForm.quantity" type="number" min="0.001" step="0.001" />
            </div>
            <template v-if="selectedService && needsDims(selectedService.cost_method)">
              <div>
                <UiLabel>الطول</UiLabel>
                <UiInput v-model="itemForm.length" type="number" min="0" step="0.001" />
              </div>
              <div>
                <UiLabel>العرض</UiLabel>
                <UiInput v-model="itemForm.width" type="number" min="0" step="0.001" />
              </div>
            </template>
            <div>
              <UiLabel>خصم البند</UiLabel>
              <UiInput v-model="itemForm.discount_amount" type="number" min="0" step="0.01" />
            </div>
          </div>
          <p v-if="itemError" class="error">{{ itemError }}</p>
          <UiButton :disabled="savingItem" @click="addItem">
            {{ savingItem ? 'جاري الإضافة...' : 'إضافة البند' }}
          </UiButton>
        </div>
      </UiCard>

      <UiCard class="summary sticky">
        <h2 class="section-title">الملخص</h2>
        <div class="summary-row"><span>مجموع البنود</span><strong>{{ invoice.subtotal }}</strong></div>
        <div class="summary-row"><span>خصم الفاتورة</span><strong>{{ invoice.discount_amount }}</strong></div>
        <div class="summary-row total"><span>الإجمالي</span><strong>{{ invoice.total }}</strong></div>
        <div class="actions">
          <UiButton
            v-if="invoice.status === 'draft'"
            :disabled="acting || !invoice.items.length"
            @click="confirm"
          >
            تأكيد الفاتورة
          </UiButton>
          <UiButton
            v-if="invoice.status !== 'cancelled'"
            variant="outline"
            :disabled="acting"
            @click="cancel"
          >
            إلغاء الفاتورة
          </UiButton>
        </div>
      </UiCard>
    </template>
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: 1rem;
  padding-bottom: 5rem;
}
.page-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
}
.section-title {
  margin: 0 0 1rem;
  font-size: 1.1rem;
}
.muted {
  color: hsl(var(--muted-foreground));
  margin: 0.35rem 0 0;
}
.error {
  color: hsl(var(--destructive));
}
.grid {
  display: grid;
  gap: 0.85rem;
}
@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .full {
    grid-column: 1 / -1;
  }
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
}
.items {
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}
.item-card {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid hsl(var(--border));
}
.item-total {
  display: grid;
  gap: 0.5rem;
  justify-items: end;
  font-weight: 600;
}
.item-form {
  display: grid;
  gap: 0.85rem;
  padding-top: 0.5rem;
  border-top: 1px solid hsl(var(--border));
}
.item-form h3 {
  margin: 0;
  font-size: 1rem;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0;
}
.summary-row.total {
  font-size: 1.15rem;
  border-top: 1px solid hsl(var(--border));
  margin-top: 0.35rem;
  padding-top: 0.75rem;
}
.pill {
  display: inline-flex;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.8rem;
  background: hsl(var(--muted));
}
.pill[data-status='confirmed'] {
  background: hsl(142 40% 90%);
  color: hsl(142 50% 25%);
}
.pill[data-status='cancelled'] {
  background: hsl(0 40% 92%);
  color: hsl(0 45% 35%);
}
@media (max-width: 767px) {
  .sticky {
    position: sticky;
    bottom: 0.5rem;
    z-index: 5;
  }
}
</style>
