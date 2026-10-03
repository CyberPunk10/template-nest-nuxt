<script setup lang="ts">
definePageMeta({ layout: 'auth', guestOnly: true })

const { t } = useI18n()
const { login } = useAuth()

const email = ref('')
const password = ref('')
const error = ref('')

async function submit() {
  error.value = ''
  try {
    await login(email.value, password.value)
    await navigateTo('/')
  } catch {
    error.value = t('auth.errors.invalidCredentials')
  }
}
</script>

<template>
  <div class="auth">
    <form class="auth__form" @submit.prevent="submit">
      <h1 class="auth__title">{{ t('auth.login.title') }}</h1>
      <input
        v-model="email"
        class="auth__input"
        type="email"
        :placeholder="t('auth.login.email')"
      >
      <input
        v-model="password"
        class="auth__input"
        type="password"
        :placeholder="t('auth.login.password')"
      >
      <p v-if="error" class="auth__error">{{ error }}</p>
      <button class="auth__btn" type="submit">{{ t('auth.login.submit') }}</button>
      <NuxtLink class="auth__link" to="/register">{{ t('auth.login.noAccount') }}</NuxtLink>
    </form>

    <div class="auth__hint">
      <p class="auth__hint-title">{{ t('auth.login.devAdminHint.title') }}</p>
      <p>{{ t('auth.login.devAdminHint.credentials') }}</p>
      <p>{{ t('auth.login.devAdminHint.autoCreate') }}</p>
      <p>{{ t('auth.login.devAdminHint.noDb') }}</p>
    </div>
  </div>
</template>
