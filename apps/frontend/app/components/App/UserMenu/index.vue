<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import UserMenuTrigger from './UserMenuTrigger.vue'
import UserMenuDropdown from './UserMenuDropdown.vue'

withDefaults(defineProps<{ context?: 'sidebar' | 'header' }>(), {
  context: 'sidebar',
})

const { user, isAdmin } = useAuth()

const avatar = computed(() => user.value?.name.charAt(0).toUpperCase() ?? '?')

const menuOpen = ref(false)
const menuRef = useTemplateRef('menu')

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

onClickOutside(menuRef, () => {
  menuOpen.value = false
})
</script>

<template>
  <div
    ref="menu"
    class="user-menu"
    :class="`user-menu--${context}`"
  >
    <UserMenuTrigger
      :context="context"
      :avatar="avatar"
      :name="user?.name"
      :email="user?.email"
      :open="menuOpen"
      :is-admin="isAdmin"
      @click="toggleMenu"
    />

    <UserMenuDropdown
      v-if="menuOpen"
      :context="context"
      @close="menuOpen = false"
    />
  </div>
</template>

<style lang="scss">
.user-menu {
  position: relative;

  &--header {
    @media (max-width: 500px) {
      .user-menu__info,
      .user-menu__chevron {
        display: none;
      }

      .user-menu__trigger {
        grid-template-columns: auto;
        gap: 0;
        width: auto;
        padding: 0;
        padding-right: var(--space-1-5);

        &:hover {
          border-color: transparent;
          background: transparent;

          .user-menu__avatar {
            outline: 4px solid var(--control-hover);
          }
        }
      }
    }
  }
}
</style>
