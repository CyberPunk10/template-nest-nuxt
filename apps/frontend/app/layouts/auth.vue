<template>
  <div class="layout-auth">
    <NuxtRouteAnnouncer />
    <slot />
  </div>
</template>

<style scoped lang="scss">
.layout-auth {
  min-height: 100vh;
  background: #080f1a;
  font-family: system-ui, sans-serif;
}
</style>

<style lang="scss">
.auth {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;

  &__form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 320px;
  }

  &__title {
    color: var(--text-primary);
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 8px;
  }

  &__input {
    background: var(--border-subtle);
    border: 1px solid #334155;
    border-radius: var(--radius-lg);
    padding: 10px 14px;
    font-size: 14px;
    color: var(--text-primary);
    outline: none;
    transition: border-color 0.2s;

    &:focus {
      border-color: var(--accent);
    }
  }

  &__error {
    font-size: 13px;
    color: var(--status-danger);
    margin: 0;
  }

  &__btn {
    background: var(--accent);
    color: var(--surface-card);
    border: none;
    border-radius: var(--radius-lg);
    padding: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &__link {
    font-size: 13px;
    color: var(--text-muted);
    text-align: center;
    text-decoration: none;

    &:hover {
      color: var(--text-secondary);
    }
  }

  &__hint {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 320px;
    padding: 12px 14px;
    background: var(--status-warning-subtle);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);

    p {
      margin: 0;
      font-size: 12px;
      line-height: 1.4;
      color: var(--text-muted);

      &.auth__hint-title {
        font-weight: 600;
        color: var(--status-warning);
      }
    }
  }
}
</style>
