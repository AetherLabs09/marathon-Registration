<template>
  <div class="admin-orders">
    <el-card>
      <div class="toolbar">
        <el-form inline>
          <el-form-item label="赛事">
            <el-select v-model="filters.event_id" placeholder="全部赛事" clearable @change="fetchOrders">
              <el-option v-for="e in events" :key="e.id" :label="e.name" :value="e.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filters.status" placeholder="全部状态" clearable @change="fetchOrders">
              <el-option label="待支付" value="pending" />
              <el-option label="已支付" value="paid" />
              <el-option label="已取消" value="cancelled" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="fetchOrders">搜索</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="orders" v-loading="loading" stripe>
        <el-table-column prop="order_no" label="订单号" width="180" />
        <el-table-column prop="user_name" label="用户" width="100" />
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column prop="event_name" label="赛事" min-width="150" />
        <el-table-column prop="category_name" label="组别" width="100" />
        <el-table-column label="金额" width="100">
          <template #default="{ row }">
            <span class="amount">¥{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payment_method" label="支付方式" width="100" />
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="支付时间" width="160">
          <template #default="{ row }">{{ row.payment_time ? formatDateTime(row.payment_time) : '-' }}</template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="filters.page"
          :page-size="filters.limit"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="fetchOrders"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../../utils/api'

const orders = ref([])
const events = ref([])
const loading = ref(false)
const total = ref(0)

const filters = reactive({
  event_id: '',
  status: '',
  page: 1,
  limit: 20
})

onMounted(() => {
  fetchEvents()
  fetchOrders()
})

async function fetchEvents() {
  try {
    const res = await api.get('/events', { params: { limit: 100 } })
    events.value = res.data
  } catch (error) {
    console.error(error)
  }
}

async function fetchOrders() {
  loading.value = true
  try {
    const params = { ...filters }
    Object.keys(params).forEach(key => {
      if (!params[key]) delete params[key]
    })
    const res = await api.get('/admin/orders', { params })
    orders.value = res.data
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
  const types = { pending: 'warning', paid: 'success', cancelled: 'info' }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = { pending: '待支付', paid: '已支付', cancelled: '已取消' }
  return texts[status] || status
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

.amount {
  color: #f56c6c;
  font-weight: bold;
}
</style>
