<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { sponsorUrl, contacts, freeSponsorSlots } from '../site-data'

// Переводы стартовой страницы из themeConfig.home (реактивно к локали VitePress).
const { theme } = useData()
const home = computed(() => theme.value.home!)
</script>

<template>
  <section class="sponsors">
    <div class="sponsors__inner">
      <h2 class="sponsors__title">{{ home.sponsors.title }}</h2>
      <p class="sponsors__lead">{{ home.sponsors.lead }}</p>
      <p class="sponsors__desc">{{ home.sponsors.desc }}</p>

      <div class="sponsors__grid">
        <a
          v-for="slot in freeSponsorSlots"
          :key="slot"
          class="sponsors__slot"
          :href="sponsorUrl"
          target="_blank"
          rel="noopener"
        >
          <span class="sponsors__slot-plus">+</span>
          <span class="sponsors__slot-text">{{ home.sponsors.slot }}</span>
        </a>
      </div>

      <div class="sponsors__actions">
        <a
          class="sponsors__cta"
          :href="sponsorUrl"
          target="_blank"
          rel="noopener"
        >
          {{ home.sponsors.cta }}
        </a>
        <a
          class="sponsors__contact"
          :href="`mailto:${contacts.email}`"
        >
          {{ home.sponsors.contact }}
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.sponsors {
  background: var(--home-surface-app);
}
.sponsors__inner {
  max-width: var(--home-content-width);
  margin: 0 auto;
  padding: 40px 48px 56px;
  border-top: 1px solid var(--home-border-2);
  text-align: center;
}
.sponsors__title {
  font-size: var(--home-text-2xl);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--home-text-dim);
  margin: 0 0 16px;
}
.sponsors__lead {
  font-size: var(--home-text-2xl);
  font-weight: 600;
  color: var(--home-text-strong);
  margin: 0 0 8px;
}
.sponsors__desc {
  font-size: var(--home-text-md);
  color: var(--home-text-muted);
  line-height: var(--home-leading-relaxed);
  margin: 0 auto 24px;
  max-width: 60ch;
}
.sponsors__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 240px));
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
}
.sponsors__slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 96px;
  padding: 16px;
  border: 1px dashed var(--home-border-subtle);
  border-radius: 10px;
  background: var(--home-surface-2);
  text-decoration: none;
  transition:
    border-color 0.2s,
    background 0.2s;
}
.sponsors__slot:hover {
  border-color: rgba(0, 220, 130, 0.35);
  background: rgba(0, 220, 130, 0.03);
}
.sponsors__slot-plus {
  font-size: var(--home-text-2xl);
  line-height: 1;
  color: var(--home-text-dim);
  transition: color 0.2s;
}
.sponsors__slot:hover .sponsors__slot-plus {
  color: var(--home-accent);
}
.sponsors__slot-text {
  font-size: var(--home-text-sm);
  color: var(--home-text-muted);
}
.sponsors__actions {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 16px;
}
.sponsors__cta {
  padding: 10px 20px;
  border-radius: var(--home-radius-md);
  background: var(--home-accent);
  color: var(--home-surface-app);
  font-size: var(--home-text-md);
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.15s;
}
.sponsors__cta:hover {
  opacity: 0.85;
}
.sponsors__contact {
  font-size: var(--home-text-md);
  color: var(--home-text-soft);
  text-decoration: none;
  transition: color 0.15s;
}
.sponsors__contact:hover {
  color: var(--home-accent);
}

@media (max-width: 900px) {
  .sponsors__inner {
    padding: 32px 24px 44px;
  }
  .sponsors__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .sponsors__inner {
    padding: 28px 16px 36px;
  }
  .sponsors__grid {
    grid-template-columns: 1fr;
  }
}
</style>
