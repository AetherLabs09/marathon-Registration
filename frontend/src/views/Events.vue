<template>
  <div class="events-page container">
    <div class="page-header">
      <h1>赛事列表</h1>
    </div>

    <el-card class="filter-card">
      <el-form inline>
        <el-form-item label="赛事状态">
          <el-select v-model="filters.status" placeholder="全部" clearable @change="fetchEvents">
            <el-option label="报名中" value="open" />
            <el-option label="即将开始" value="upcoming" />
            <el-option label="已结束" value="finished" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="events-list" v-loading="loading">
      <el-card
        v-for="event in events"
        :key="event.id"
        class="event-item"
        shadow="hover"
      >
        <div class="event-content" @click="$router.push(`/events/${event.id}`)">
          <div class="event-main">
            <div class="event-header">
              <h3>{{ event.name }}</h3>
              <el-tag :type="getStatusType(event.status)">{{ getStatusText(event.status) }}</el-tag>
            </div>
            <p class="event-desc">{{ event.description }}</p>
            <div class="event-meta">
              <span><el-icon><Location /></el-icon> {{ event.location }}</span>
              <span><el-icon><Calendar /></el-icon> {{ formatDate(event.start_time) }}</span>
            </div>
          </div>
          <div class="event-categories">
            <div
              v-for="cat in event.categories"
              :key="cat.id"
              class="category-item"
            >
              <span class="category-name">{{ cat.name }}</span>
              <span class="category-price">¥{{ cat.price }}</span>
              <span class="category-quota">剩余 {{ cat.quota - cat.registered_count }} 名额</span>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <div v-if="total > filters.limit" class="pagination">
      <el-pagination
        v-model:current-page="filters.page"
        :page-size="filters.limit"
        :total="total"
        layout="prev, pager, next"
        @current-change="fetchEvents"
      />
    </div>

    <div v-if="events.length === 0 && !loading" class="empty-state">
      <el-empty description="暂无赛事" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../utils/api'
import { Location, Calendar } from '@element-plus/icons-vue'

const events = ref([])
const loading = ref(false)
const total = ref(0)

const filters = reactive({
  status: '',
  page: 1,
  limit: 10
})

onMounted(() => {
  fetchEvents()
})

async function fetchEvents() {
  loading.value = true
  try {
    const params = { ...filters }
    if (!params.status) delete params.status
    const res = await api.get('/events', { params })
    events.value = res.data
    total.value = res.total
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
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
</script>

<style scoped>
.events-page {
  max-width: 1000px;
}

.filter-card {
  margin-bottom: 20px;
}

.event-item {
  margin-bottom: 16px;
}

.event-content {
  cursor: pointer;
}

.event-main {
  margin-bottom: 16px;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.event-header h3 {
  font-size: 18px;
  color: #303133;
}

.event-desc {
  color: #606266;
  font-size: 14px;
  margin-bottom: 12px;
}

.event-meta {
  display: flex;
  gap: 20px;
  color: #909399;
  font-size: 14px;
}

.event-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.event-categories {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.category-item {
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 6px;
  min-width: 140px;
}

.category-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.category-price {
  color: #f56c6c;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 4px;
}

.category-quota {
  color: #909399;
  font-size: 12px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.empty-state {
  padding: 60px 0;
}
</style>
