<template>
  <div class="main-layout">
    <el-header class="header">
      <div class="header-content">
        <div class="logo" @click="$router.push('/')">
          <span>马拉松报名系统</span>
        </div>
        <el-menu
          :default-active="activeMenu"
          mode="horizontal"
          :ellipsis="false"
          router
        >
          <el-menu-item index="/">首页</el-menu-item>
          <el-menu-item index="/events">赛事列表</el-menu-item>
          <template v-if="userStore.isLoggedIn">
            <el-menu-item index="/my-registrations">我的报名</el-menu-item>
            <el-menu-item index="/my-orders">我的订单</el-menu-item>
          </template>
        </el-menu>
        <div class="user-area">
          <template v-if="userStore.isLoggedIn">
            <el-dropdown>
              <span class="user-dropdown">
                <el-avatar :size="32" icon="User" />
                <span class="username">{{ userStore.user?.name || userStore.user?.phone || '用户' }}</span>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="$router.push('/profile')">个人中心</el-dropdown-item>
                  <el-dropdown-item v-if="userStore.isAdmin" @click="$router.push('/admin')">管理后台</el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button type="primary" @click="$router.push('/login')">登录</el-button>
            <el-button @click="$router.push('/register')">注册</el-button>
          </template>
        </div>
      </div>
    </el-header>
    <el-main class="main-content">
      <router-view />
    </el-main>
    <el-footer class="footer">
      <p>马拉松报名系统 &copy; {{ new Date().getFullYear() }}</p>
    </el-footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

function handleLogout() {
  userStore.logout()
  router.push('/')
}
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0 20px;
  height: 60px;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  height: 100%;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
  cursor: pointer;
  margin-right: 40px;
}

.el-menu {
  flex: 1;
  border-bottom: none;
}

.user-area {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.username {
  color: #606266;
}

.main-content {
  flex: 1;
  padding: 20px;
  background: #f5f7fa;
}

.footer {
  background: #fff;
  text-align: center;
  color: #909399;
  font-size: 14px;
  height: 50px;
  line-height: 50px;
}
</style>
