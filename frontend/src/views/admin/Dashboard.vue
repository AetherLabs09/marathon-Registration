<template>
  <div class="admin-dashboard">
    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-content">
          <el-icon class="stat-icon" style="color: #409eff;"><User /></el-icon>
          <div class="stat-info">
            <span class="stat-value">{{ stats.totalUsers }}</span>
            <span class="stat-label">注册用户</span>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <el-icon class="stat-icon" style="color: #67c23a;"><Trophy /></el-icon>
          <div class="stat-info">
            <span class="stat-value">{{ stats.totalEvents }}</span>
            <span class="stat-label">赛事数量</span>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <el-icon class="stat-icon" style="color: #e6a23c;"><List /></el-icon>
          <div class="stat-info">
            <span class="stat-value">{{ stats.totalRegistrations }}</span>
            <span class="stat-label">报名总数</span>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <el-icon class="stat-icon" style="color: #f56c6c;"><Money /></el-icon>
          <div class="stat-info">
            <span class="stat-value">¥{{ stats.totalRevenue?.toFixed(2) || '0.00' }}</span>
            <span class="stat-label">总收入</span>
          </div>
        </div>
      </el-card>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>近期报名趋势</span>
          </template>
          <div class="chart-placeholder">
            <div v-for="item in dailyStats" :key="item.date" class="chart-bar">
              <span class="bar-date">{{ item.date }}</span>
              <div class="bar-container">
                <div class="bar-fill" :style="{ width: getBarWidth(item.count) }"></div>
              </div>
              <span class="bar-count">{{ item.count }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>快捷操作</span>
          </template>
          <div class="quick-actions">
            <el-button type="primary" @click="$router.push('/admin/events')">
              <el-icon><Trophy /></el-icon> 赛事管理
            </el-button>
            <el-button type="success" @click="$router.push('/admin/registrations')">
              <el-icon><List /></el-icon> 报名管理
            </el-button>
            <el-button type="warning" @click="$router.push('/admin/orders')">
              <el-icon><Money /></el-icon> 订单管理
            </el-button>
            <el-button type="info" @click="$router.push('/admin/stats')">
              <el-icon><TrendCharts /></el-icon> 数据统计
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../../utils/api'
import { User, Trophy, List, Money, TrendCharts } from '@element-plus/icons-vue'

const stats = reactive({
  totalUsers: 0,
  totalEvents: 0,
  totalRegistrations: 0,
  totalRevenue: 0
})

const dailyStats = ref([])
const maxCount = ref(1)

onMounted(() => {
  fetchStats()
  fetchDailyStats()
})

async function fetchStats() {
  try {
    const res = await api.get('/stats/overview')
    Object.assign(stats, res)
  } catch (error) {
    console.error(error)
  }
}

async function fetchDailyStats() {
  try {
    const res = await api.get('/stats/daily-registrations', { params: { days: 7 } })
    dailyStats.value = res
    if (res.length > 0) {
      maxCount.value = Math.max(...res.map(r => r.count), 1)
    }
  } catch (error) {
    console.error(error)
  }
}

function getBarWidth(count) {
  return `${(count / maxCount.value) * 100}%`
}
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  cursor: default;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 48px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  color: #909399;
  font-size: 14px;
}

.chart-placeholder {
  height: 200px;
  overflow-y: auto;
}

.chart-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.bar-date {
  width: 80px;
  font-size: 12px;
  color: #909399;
}

.bar-container {
  flex: 1;
  height: 20px;
  background: #f5f7fa;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #67c23a);
  border-radius: 4px;
  transition: width 0.3s;
}

.bar-count {
  width: 30px;
  text-align: right;
  font-size: 12px;
  color: #606266;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quick-actions .el-button {
  justify-content: flex-start;
}
</style>
