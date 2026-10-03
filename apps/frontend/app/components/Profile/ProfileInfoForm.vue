<script setup lang="ts">
const { t } = useI18n()
const { user } = useAuth()

const form = reactive({
  name: user.value?.name ?? '',
  email: user.value?.email ?? '',
})
</script>

<template>
  <section class="card">
    <h2 class="card__title">
      <Icon
        name="lucide:user"
        size="15"
        class="card__icon"
      />
      {{ t('profile.info.title') }}
    </h2>
    <form class="form">
      <div class="field">
        <label class="field__label">{{ t('profile.info.name') }}</label>
        <input
          v-model="form.name"
          class="field__input"
          :placeholder="t('profile.info.namePlaceholder')"
        >
      </div>
      <div class="field">
        <label class="field__label">{{ t('profile.info.email') }}</label>
        <input
          v-model="form.email"
          class="field__input"
          type="email"
          :placeholder="t('profile.info.emailPlaceholder')"
        >
      </div>
      <div class="field">
        <label class="field__label">{{ t('profile.info.position') }}</label>
        <input
          class="field__input field__input--muted"
          value="Backend Developer"
          disabled
        >
      </div>
      <div class="field">
        <label class="field__label">{{ t('profile.info.organization') }}</label>
        <input
          class="field__input field__input--muted"
          value="Acme Corp"
          disabled
        >
      </div>
      <div class="form__footer">
        <button class="btn btn--primary" type="submit">
          {{ t('profile.info.save') }}
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped lang="scss">
$text-body: #e2e8f0;
$text-dim: #64748b;
$red: #ef4444;

.card {
  background: var(--surface-app);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 20px;

  &__title {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: $text-dim;
    margin: 0 0 16px;
    display: flex;
    align-items: center;
    gap: 7px;
  }

  &__icon {
    opacity: 0.7;
  }
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 4px;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 5px;

  &__label {
    font-size: 11px;
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  &__input {
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: 7px;
    padding: 9px 13px;
    font-size: var(--text-sm);
    color: $text-body;
    outline: none;
    transition: border-color 0.2s;
    font-family: inherit;

    &:focus {
      border-color: var(--accent);
    }
    &--muted {
      color: var(--text-muted);
      cursor: not-allowed;
    }
  }
}

.btn {
  border: none;
  border-radius: 7px;
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition:
    opacity 0.15s,
    background 0.15s;
  font-family: inherit;

  &--primary {
    background: var(--accent);
    color: var(--surface-card);
    padding: 9px 18px;

    &:hover:not(:disabled) {
      opacity: 0.88;
    }
    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  }
}

.msg {
  font-size: 12px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;

  &--error {
    color: $red;
  }
  &--success {
    color: var(--accent);
  }
}
</style>
