<script setup lang="ts">
definePageMeta({ layout: 'auth', guestOnly: true })

const { t } = useI18n()
const { register } = useAuth()

const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')

async function submit() {
  error.value = ''
  try {
    await register(name.value, email.value, password.value)
    await navigateTo('/')
  } catch (e) {
    const statusCode = (e as { statusCode?: number }).statusCode
    // 409 — email уже занят, раскрывать это безопасно (в отличие от логина).
    // Остальное — общее сообщение, не пытаемся угадать формулировку backend.
    error.value = statusCode === 409
      ? t('auth.errors.emailTaken')
      : t('auth.errors.registerFailed')
  }
}
</script>

<template>
  <div class="auth">
    <form class="auth__form" @submit.prevent="submit">
      <h1 class="auth__title">{{ t('auth.register.title') }}</h1>
      <input
        v-model="name"
        class="auth__input"
        :placeholder="t('auth.register.name')"
      >
      <input
        v-model="email"
        class="auth__input"
        type="email"
        :placeholder="t('auth.register.email')"
      >
      <input
        v-model="password"
        class="auth__input"
        type="password"
        :placeholder="t('auth.register.password')"
      >
      <p v-if="error" class="auth__error">{{ error }}</p>
      <button class="auth__btn" type="submit">{{ t('auth.register.submit') }}</button>
      <NuxtLink class="auth__link" to="/login">{{ t('auth.register.haveAccount') }}</NuxtLink>
    </form>
  </div>
</template>
