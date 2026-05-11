<template>
  <div class="admin-layout">
    <el-container>
      <el-aside width="220px" class="sidebar">
        <div class="logo">
          <span>管理后台</span>
        </div>
        <el-menu
          :default-active="activeMenu"
          router
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409eff"
        >
          <el-menu-item index="/admin">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据概览</span>
          </el-menu-item>
          <el-menu-item index="/admin/events">
            <el-icon><Trophy /></el-icon>
            <span>赛事管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/registrations">
            <el-icon><List /></el-icon>
            <span>报名管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/orders">
            <el-icon><Money /></el-icon>
            <span>订单管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/stats">
            <el-icon><TrendCharts /></el-icon>
            <span>数据统计</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-container>
        <el-header class="header">
          <div class="header-right">
            <el-button text @click="$router.push('/')">返回前台</el-button>
            <el-dropdown>
              <span class="user-dropdown">
                <el-avatar :size="32" icon="User" />
                <span>{{ userStore.user?.name || '管理员' }}</span>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { DataAnalysis, Trophy, List, Money, User, TrendCharts } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
}

.el-container {
  height: 100%;
}

.sidebar {
  background: #304156;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #3a4a5e;
}

.el-menu {
  border-right: none;
}

.header {
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 20px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #606266;
}

.main-content {
  background: #f5f7fa;
  padding: 20px;
}
</style>
