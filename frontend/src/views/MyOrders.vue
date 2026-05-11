<template>
  <div class="my-orders-page container">
    <div class="page-header">
      <h1>我的订单</h1>
    </div>

    <div class="orders-list" v-loading="loading">
      <el-card v-for="order in orders" :key="order.id" class="order-item">
        <div class="order-content">
          <div class="order-main">
            <div class="order-header">
              <span class="order-no">订单号: {{ order.order_no }}</span>
              <el-tag :type="getStatusType(order.status)" size="small">{{ getStatusText(order.status) }}</el-tag>
            </div>
            <div class="order-info">
              <p><strong>赛事:</strong> {{ order.event_name }}</p>
              <p><strong>组别:</strong> {{ order.category_name }}</p>
              <p><strong>金额:</strong> <span class="amount">¥{{ order.amount }}</span></p>
              <p><strong>创建时间:</strong> {{ formatDateTime(order.created_at) }}</p>
              <p v-if="order.payment_time"><strong>支付时间:</strong> {{ formatDateTime(order.payment_time) }}</p>
            </div>
          </div>
          <div class="order-actions">
            <el-button
              v-if="order.status === 'pending'"
              type="success"
              @click="handlePay(order)"
            >
              立即支付
            </el-button>
            <el-button
              v-if="order.status === 'pending'"
              type="danger"
              text
              @click="handleCancel(order)"
            >
              取消订单
            </el-button>
          </div>
        </div>
      </el-card>

      <el-empty v-if="orders.length === 0 && !loading" description="暂无订单记录" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../utils/api'

const orders = ref([])
const loading = ref(false)

onMounted(() => {
  fetchOrders()
})

async function fetchOrders() {
  loading.value = true
  try {
    const res = await api.get('/orders/my')
    orders.value = res
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
    paid: 'success',
    cancelled: 'info'
  }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = {
    pending: '待支付',
    paid: '已支付',
    cancelled: '已取消'
  }
  return texts[status] || status
}

async function handlePay(order) {
  try {
    await ElMessageBox.confirm(`确认支付 ¥${order.amount}？`, '支付确认', {
      confirmButtonText: '确认支付',
      cancelButtonText: '取消',
      type: 'info'
    })

    await api.post('/orders/pay', { order_id: order.id, payment_method: 'mock' })
    ElMessage.success('支付成功')
    fetchOrders()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

async function handleCancel(order) {
  try {
    await ElMessageBox.confirm('确认取消该订单？', '取消确认', {
      confirmButtonText: '确认取消',
      cancelButtonText: '返回',
      type: 'warning'
    })

    await api.put(`/orders/${order.id}/cancel`)
    ElMessage.success('订单已取消')
    fetchOrders()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}
</script>

<style scoped>
.my-orders-page {
  max-width: 900px;
}

.order-item {
  margin-bottom: 16px;
}

.order-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.order-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.order-no {
  color: #909399;
  font-size: 14px;
}

.order-info p {
  color: #606266;
  font-size: 14px;
  margin-bottom: 6px;
}

.amount {
  color: #f56c6c;
  font-size: 18px;
  font-weight: bold;
}

.order-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
