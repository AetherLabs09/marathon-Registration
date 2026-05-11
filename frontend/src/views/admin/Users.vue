<template>
  <div class="admin-users">
    <el-card>
      <div class="toolbar">
        <el-form inline>
          <el-form-item label="搜索">
            <el-input v-model="filters.keyword" placeholder="姓名/手机/邮箱" clearable @keyup.enter="fetchUsers" style="width: 200px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="fetchUsers">搜索</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="users" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="gender" label="性别" width="60" />
        <el-table-column prop="id_card" label="身份证" width="180">
          <template #default="{ row }">{{ row.id_card ? maskIdCard(row.id_card) : '-' }}</template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="80">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : 'info'" size="small">
              {{ row.role === 'admin' ? '管理员' : '用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" width="160">
          <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="filters.page"
          :page-size="filters.limit"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="fetchUsers"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../../utils/api'

const users = ref([])
const loading = ref(false)
const total = ref(0)

const filters = reactive({
  keyword: '',
  page: 1,
  limit: 20
})

onMounted(() => {
  fetchUsers()
})

async function fetchUsers() {
  loading.value = true
  try {
    const params = { ...filters }
    Object.keys(params).forEach(key => {
      if (!params[key]) delete params[key]
    })
    const res = await api.get('/admin/users', { params })
    users.value = res.data
    total.value = res.total
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString('zh-CN')
}

function maskIdCard(idCard) {
  if (!idCard || idCard.length < 10) return idCard
  return idCard.slice(0, 6) + '****' + idCard.slice(-4)
}
</script>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
