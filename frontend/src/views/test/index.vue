<template>
  <div class="test-page">
    <el-card>
      <template #header>
        <span>测试页面</span>
      </template>
      <p>这是一个测试页面，用于验证动态路由是否正常工作。</p>
      <p>当前路由: {{ route.path }}</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style scoped lang="scss">
.test-page {
  p {
    margin: 8px 0;
    color: #666;
  }
}
</style>