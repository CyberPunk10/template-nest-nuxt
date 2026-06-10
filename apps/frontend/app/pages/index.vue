<template>
  <div class="home">
    <div class="col">
      <NuxtWelcome />
    </div>
    <div class="col col--users">
      <HomeUsers />
    </div>
  </div>
</template>

<style scoped lang="scss">
.home {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 0;
  flex: 1;
  min-height: 0;
  background: #0f172a;
  color: #fff;
}

.col {
  border-right: 1px solid #1e293b;
  overflow: auto;
  min-height: 0;

  :deep(.min-h-screen) {
    min-height: 0;
  }
}

.col--users {
  border-right: none;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
