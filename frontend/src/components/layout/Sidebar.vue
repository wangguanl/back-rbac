<template>
  <el-menu
    :default-active="activeMenu"
    :collapse="appStore.sidebarCollapsed"
    :collapse-transition="false"
    background-color="#304156"
    text-color="#bfcbd9"
    active-text-color="#409eff"
    router
    class="sidebar"
  >
    <div class="logo">
      <img src="/favicon.svg" alt="logo" />
      <span v-show="!appStore.sidebarCollapsed" class="logo-title">RBAC 管理系统</span>
    </div>
    <template v-for="menu in permissionStore.menuList" :key="menu.id">
      <!-- 有可见子菜单的目录 -->
      <el-sub-menu v-if="menu.children?.some(c => c.type === 1)" :index="menu.path || ''">
        <template #title>
          <el-icon v-if="menu.icon"><component :is="menu.icon" /></el-icon>
          <span>{{ menu.title || menu.name }}</span>
        </template>
        <el-menu-item
          v-for="child in menu.children.filter(c => c.type === 1)"
          :key="child.id"
          :index="(menu.path || '') + '/' + child.path"
        >
          <el-icon v-if="child.icon"><component :is="child.icon" /></el-icon>
          <span>{{ child.title || child.name }}</span>
        </el-menu-item>
      </el-sub-menu>
      <!-- 无子菜单的菜单项（仅 type=1） -->
      <el-menu-item v-else-if="menu.type === 1" :index="menu.path || ''">
        <el-icon v-if="menu.icon"><component :is="menu.icon" /></el-icon>
        <span>{{ menu.title || menu.name }}</span>
      </el-menu-item>
    </template>
  </el-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { usePermissionStore } from '@/stores/permission'

const route = useRoute()
const appStore = useAppStore()
const permissionStore = usePermissionStore()

const activeMenu = computed(() => route.path)
</script>

<style scoped lang="scss">
.sidebar {
  height: 100%;
  width: 220px;
  border-right: none;

  &.el-menu--collapse {
    width: 64px;
  }
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  background: #263445;

  img {
    width: 28px;
    height: 28px;
  }

  .logo-title {
    margin-left: 10px;
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    white-space: nowrap;
  }
}
</style>