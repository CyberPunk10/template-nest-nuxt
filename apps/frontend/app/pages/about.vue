<script setup lang="ts">
definePageMeta({ public: true })

const copied = ref<string | null>(null)

async function copyCmd(cmd: string) {
  await navigator.clipboard.writeText(cmd)
  copied.value = cmd
  setTimeout(() => {
    copied.value = null
  }, 1500)
}

provide('copied', copied)
provide('copyCmd', copyCmd)
</script>

<template>
  <div class="about">
    <AboutHero />
    <div class="about__body">
      <AboutQuickstart />
      <AboutPrinciples />
      <AboutBranches />
      <AboutStack />
      <div class="about__bottom">
        <AboutCommands />
        <AboutTree />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.about {
  background: #080f1a;
  color: #e2e8f0;
  font-family: system-ui, sans-serif;

  &__body {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 48px 64px;
    display: flex;
    flex-direction: column;
    gap: 48px;
  }

  &__bottom {
    display: grid;
    grid-template-columns: minmax(0, 420px) minmax(0, 420px);
    gap: 24px;
    align-items: stretch;

    & > :deep(.section) {
      display: flex;
      flex-direction: column;
    }
  }
}

@media (max-width: 900px) {
  .about__body {
    padding: 32px 24px 48px;
    gap: 36px;
  }

  .about__bottom {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .about__body {
    padding: 24px 16px 40px;
    gap: 28px;
  }
}
</style>
