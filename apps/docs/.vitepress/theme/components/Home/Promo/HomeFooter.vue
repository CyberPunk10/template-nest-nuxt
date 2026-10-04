<script setup lang="ts">
import { computed, inject, ref, type Ref } from 'vue'
import { useData } from 'vitepress'
import { repoUrl, authorUrl, sponsorUrl, installCmd, contacts, cryptoWallets } from '../site-data'

// Переводы стартовой страницы из themeConfig.home (реактивно к локали VitePress).
const { theme } = useData()
const home = computed(() => theme.value.home!)
const promoFooter = computed(() => theme.value.home!.promo.footer)

// Копирование адреса — тот же механизм, что у блока команд (provide в CustomHome).
const copied = inject<Ref<string | null>>('copied')!
const copyCmd = inject<(cmd: string) => void>('copyCmd')!

const cryptoOpen = ref(false)

// Показываем адрес усечённым: полный не влезает в колонку футера.
function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

// Год для копирайта. SSR подставит год сборки.
const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="footer__glow" />
    <div class="footer__inner">
      <div class="footer__brand">
        <p class="footer__name">NestJS + Nuxt 4</p>
        <p class="footer__tagline">{{ promoFooter.tagline }}</p>
      </div>

      <nav class="footer__col">
        <p class="footer__col-title">{{ promoFooter.projectTitle }}</p>
        <a :href="repoUrl" target="_blank" rel="noopener">{{ promoFooter.links.github }}</a>
        <a :href="`${repoUrl}/issues`" target="_blank" rel="noopener">
          {{ promoFooter.links.issues }}
        </a>
        <a :href="`${repoUrl}/blob/main/LICENSE`" target="_blank" rel="noopener">
          {{ promoFooter.links.license }}
        </a>
      </nav>

      <nav class="footer__col">
        <p class="footer__col-title">{{ promoFooter.supportTitle }}</p>
        <p class="footer__support-intro">{{ promoFooter.support.intro }}</p>
        <a :href="repoUrl" target="_blank" rel="noopener">⭐ {{ promoFooter.support.star }}</a>
        <a :href="sponsorUrl" target="_blank" rel="noopener">{{ promoFooter.support.sponsor }}</a>

        <button
          type="button"
          class="footer__crypto-toggle"
          :aria-expanded="cryptoOpen"
          @click="cryptoOpen = !cryptoOpen"
        >
          {{ promoFooter.support.crypto }}
          <Icon
            name="lucide:chevron-down"
            size="13"
            class="footer__crypto-chevron"
            :class="{ 'footer__crypto-chevron--open': cryptoOpen }"
          />
        </button>

        <div
          v-if="cryptoOpen"
          class="footer__crypto"
        >
          <p class="footer__crypto-hint">{{ promoFooter.support.cryptoHint }}</p>
          <button
            v-for="wallet in cryptoWallets"
            :key="wallet.label"
            type="button"
            class="footer__wallet"
            :title="wallet.address"
            @click="copyCmd(wallet.address)"
          >
            <span class="footer__wallet-label">{{ wallet.label }}</span>
            <code class="footer__wallet-address">{{ shortAddress(wallet.address) }}</code>
            <Icon
              :name="copied === wallet.address ? 'lucide:check' : 'lucide:copy'"
              size="12"
              class="footer__wallet-copy"
              :class="{ 'footer__wallet-copy--done': copied === wallet.address }"
            />
          </button>
        </div>
      </nav>

      <nav class="footer__col">
        <p class="footer__col-title">{{ promoFooter.contactsTitle }}</p>
        <a :href="authorUrl" target="_blank" rel="noopener">{{ promoFooter.contacts.author }}</a>
        <a :href="`mailto:${contacts.email}`">{{ promoFooter.contacts.email }}</a>
        <a :href="contacts.telegram" target="_blank" rel="noopener">
          {{ promoFooter.contacts.telegram }}
        </a>
      </nav>

      <div class="footer__start">
        <p class="footer__col-title">{{ promoFooter.startTitle }}</p>
        <p class="footer__start-hint">{{ promoFooter.startHint }}</p>
        <code class="footer__cmd">{{ installCmd }}</code>
      </div>
    </div>

    <div class="footer__bottom">
      <span>© {{ year }} NestJS + Nuxt 4 Template</span>
      <span>{{ home.footer.poweredBy }} NestJS · Nuxt · VitePress</span>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  position: relative;
  overflow: hidden;
  border-top: 1px solid var(--home-border-2);
  background: var(--home-surface-app);
}
/* Свечение как в hero, но развёрнутое на 180° — из нижнего центра (at 50% 100%). */
.footer__glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 50% 100% at 50% 100%,
    rgba(0, 220, 130, 0.08) 0%,
    transparent 70%
  );
  pointer-events: none;
}
/* Контент — поверх свечения */
.footer__inner,
.footer__bottom {
  position: relative;
}
.footer__inner {
  max-width: var(--home-content-width);
  margin: 0 auto;
  padding: 48px 48px 32px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
}
/* Бренд — на всю ширину сверху, колонки (проект/поддержать/контакты/начать) под ним */
.footer__brand {
  grid-column: 1 / -1;
}
.footer__name {
  font-size: var(--home-text-lg);
  font-weight: 700;
  color: var(--home-text-strong);
  margin: 0 0 8px;
}
.footer__tagline {
  font-size: var(--home-text-md);
  color: var(--home-text-muted);
  line-height: var(--home-leading-relaxed);
  margin: 0;
  max-width: 40ch;
}
.footer__col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.footer__col-title {
  font-size: var(--home-text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--home-text-dim);
  margin: 0 0 4px;
}
.footer__col a {
  font-size: var(--home-text-sm);
  color: var(--home-text-soft);
  text-decoration: none;
  transition: color 0.15s;
}
.footer__col a:hover {
  color: var(--home-accent);
}
/* Вводная строка колонки «Поддержать» — объясняет, зачем все пункты ниже */
.footer__support-intro {
  font-size: var(--home-text-sm);
  color: var(--home-text-muted);
  line-height: var(--home-leading-normal);
  margin: 0 0 4px;
}
/* Кнопка-раскрывашка выглядит как остальные ссылки колонки */
.footer__crypto-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--home-text-sm);
  font-family: inherit;
  color: var(--home-text-soft);
  transition: color 0.15s;
}
.footer__crypto-toggle:hover {
  color: var(--home-accent);
}
.footer__crypto-chevron {
  transition: transform 0.2s;
}
.footer__crypto-chevron--open {
  transform: rotate(180deg);
}
.footer__crypto {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 2px;
}
.footer__crypto-hint {
  font-size: var(--home-text-xs);
  color: var(--home-text-dim);
  margin: 0 0 2px;
}
.footer__wallet {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: var(--home-radius-md);
  background: var(--home-surface-deep);
  border: 1px solid var(--home-border-2);
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: border-color 0.15s;
}
.footer__wallet:hover {
  border-color: var(--home-border-subtle);
}
.footer__wallet-label {
  font-size: var(--home-text-xs);
  color: var(--home-text-dim);
  white-space: nowrap;
}
.footer__wallet-address {
  font-family: monospace;
  font-size: var(--home-text-xs);
  color: var(--home-text-primary);
  margin-left: auto;
  white-space: nowrap;
}
.footer__wallet-copy {
  flex-shrink: 0;
  color: var(--home-text-muted);
  opacity: 0;
  transition: color 0.15s;
}
.footer__wallet:hover .footer__wallet-copy {
  opacity: 1;
}
.footer__wallet-copy--done {
  opacity: 1 !important;
  color: var(--home-accent) !important;
  transition: none;
}
.footer__start {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.footer__start-hint {
  font-size: var(--home-text-sm);
  color: var(--home-text-muted);
  margin: 0;
}
.footer__cmd {
  font-family: monospace;
  font-size: var(--home-text-sm);
  color: var(--home-accent);
  background: var(--home-surface-2);
  border: 1px solid var(--home-border-2);
  border-radius: var(--home-radius-md);
  padding: 8px 10px;
  white-space: nowrap;
  overflow-x: auto;
}
.footer__bottom {
  max-width: var(--home-content-width);
  margin: 0 auto;
  padding: 20px 48px;
  border-top: 1px solid var(--home-border-2);
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  font-size: var(--home-text-sm);
  color: var(--home-text-dim);
}

@media (max-width: 900px) {
  .footer__inner {
    grid-template-columns: 1fr 1fr;
    padding: 40px 24px 28px;
  }
}

@media (max-width: 600px) {
  .footer__inner {
    grid-template-columns: 1fr;
    padding: 32px 16px 24px;
  }
  .footer__bottom {
    padding: 20px 16px;
    flex-direction: column;
  }
}
</style>
