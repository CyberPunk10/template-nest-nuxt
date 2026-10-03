<script setup lang="ts">
withDefaults(defineProps<{
  avatar: string
  context?: 'sidebar' | 'header'
  name?: string
  email?: string
  open: boolean
  isAdmin?: boolean
}>(), { context: 'sidebar' })

defineEmits<{ click: [] }>()

const { t } = useI18n()
</script>

<template>
  <button
    class="user-menu__trigger"
    :class="`user-menu__trigger--${context}`"
    @click="$emit('click')"
  >
    <div class="user-menu__avatar">{{ avatar }}</div>
    <div class="user-menu__info">
      <span class="user-menu__name-row">
        <span class="user-menu__name">{{ name }}</span>
        <span v-if="isAdmin" class="user-menu__admin-badge">{{ t('db.roles.admin') }}</span>
      </span>
      <span class="user-menu__email">{{ email }}</span>
    </div>
    <Icon
      name="lucide:chevron-up"
      size="14"
      class="user-menu__chevron --up"
      :class="{ 'user-menu__chevron--open': open }"
    />
    <Icon
      name="lucide:chevron-down"
      size="14"
      class="user-menu__chevron --down"
      :class="{ 'user-menu__chevron--open': open }"
    />
  </button>
</template>

<style lang="scss">
.user-menu {
  &__trigger {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: .625rem;
    width: 100%;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-lg);
    padding: 3px 10px 3px 4px;
    cursor: pointer;
    transition:
      border-color 0.15s,
      background 0.15s;

    &:hover {
      border-color: var(--border-subtle);
      background: var(--control-hover);
    }
  }

  &__avatar {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background: var(--accent);
    border: 1px solid var(--surface-panel);
    color: var(--surface-app);
    font-size: var(--text-sm);
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    text-align: left;
    opacity: 1;
    transition: opacity var(--app-sidebar-transition);
  }

  &__name-row {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  &__name {
    font-size: var(--text-sm);
    color: var(--text-primary);
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__admin-badge {
    flex-shrink: 0;
    font-size: 10px;
    font-weight: 600;
    line-height: 1.6;
    color: var(--status-warning);
    background: var(--status-warning-subtle);
    border-radius: 20px;
    padding: 0 6px;
  }

  &__email {
    font-size: 11px;
    color: var(--text-secondary);
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__trigger--sidebar .user-menu__chevron.--down,
  &__trigger--header .user-menu__chevron.--up {
    display: none;
  }

  &__chevron {
    color: var(--text-muted);
    opacity: 1;
    transition:
      transform var(--duration-normal),
      opacity var(--app-sidebar-transition);

    &--open {
      transform: rotate(180deg);
    }
  }

}
</style>
