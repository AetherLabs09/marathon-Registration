<template>
  <div class="home-page">
    <div class="banner">
      <h1>马拉松报名系统</h1>
      <p>发现精彩赛事，挑战自我极限</p>
    </div>

    <div class="container">
      <div class="section-header">
        <h2>热门赛事</h2>
        <el-button text type="primary" @click="$router.push('/events')">
          查看全部
        </el-button>
      </div>

      <div class="events-grid" v-loading="loading">
        <el-card
          v-for="event in events"
          :key="event.id"
          class="event-card"
          shadow="hover"
          @click="$router.push(`/events/${event.id}`)"
        >
          <div class="event-status">
            <el-tag :type="getStatusType(event.status)">{{ getStatusText(event.status) }}</el-tag>
          </div>
          <h3>{{ event.name }}</h3>
          <div class="event-info">
            <p><el-icon><Location /></el-icon> {{ event.location }}</p>
            <p><el-icon><Calendar /></el-icon> {{ formatDate(event.start_time) }}</p>
          </div>
          <div class="categories">
            <el-tag
              v-for="cat in event.categories?.slice(0, 3)"
              :key="cat.id"
              size="small"
              type="info"
            >
              {{ cat.name }}
            </el-tag>
          </div>
        </el-card>
      </div>

      <div v-if="events.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无可报名赛事" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../utils/api'
import { Location, Calendar } from '@element-plus/icons-vue'

const events = ref([])
const loading = ref(false)

onMounted(() => {
  fetchEvents()
})

async function fetchEvents() {
  loading.value = true
  try {
    const res = await api.get('/events/open')
    events.value = res.slice(0, 6)
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
.home-page {
  min-height: calc(100vh - 130px);
}

.banner {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: #fff;
  padding: 60px 20px;
  text-align: center;
}

.banner h1 {
  font-size: 36px;
  margin-bottom: 16px;
}

.banner p {
  font-size: 18px;
  opacity: 0.9;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h2 {
  font-size: 24px;
  color: #303133;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.event-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.event-card:hover {
  transform: translateY(-4px);
}

.event-status {
  margin-bottom: 12px;
}

.event-card h3 {
  font-size: 18px;
  margin-bottom: 12px;
  color: #303133;
}

.event-info {
  margin-bottom: 12px;
}

.event-info p {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #606266;
  font-size: 14px;
  margin-bottom: 6px;
}

.categories {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.empty-state {
  padding: 60px 0;
}
</style>
