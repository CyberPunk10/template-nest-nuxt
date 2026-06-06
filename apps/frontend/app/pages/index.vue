<script setup lang="ts">
import { UiCard, UiButton } from '@repo/ui'

interface User {
  id: string
  name: string
  email: string
}

const { t, locale, locales, setLocale } = useI18n()
const { get, post, put, del } = useApi()
const { data: users, refresh } = await get<User[]>('/users')

const form = reactive({ name: '', email: '' })
const creating = ref(false)
const error = ref('')

const editingId = ref<string | null>(null)
const editForm = reactive({ name: '', email: '' })
const editError = ref('')

const removeError = ref('')

function startEdit(user: User) {
  editingId.value = user.id
  editForm.name = user.name
  editForm.email = user.email
  editError.value = ''
}

function cancelEdit() {
  editingId.value = null
}

async function saveEdit(id: string) {
  editError.value = ''
  try {
    await put<User>(`/users/${id}`, { name: editForm.name, email: editForm.email })
    editingId.value = null
    await refresh()
  } catch (e: unknown) {
    const data = (e as { data?: { message?: string[] } }).data
    editError.value = data?.message?.join(', ') ?? t('users.error')
  }
}

async function createUser() {
  error.value = ''
  creating.value = true
  try {
    await post<User>('/users', { name: form.name, email: form.email })
    form.name = ''
    form.email = ''
    await refresh()
  } catch (e: unknown) {
    const data = (e as { data?: { message?: string[] } }).data
    error.value = data?.message?.join(', ') ?? t('users.error')
  } finally {
    creating.value = false
  }
}

async function removeUser(id: string) {
  removeError.value = ''
  try {
    await del(`/users/${id}`)
    await refresh()
  } catch (e: unknown) {
    const data = (e as { data?: { message?: string[] } }).data
    removeError.value = data?.message?.join(', ') ?? t('users.error')
  }
}
</script>

<template>
  <div class="home">
    <div class="col">
      <NuxtWelcome />
    </div>

    <div class="col">
      <div class="col__header">
        <h2 class="col__heading">
          {{ t('users.title') }} <span class="col__heading-sub">← {{ t('users.subtitle') }}</span>
        </h2>
        <div class="locale-switcher">
          <button
            v-for="loc in locales"
            :key="loc.code"
            class="locale-btn"
            :class="{ 'locale-btn--active': locale === loc.code }"
            @click="setLocale(loc.code)"
          >
            {{ loc.code.toUpperCase() }}
          </button>
        </div>
      </div>

      <UiCard :title="t('users.create')">
        <form class="form" @submit.prevent="createUser">
          <input v-model="form.name" class="form__input" :placeholder="t('users.name')" />
          <input v-model="form.email" class="form__input" placeholder="Email" />
          <p v-if="error" class="form__error">{{ error }}</p>
          <UiButton type="submit" :disabled="creating">
            {{ creating ? t('users.adding') : t('users.add') }}
          </UiButton>
        </form>
      </UiCard>

      <UiCard :title="t('users.list')">
        <div v-if="!users?.length" class="empty">{{ t('users.empty') }}</div>
        <div v-else class="users">
          <div v-for="user in users" :key="user.id" class="user">
            <template v-if="editingId === user.id">
              <form class="user__edit" @submit.prevent="saveEdit(user.id)">
                <input
                  v-model="editForm.name"
                  class="form__input form__input--sm"
                  :placeholder="t('users.name')"
                />
                <input
                  v-model="editForm.email"
                  class="form__input form__input--sm"
                  placeholder="Email"
                />
                <p v-if="editError" class="form__error">{{ editError }}</p>
                <div class="user__edit-actions">
                  <UiButton type="submit" variant="ghost">
                    <Icon name="lucide:check" size="14" />
                  </UiButton>
                  <UiButton variant="ghost" @click="cancelEdit">
                    <Icon name="lucide:x" size="14" />
                  </UiButton>
                </div>
              </form>
            </template>
            <template v-else>
              <div class="user__info" @click="startEdit(user)">
                <span class="user__name">{{ user.name }}</span>
                <span class="user__email">{{ user.email }}</span>
              </div>
              <UiButton variant="danger" @click="removeUser(user.id)">
                <Icon name="lucide:trash-2" size="14" />
              </UiButton>
            </template>
          </div>
        </div>
        <p v-if="removeError" class="form__error">{{ removeError }}</p>
      </UiCard>
    </div>
  </div>
</template>

<style scoped>
.home {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 0;
  min-height: 100%;
  background: #0f172a;
  color: #fff;
}

.col {
  border-right: 1px solid #1e293b;
  overflow: auto;
}

.col:last-child {
  border-right: none;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.col__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.col__heading {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #888;
  margin: 0;
}

.col__heading-sub {
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  color: #475569;
  font-style: italic;
}

.locale-switcher {
  display: flex;
  gap: 2px;
}

.locale-btn {
  background: transparent;
  border: 1px solid #1e293b;
  border-radius: 6px;
  color: #475569;
  font-size: 10px;
  font-weight: 600;
  padding: 3px 6px;
  cursor: pointer;
  transition:
    border-color 0.15s,
    color 0.15s;
}

.locale-btn:hover {
  border-color: #475569;
  color: #94a3b8;
}

.locale-btn--active {
  border-color: #00dc82;
  color: #00dc82;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form__input {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: #e2e8f0;
  outline: none;
  transition: border-color 0.2s;
}

.form__input:focus {
  border-color: #00dc82;
}

.form__error {
  font-size: 12px;
  color: #ef4444;
  margin: 0;
}

.empty {
  font-size: 13px;
  color: #475569;
}

.users {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.user__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
  cursor: pointer;
  border-radius: 6px;
  padding: 4px 6px;
  margin: -4px -6px;
  transition: background 0.15s;
}

.user__info:hover {
  background: rgba(255, 255, 255, 0.04);
}

.user__edit {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.user__edit-actions {
  display: flex;
  gap: 4px;
}

.form__input--sm {
  padding: 5px 10px;
  font-size: 12px;
}

.user__name {
  font-size: 13px;
  color: #e2e8f0;
  text-transform: capitalize;
}

.user__email {
  font-size: 11px;
  color: #475569;
}
</style>
