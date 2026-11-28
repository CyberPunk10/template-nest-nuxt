<script setup lang="ts">
import { userMenu } from '~/components/App/UserMenu/config/user-menu'
import ThemeSwitcher from './ThemeSwitcher.vue'
import LanguageSwitcher from './LanguageSwitcher.vue'

const props = withDefaults(defineProps<{ context?: 'sidebar' | 'header' }>(), {
  context: 'sidebar',
})

defineEmits<{ close: [] }>()

const { t } = useI18n()

type Submenu = 'language' | 'appearance'

const openSubmenu = ref<Submenu | null>(null)

const submenuTitle = computed(() => (openSubmenu.value ? t(`userMenu.${openSubmenu.value}`) : ''))

const showsSubmenuInPlace = computed(() => props.context === 'header')

const { logout } = useAuth()

async function handleLogout() {
  try {
    await logout()
  } catch (e) {
    console.log('logout error', e)
  }
}
</script>

<template>
  <div class="user-menu__dropdown" :class="`user-menu__dropdown--${context}`">
    <template v-if="openSubmenu">
      <button class="user-menu__back" @click="openSubmenu = null">
        <Icon name="lucide:chevron-left" size="14" />
        <span class="user-menu__back-title">{{ submenuTitle }}</span>
      </button>

      <div class="user-menu__divider" />

      <LanguageSwitcher v-if="openSubmenu === 'language'" :context="context" />
      <ThemeSwitcher v-else-if="openSubmenu === 'appearance'" :context="context" />
    </template>

    <template v-else>
      <template v-for="item in userMenu" :key="item.id">
        <div v-if="'divider' in item" class="user-menu__divider" />

        <template v-else-if="'submenu' in item">
          <button
            v-if="showsSubmenuInPlace"
            class="user-menu__item"
            @click="openSubmenu = item.id as Submenu"
          >
            <Icon :name="item.id === 'language' ? 'lucide:languages' : 'lucide:palette'" size="14" />
            {{ t(`userMenu.${item.id}`) }}
            <Icon
              name="lucide:chevron-right"
              size="12"
              class="user-menu__item-icon user-menu__item-chevron"
            />
          </button>

          <LanguageSwitcher v-else-if="item.id === 'language'" :context="context" />
          <ThemeSwitcher v-else-if="item.id === 'appearance'" :context="context" />
        </template>

        <NuxtLink
          v-else-if="'title' in item"
          class="user-menu__item"
          :to="item.url!"
          @click="$emit('close')"
        >
          <Icon :name="item.icon ?? 'lucide:circle'" size="14" />
          {{ t(item.title) }}
        </NuxtLink>
      </template>

      <div class="user-menu__divider" />

      <button
        class="user-menu__item user-menu__item--danger"
        @click="handleLogout"
      >
        <Icon name="lucide:log-out" size="14" />
        {{ t('userMenu.logout') }}
      </button>
    </template>
  </div>
</template>

<style lang="scss">
.user-menu {
  &__dropdown {
    position: absolute;
    left: var(--space-2);
    right: var(--space-2);
    width: 12.5rem;
    background: var(--surface-popover);
    border: 1px solid var(--border-popover);
    border-radius: var(--radius-lg);
    padding: var(--space-1);
    box-shadow: var(--shadow-md);
    z-index: var(--z-dropdown);

    &--sidebar {
      bottom: calc(100% + 4px);
      margin-bottom: calc(-1 * var(--space-0-5));
    }

    &--header {
      top: calc(100% + 4px);
      left: auto;
      right: 0;
    }
  }

  &__item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-2) 10px;
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    color: var(--text-secondary);
    cursor: pointer;
    text-decoration: none;
    transition:
      background 0.1s,
      color 0.1s;
    text-align: left;
    white-space: nowrap;

    &:hover {
      background: var(--control-hover);
      color: var(--text-primary);
    }

    &--active {
      color: var(--text-primary);
    }

    &--danger:hover {
      background: var(--status-danger-subtle);
      color: var(--status-danger);
    }
  }

  &__divider {
    height: 1px;
    background: var(--border-popover);
    margin: 4px 0;
  }

  &__item-icon {
    margin-left: auto;
    color: var(--accent);
    flex-shrink: 0;
  }

  &__item-chevron {
    color: var(--text-muted);
  }

  &__back {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    width: 100%;
    padding: var(--space-2) 10px;
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-primary);
    cursor: pointer;
    text-align: left;
    transition: background 0.1s;

    &:hover {
      background: var(--control-hover);
    }
  }
}
</style>
