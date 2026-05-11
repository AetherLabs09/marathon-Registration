<template>
  <div class="event-detail-page container" v-loading="loading">
    <template v-if="event">
      <el-card class="event-card">
        <div class="event-header">
          <div>
            <h1>{{ event.name }}</h1>
            <el-tag :type="getStatusType(event.status)" size="large">{{ getStatusText(event.status) }}</el-tag>
          </div>
        </div>

        <el-descriptions :column="2" border class="event-info">
          <el-descriptions-item label="比赛地点">{{ event.location }}</el-descriptions-item>
          <el-descriptions-item label="比赛时间">{{ formatDateTime(event.start_time) }}</el-descriptions-item>
          <el-descriptions-item label="报名开始">{{ formatDateTime(event.registration_start) }}</el-descriptions-item>
          <el-descriptions-item label="报名截止">{{ formatDateTime(event.registration_end) }}</el-descriptions-item>
        </el-descriptions>

        <div class="section">
          <h3>赛事简介</h3>
          <p>{{ event.description }}</p>
        </div>

        <div class="section" v-if="event.rules">
          <h3>比赛规则</h3>
          <pre>{{ event.rules }}</pre>
        </div>

        <div class="section" v-if="event.requirements">
          <h3>参赛要求</h3>
          <p>{{ event.requirements }}</p>
        </div>
      </el-card>

      <el-card class="categories-card">
        <h2>选择组别</h2>
        <div class="categories-list">
          <div
            v-for="cat in event.categories"
            :key="cat.id"
            class="category-card"
            :class="{ disabled: cat.registered_count >= cat.quota }"
          >
            <div class="category-header">
              <h4>{{ cat.name }}</h4>
              <span class="distance">{{ (cat.distance / 1000).toFixed(1) }}km</span>
            </div>
            <p class="category-desc">{{ cat.description }}</p>
            <div class="category-info">
              <span class="price">¥{{ cat.price }}</span>
              <span class="quota">
                剩余 {{ cat.quota - cat.registered_count }} / {{ cat.quota }} 名额
              </span>
            </div>
            <div class="age-limit" v-if="cat.min_age || cat.max_age">
              年龄限制: {{ cat.min_age || '不限' }} - {{ cat.max_age || '不限' }} 岁
            </div>
            <el-button
              type="primary"
              :disabled="cat.registered_count >= cat.quota || event.status !== 'open'"
              @click="handleRegister(cat)"
            >
              {{ cat.registered_count >= cat.quota ? '名额已满' : '立即报名' }}
            </el-button>
          </div>
        </div>
      </el-card>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../utils/api'
import { useUserStore } from '../stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const event = ref(null)
const loading = ref(false)

onMounted(() => {
  fetchEvent()
})

async function fetchEvent() {
  loading.value = true
  try {
    const res = await api.get(`/events/${route.params.id}`)
    event.value = res
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getStatusType(status) {
  const types = {
    open: 'success',
    upcoming: 'primary',
    closed: 'info',
    ongoing: 'warning',
    finished: 'info'
  }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = {
    open: '报名中',
    upcoming: '即将开始',
    closed: '报名截止',
    ongoing: '进行中',
    finished: '已结束'
  }
  return texts[status] || status
}

async function handleRegister(category) {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push({ name: 'Login', query: { redirect: route.fullPath } })
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认报名 ${event.value.name} - ${category.name}？报名费 ¥${category.price}`,
      '报名确认',
      { confirmButtonText: '确认报名', cancelButtonText: '取消', type: 'info' }
    )

    const res = await api.post('/registrations', {
      event_id: event.value.id,
      category_id: category.id,
      health_declaration: 'confirmed'
    })

    ElMessage.success('报名成功，请尽快完成支付')

    const orderRes = await api.post('/orders/create', {
      registration_id: res.registration.id
    })

    router.push({ name: 'MyOrders' })
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}
</script>

<style scoped>
.event-detail-page {
  max-width: 900px;
}

.event-card {
  margin-bottom: 20px;
}

.event-header {
  margin-bottom: 24px;
}

.event-header h1 {
  font-size: 28px;
  margin-bottom: 12px;
  color: #303133;
}

.event-info {
  margin-bottom: 24px;
}

.section {
  margin-bottom: 24px;
}

.section h3 {
  font-size: 18px;
  margin-bottom: 12px;
  color: #303133;
  padding-bottom: 8px;
  border-bottom: 2px solid #409eff;
}

.section p, .section pre {
  color: #606266;
  line-height: 1.8;
  white-space: pre-wrap;
}

.categories-card h2 {
  font-size: 20px;
  margin-bottom: 20px;
  color: #303133;
}

.categories-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.category-card {
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  transition: all 0.3s;
}

.category-card:hover:not(.disabled) {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.category-card.disabled {
  opacity: 0.6;
  background: #f5f7fa;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.category-header h4 {
  font-size: 18px;
  color: #303133;
}

.distance {
  color: #409eff;
  font-weight: 500;
}

.category-desc {
  color: #909399;
  font-size: 14px;
  margin-bottom: 12px;
}

.category-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.price {
  font-size: 24px;
  font-weight: bold;
  color: #f56c6c;
}

.quota {
  color: #67c23a;
  font-size: 14px;
}

.age-limit {
  color: #909399;
  font-size: 12px;
  margin-bottom: 12px;
}
</style>
