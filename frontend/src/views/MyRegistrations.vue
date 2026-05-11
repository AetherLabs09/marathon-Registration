<template>
  <div class="my-registrations-page container">
    <div class="page-header">
      <h1>我的报名</h1>
    </div>

    <div class="registrations-list" v-loading="loading">
      <el-card v-for="item in registrations" :key="item.id" class="registration-item">
        <div class="registration-content">
          <div class="registration-main">
            <div class="registration-header">
              <h3>{{ item.event_name }}</h3>
              <el-tag :type="getStatusType(item.status)">{{ getStatusText(item.status) }}</el-tag>
            </div>
            <div class="registration-info">
              <p><strong>组别:</strong> {{ item.category_name }} ({{ (item.distance / 1000).toFixed(1) }}km)</p>
              <p><strong>参赛号:</strong> {{ item.bib_number || '待分配' }}</p>
              <p><strong>比赛地点:</strong> {{ item.location }}</p>
              <p><strong>比赛时间:</strong> {{ formatDateTime(item.start_time) }}</p>
            </div>
          </div>
          <div class="registration-actions">
            <el-button
              v-if="item.status === 'confirmed'"
              type="primary"
              @click="$router.push(`/bib/${item.id}`)"
            >
              查看号码布
            </el-button>
            <el-button
              v-if="item.order_status === 'pending'"
              type="success"
              @click="handlePay(item)"
            >
              去支付 ¥{{ item.amount }}
            </el-button>
            <el-button
              v-if="item.status === 'pending'"
              type="danger"
              text
              @click="handleCancel(item)"
            >
              取消报名
            </el-button>
          </div>
        </div>
      </el-card>

      <el-empty v-if="registrations.length === 0 && !loading" description="暂无报名记录" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../utils/api'

const router = useRouter()

const registrations = ref([])
const loading = ref(false)

onMounted(() => {
  fetchRegistrations()
})

async function fetchRegistrations() {
  loading.value = true
  try {
    const res = await api.get('/user/registrations')
    registrations.value = res
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
  const types = {
    pending: 'warning',
    confirmed: 'success',
    checked_in: 'primary',
    cancelled: 'info'
  }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = {
    pending: '待支付',
    confirmed: '已确认',
    checked_in: '已签到',
    cancelled: '已取消'
  }
  return texts[status] || status
}

async function handlePay(item) {
  try {
    await ElMessageBox.confirm(`确认支付 ¥${item.amount}？`, '支付确认', {
      confirmButtonText: '确认支付',
      cancelButtonText: '取消',
      type: 'info'
    })

    let orderId = item.order_id
    if (!orderId) {
      const orderRes = await api.post('/orders/create', { registration_id: item.id })
      orderId = orderRes.order.id
    }

    await api.post('/orders/pay', { order_id: orderId, payment_method: 'mock' })
    ElMessage.success('支付成功')
    fetchRegistrations()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

async function handleCancel(item) {
  try {
    await ElMessageBox.confirm('确认取消报名？', '取消确认', {
      confirmButtonText: '确认取消',
      cancelButtonText: '返回',
      type: 'warning'
    })

    await api.put(`/registrations/${item.id}/cancel`)
    ElMessage.success('已取消报名')
    fetchRegistrations()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}
</script>

<style scoped>
.my-registrations-page {
  max-width: 900px;
}

.registration-item {
  margin-bottom: 16px;
}

.registration-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.registration-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.registration-header h3 {
  font-size: 18px;
  color: #303133;
}

.registration-info p {
  color: #606266;
  font-size: 14px;
  margin-bottom: 6px;
}

.registration-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
