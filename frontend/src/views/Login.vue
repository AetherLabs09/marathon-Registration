<template>
  <div class="login-page">
    <el-card class="login-card">
      <h2>登录</h2>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="账号" prop="account">
          <el-input v-model="form.account" placeholder="手机号/邮箱" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleLogin" style="width: 100%">
            登录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="footer">
        <span>还没有账号？</span>
        <el-button text type="primary" @click="$router.push('/register')">立即注册</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../utils/api'
import { useUserStore } from '../stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  account: '',
  password: ''
})

const rules = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  loading.value = true
  try {
    const res = await api.post('/auth/login', form)
    userStore.setToken(res.token)
    userStore.setUser(res.user)
    ElMessage.success('登录成功')
    
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
  padding: 20px;
}

.login-card h2 {
  text-align: center;
  margin-bottom: 24px;
  color: #303133;
}

.footer {
  text-align: center;
  margin-top: 16px;
  color: #909399;
}
</style>
