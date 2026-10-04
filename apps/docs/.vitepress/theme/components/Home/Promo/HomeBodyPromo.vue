<script setup lang="ts">
import HomeQuickstart from './HomeQuickstart.vue'
import HomePrinciples from './HomePrinciples.vue'
import HomeBranches from './HomeBranches.vue'
import HomeShowcase from './HomeShowcase.vue'
import HomeFit from './HomeFit.vue'
import HomeAuth from './HomeAuth.vue'
import HomeCallout from './HomeCallout.vue'
import HomeStructure from '../HomeStructure.vue'
import HomeSponsors from './HomeSponsors.vue'
</script>

<template>
  <div class="home__body">
    <HomeQuickstart />
    <HomeShowcase />
    <HomePrinciples />
    <HomeFit />
    <HomeCallout variant="split" />
    <HomeAuth />
    <HomeBranches />
    <HomeCallout variant="steps" />
    <HomeStructure class="promo__structure" />
  </div>
  <HomeSponsors />
</template>

<style scoped>
.promo__structure {
  max-width: 720px;
}
</style>
