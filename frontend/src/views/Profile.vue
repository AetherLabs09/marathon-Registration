<template>
  <div class="profile-page container">
    <div class="page-header">
      <h1>个人中心</h1>
    </div>

    <el-card v-loading="loading">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="手机号">
          <el-input :value="userStore.user?.phone" disabled />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input :value="userStore.user?.email" disabled />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="form.gender">
            <el-radio label="男">男</el-radio>
            <el-radio label="女">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="身份证号" prop="id_card">
          <el-input v-model="form.id_card" placeholder="请输入身份证号" />
        </el-form-item>
        <el-form-item label="紧急联系人" prop="emergency_contact">
          <el-input v-model="form.emergency_contact" placeholder="请输入紧急联系人姓名" />
        </el-form-item>
        <el-form-item label="紧急联系电话" prop="emergency_phone">
          <el-input v-model="form.emergency_phone" placeholder="请输入紧急联系人电话" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="handleSave">保存修改</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../utils/api'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)
const saving = ref(false)

const form = reactive({
  name: '',
  gender: '',
  id_card: '',
  emergency_contact: '',
  emergency_phone: ''
})

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  id_card: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '身份证号格式不正确', trigger: 'blur' }
  ],
  emergency_contact: [{ required: true, message: '请输入紧急联系人', trigger: 'blur' }],
  emergency_phone: [{ required: true, message: '请输入紧急联系电话', trigger: 'blur' }]
}

onMounted(() => {
  fetchProfile()
})

async function fetchProfile() {
  loading.value = true
  try {
    const res = await api.get('/user/profile')
    Object.assign(form, res)
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  saving.value = true
  try {
    const res = await api.put('/user/profile', form)
    userStore.setUser(res.user)
    ElMessage.success('保存成功')
  } catch (error) {
    console.error(error)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.profile-page {
  max-width: 600px;
}
</style>
