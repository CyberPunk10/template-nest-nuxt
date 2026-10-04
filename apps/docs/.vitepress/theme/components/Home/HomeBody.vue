<script setup lang="ts">
import HomeStart from './HomeStart.vue'
import HomeServices from './HomeServices.vue'
import HomeCommands from './HomeCommands.vue'
import HomeStructure from './HomeStructure.vue'
import HomeChecklist from './HomeChecklist.vue'
import HomeDocsGuide from './HomeDocsGuide.vue'
import HomeNext from './HomeNext.vue'
import HomeTroubleshoot from './HomeTroubleshoot.vue'
import HomeOrigin from './HomeOrigin.vue'
</script>

<template>
  <div class="home__body">
    <div class="body__row">
      <HomeStart />
      <HomeServices />
    </div>
    <div class="body__row">
      <HomeCommands />
      <HomeStructure />
    </div>
    <HomeNext />
    <div class="body__row">
      <HomeChecklist />
      <HomeDocsGuide />
    </div>
    <HomeTroubleshoot />
    <HomeOrigin />
  </div>
</template>

<style scoped>
.body__row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  align-items: stretch;
}
.body__row > :deep(.section) {
  display: flex;
  flex-direction: column;
}
.body__row > :deep(.section) > :last-child {
  flex: 1;
}

@media (max-width: 900px) {
  .body__row {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
