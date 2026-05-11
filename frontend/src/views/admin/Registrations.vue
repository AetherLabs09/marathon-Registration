<template>
  <div class="admin-registrations">
    <el-card>
      <div class="toolbar">
        <el-form inline>
          <el-form-item label="赛事">
            <el-select v-model="filters.event_id" placeholder="全部赛事" clearable @change="fetchRegistrations">
              <el-option v-for="e in events" :key="e.id" :label="e.name" :value="e.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filters.status" placeholder="全部状态" clearable @change="fetchRegistrations">
              <el-option label="待支付" value="pending" />
              <el-option label="已确认" value="confirmed" />
              <el-option label="已签到" value="checked_in" />
              <el-option label="已取消" value="cancelled" />
            </el-select>
          </el-form-item>
          <el-form-item label="搜索">
            <el-input v-model="filters.keyword" placeholder="姓名/手机/参赛号" clearable @keyup.enter="fetchRegistrations" style="width: 200px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="fetchRegistrations">搜索</el-button>
            <el-button type="success" @click="handleExport">导出Excel</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="registrations" v-loading="loading" stripe>
        <el-table-column prop="bib_number" label="参赛号" width="100" />
        <el-table-column prop="user_name" label="姓名" width="100" />
        <el-table-column prop="gender" label="性别" width="60" />
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column prop="event_name" label="赛事" min-width="150" />
        <el-table-column prop="category_name" label="组别" width="100" />
        <el-table-column label="金额" width="80">
          <template #default="{ row }">¥{{ row.amount }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="order_status" label="支付状态" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.order_status === 'paid'" type="success" size="small">已支付</el-tag>
            <el-tag v-else-if="row.order_status === 'pending'" type="warning" size="small">待支付</el-tag>
            <el-tag v-else type="info" size="small">-</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="报名时间" width="160">
          <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" text @click="handleView(row)">详情</el-button>
            <el-button size="small" type="success" text @click="handleCheckIn(row)" v-if="row.status === 'confirmed'">签到</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="filters.page"
          :page-size="filters.limit"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="fetchRegistrations"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="报名详情" width="500px">
      <el-descriptions v-if="currentRegistration" :column="1" border>
        <el-descriptions-item label="参赛号">{{ currentRegistration.bib_number }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ currentRegistration.user_name }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ currentRegistration.gender }}</el-descriptions-item>
        <el-descriptions-item label="身份证">{{ currentRegistration.id_card }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentRegistration.phone }}</el-descriptions-item>
        <el-descriptions-item label="赛事">{{ currentRegistration.event_name }}</el-descriptions-item>
        <el-descriptions-item label="组别">{{ currentRegistration.category_name }}</el-descriptions-item>
        <el-descriptions-item label="金额">¥{{ currentRegistration.amount }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ getStatusText(currentRegistration.status) }}</el-descriptions-item>
        <el-descriptions-item label="报名时间">{{ formatDateTime(currentRegistration.created_at) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../../utils/api'

const registrations = ref([])
const events = ref([])
const loading = ref(false)
const total = ref(0)
const detailVisible = ref(false)
const currentRegistration = ref(null)

const filters = reactive({
  event_id: '',
  status: '',
  keyword: '',
  page: 1,
  limit: 20
})

onMounted(() => {
  fetchEvents()
  fetchRegistrations()
})

async function fetchEvents() {
  try {
    const res = await api.get('/events', { params: { limit: 100 } })
    events.value = res.data
  } catch (error) {
    console.error(error)
  }
}

async function fetchRegistrations() {
  loading.value = true
  try {
    const params = { ...filters }
    Object.keys(params).forEach(key => {
      if (!params[key]) delete params[key]
    })
    const res = await api.get('/admin/registrations', { params })
    registrations.value = res.data
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

function getStatusType(status) {
  const types = { pending: 'warning', confirmed: 'success', checked_in: 'primary', cancelled: 'info' }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = { pending: '待支付', confirmed: '已确认', checked_in: '已签到', cancelled: '已取消' }
  return texts[status] || status
}

function handleView(row) {
  currentRegistration.value = row
  detailVisible.value = true
}

async function handleCheckIn(row) {
  try {
    await api.put(`/admin/registrations/${row.id}/status`, { status: 'checked_in' })
    ElMessage.success('签到成功')
    fetchRegistrations()
  } catch (error) {
    console.error(error)
  }
}

async function handleExport() {
  try {
    const params = new URLSearchParams()
    if (filters.event_id) params.append('event_id', filters.event_id)
    window.open(`/api/admin/export/registrations?${params.toString()}`, '_blank')
  } catch (error) {
    console.error(error)
  }
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
