<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import HomeCopyCmd from './HomeCopyCmd.vue'

const { theme } = useData()
const t = computed(() => theme.value.home!.content.accounts)

// default values from apps/backend/.env.example (ADMIN_EMAIL, ADMIN_PASSWORD)
const admin = { email: 'admin@example.com', password: 'password' }
</script>

<template>
  <section class="section">
    <h2 class="section__title">{{ t.title }}</h2>
    <div class="home-panel accounts">
      <p class="accounts__text">{{ t.intro }}</p>
      <div class="accounts__defaults">
        <span class="accounts__label">{{ t.defaults }}</span>
        <dl class="accounts__creds">
          <div class="accounts__cred">
            <dt>{{ t.email }}</dt>
            <dd><code>{{ admin.email }}</code></dd>
          </div>
          <div class="accounts__cred">
            <dt>{{ t.password }}</dt>
            <dd><code>{{ admin.password }}</code></dd>
          </div>
        </dl>
      </div>
      <div class="accounts__seed">
        <span class="accounts__label">{{ t.seed }}</span>
        <HomeCopyCmd cmd="cd apps/backend && pnpm prisma db seed" />
      </div>
      <a class="accounts__more" href="guide/auth/backend">
        {{ t.more }}
        <Icon name="lucide:arrow-right" size="12" />
      </a>
    </div>
  </section>
</template>

<style scoped>
.accounts {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.accounts__text {
  margin: 0;
  font-size: var(--home-text-sm);
  color: var(--home-text-muted);
  line-height: var(--home-leading-normal);
}
.accounts__defaults {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px 16px;
}
.accounts__seed {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}
.accounts__label {
  font-size: var(--home-text-sm);
  color: var(--home-text-muted);
}
.accounts__creds {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 32px;
  margin: 0;
}
.accounts__cred {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.accounts__cred dt {
  font-size: var(--home-text-xs);
  color: var(--home-text-muted);
}
.accounts__cred dd {
  margin: 0;
}
.accounts__cred code {
  font-family: monospace;
  font-size: var(--home-text-sm);
  color: var(--home-text-primary);
  background: var(--home-surface-deep);
  border: 1px solid var(--home-border-2);
  border-radius: var(--home-radius-md);
  padding: 2px 8px;
}
.accounts__more {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  font-size: var(--home-text-sm);
  color: var(--home-accent);
  text-decoration: none;
}
.accounts__more:hover {
  text-decoration: underline;
}
</style>
