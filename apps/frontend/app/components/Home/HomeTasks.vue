<script setup lang="ts">
import { UiCard, UiButton } from '@repo/ui'

interface Task {
  id: string
  title: string
  description: string | null
  createdAt: string
  updatedAt: string
}

const { t } = useI18n()
const { $api } = useNuxtApp()

const { data: tasks, refresh } = await useApi<Task[]>('/tasks', { default: () => [] })

const form = reactive({ title: '', description: '' })
const editingId = ref<string | null>(null)
const editForm = reactive({ title: '', description: '' })
const error = ref('')

async function refreshTasks(): Promise<void> {
  await Promise.all([refresh(), refreshNuxtData(QUERY_KEYS.allTasks)])
}

async function createTask() {
  error.value = ''
  try {
    await $api('/tasks', {
      method: 'POST',
      body: { title: form.title, description: form.description || undefined },
    })
    form.title = ''
    form.description = ''
    await refreshTasks()
  } catch {
    error.value = t('tasks.error')
  }
}

function startEdit(item: Task) {
  editingId.value = item.id
  editForm.title = item.title
  editForm.description = item.description ?? ''
}

function cancelEdit() {
  editingId.value = null
}

async function saveEdit(id: string) {
  error.value = ''
  try {
    await $api(`/tasks/${id}`, {
      method: 'PUT',
      body: { title: editForm.title, description: editForm.description || undefined },
    })
    editingId.value = null
    await refreshTasks()
  } catch {
    error.value = t('tasks.error')
  }
}

async function removeTask(id: string) {
  error.value = ''
  try {
    await $api(`/tasks/${id}`, { method: 'DELETE' })
    await refreshTasks()
  } catch {
    error.value = t('tasks.error')
  }
}
</script>

<template>
  <h2 class="heading">
    {{ t('tasks.title') }} <span class="heading-sub">← {{ t('tasks.subtitle') }}</span>
  </h2>

  <UiCard :title="t('tasks.create')">
    <form class="form" @submit.prevent="createTask">
      <input
        v-model="form.title"
        class="form__input"
        :placeholder="t('tasks.titleField')"
        required
      >
      <input
        v-model="form.description"
        class="form__input"
        :placeholder="t('tasks.description')"
      >
      <UiButton type="submit">{{ t('tasks.add') }}</UiButton>
    </form>
  </UiCard>

  <p v-if="error" class="form__error">{{ error }}</p>

  <UiCard :title="t('tasks.list')">
    <div v-if="!tasks?.length" class="empty">{{ t('tasks.empty') }}</div>
    <div v-else class="tasks">
      <div
        v-for="item in tasks"
        :key="item.id"
        class="task"
      >
        <template v-if="editingId === item.id">
          <form class="task__edit" @submit.prevent="saveEdit(item.id)">
            <input
              v-model="editForm.title"
              class="form__input form__input--sm"
              :placeholder="t('tasks.titleField')"
              required
            >
            <input
              v-model="editForm.description"
              class="form__input form__input--sm"
              :placeholder="t('tasks.descriptionField')"
            >
            <div class="task__edit-actions">
              <UiButton
                type="submit"
                isIcon
                variant="ghost"
              >
                <Icon name="lucide:check" size="14" />
              </UiButton>
              <UiButton
                variant="ghost"
                isIcon
                @click="cancelEdit"
              >
                <Icon name="lucide:x" size="14" />
              </UiButton>
            </div>
          </form>
        </template>
        <template v-else>
          <div class="task__info">
            <span class="task__title">{{ item.title }}</span>
            <span v-if="item.description" class="task__description">{{ item.description }}</span>
          </div>
          <div class="task__actions">
            <UiButton
              variant="ghost"
              isIcon
              @click="startEdit(item)"
            >
              <Icon name="lucide:pencil" size="14" />
            </UiButton>
            <UiButton
              variant="danger"
              isIcon
              @click="removeTask(item.id)"
            >
              <Icon name="lucide:trash-2" size="14" />
            </UiButton>
          </div>
        </template>
      </div>
    </div>
  </UiCard>
</template>

<style scoped lang="scss">
.heading {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #888;
  margin: 0;

  &-sub {
    font-weight: 400;
    text-transform: none;
    letter-spacing: 0;
    color: var(--text-muted);
    font-style: italic;
  }
}

.form {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__input {
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    padding: 8px 12px;
    font-size: var(--text-sm);
    color: var(--text-primary);
    outline: none;
    transition: border-color 0.2s;

    &:focus {
      border-color: var(--accent);
    }

    &--sm {
      padding: 5px 10px;
      font-size: 12px;
    }
  }
}

.empty {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.form__error {
  font-size: var(--text-sm);
  color: var(--status-danger);
  margin: 0;
}

.tasks {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;
  }

  &__actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }

  &__edit {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__edit-actions {
    display: flex;
    gap: 4px;
  }

  &__title {
    font-size: var(--text-sm);
    color: var(--text-primary);
  }

  &__description {
    font-size: 11px;
    color: var(--text-muted);
  }
}
</style>
