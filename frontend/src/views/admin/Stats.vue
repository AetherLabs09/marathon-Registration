<template>
  <div class="admin-stats">
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>组别报名统计</span>
              <el-select v-model="selectedEvent" placeholder="选择赛事" @change="fetchCategoryStats">
                <el-option v-for="e in events" :key="e.id" :label="e.name" :value="e.id" />
              </el-select>
            </div>
          </template>
          <div class="stats-list" v-loading="loading">
            <div v-for="cat in categoryStats" :key="cat.id" class="stat-item">
              <div class="stat-name">{{ cat.name }} ({{ (cat.distance / 1000).toFixed(1) }}km)</div>
              <div class="stat-bar-container">
                <div class="stat-bar" :style="{ width: getPercent(cat.registered_count, cat.quota) }"></div>
              </div>
              <div class="stat-numbers">
                <span>{{ cat.registered_count }} / {{ cat.quota }}</span>
                <span class="percent">{{ getPercent(cat.registered_count, cat.quota) }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>性别分布</template>
          <div class="gender-stats" v-loading="genderLoading">
            <div v-for="item in genderStats" :key="item.gender" class="gender-item">
              <span class="gender-label">{{ item.gender || '未知' }}</span>
              <span class="gender-count">{{ item.count }}人</span>
            </div>
            <el-empty v-if="genderStats.length === 0" description="暂无数据" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>年龄分布</template>
          <div class="age-stats" v-loading="ageLoading">
            <div v-for="item in ageStats" :key="item.age_group" class="age-item">
              <span class="age-label">{{ item.age_group }}</span>
              <div class="age-bar-container">
                <div class="age-bar" :style="{ width: getAgePercent(item.count) }"></div>
              </div>
              <span class="age-count">{{ item.count }}人</span>
            </div>
            <el-empty v-if="ageStats.length === 0" description="暂无数据" />
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>收入统计</template>
          <div class="revenue-stats" v-loading="revenueLoading">
            <div class="revenue-total">
              <span class="revenue-label">总收入</span>
              <span class="revenue-value">¥{{ totalRevenue.toFixed(2) }}</span>
            </div>
            <div class="revenue-list">
              <div v-for="item in revenueStats" :key="item.date" class="revenue-item">
                <span class="revenue-date">{{ item.date }}</span>
                <span class="revenue-amount">¥{{ item.total }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../../utils/api'

const events = ref([])
const selectedEvent = ref('')
const categoryStats = ref([])
const genderStats = ref([])
const ageStats = ref([])
const revenueStats = ref([])
const loading = ref(false)
const genderLoading = ref(false)
const ageLoading = ref(false)
const revenueLoading = ref(false)

const totalRevenue = computed(() => {
  return revenueStats.value.reduce((sum, item) => sum + (item.total || 0), 0)
})

const maxAgeCount = computed(() => {
  return Math.max(...ageStats.value.map(a => a.count), 1)
})

onMounted(() => {
  fetchEvents()
  fetchRevenueStats()
})

async function fetchEvents() {
  try {
    const res = await api.get('/events', { params: { limit: 100 } })
    events.value = res.data
    if (res.data.length > 0) {
      selectedEvent.value = res.data[0].id
      fetchCategoryStats()
      fetchGenderStats()
      fetchAgeStats()
    }
  } catch (error) {
    console.error(error)
  }
}

async function fetchCategoryStats() {
  if (!selectedEvent.value) return
  loading.value = true
  try {
    const res = await api.get(`/stats/events/${selectedEvent.value}/categories`)
    categoryStats.value = res
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

async function fetchGenderStats() {
  if (!selectedEvent.value) return
  genderLoading.value = true
  try {
    const res = await api.get(`/stats/events/${selectedEvent.value}/gender`)
    genderStats.value = res
  } catch (error) {
    console.error(error)
  } finally {
    genderLoading.value = false
  }
}

async function fetchAgeStats() {
  if (!selectedEvent.value) return
  ageLoading.value = true
  try {
    const res = await api.get(`/stats/events/${selectedEvent.value}/age`)
    ageStats.value = res
  } catch (error) {
    console.error(error)
  } finally {
    ageLoading.value = false
  }
}

async function fetchRevenueStats() {
  revenueLoading.value = true
  try {
    const res = await api.get('/stats/revenue', { params: { days: 30 } })
    revenueStats.value = res
  } catch (error) {
    console.error(error)
  } finally {
    revenueLoading.value = false
  }
}

function getPercent(current, total) {
  if (!total) return '0%'
  return `${Math.round((current / total) * 100)}%`
}

function getAgePercent(count) {
  return `${(count / maxAgeCount.value) * 100}%`
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-list {
  padding: 10px 0;
}

.stat-item {
  margin-bottom: 20px;
}

.stat-name {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.stat-bar-container {
  height: 20px;
  background: #f5f7fa;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 4px;
}

.stat-bar {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #67c23a);
  border-radius: 10px;
  transition: width 0.3s;
}

.stat-numbers {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.percent {
  color: #67c23a;
  font-weight: bold;
}

.gender-stats, .age-stats {
  padding: 10px 0;
}

.gender-item, .age-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.gender-label, .age-label {
  width: 60px;
  font-size: 14px;
  color: #606266;
}

.gender-count {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.age-bar-container {
  flex: 1;
  height: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
  margin: 0 12px;
}

.age-bar {
  height: 100%;
  background: #409eff;
  border-radius: 8px;
}

.age-count {
  width: 50px;
  text-align: right;
  font-size: 12px;
  color: #909399;
}

.revenue-stats {
  padding: 10px 0;
}

.revenue-total {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  border-radius: 8px;
  margin-bottom: 20px;
}

.revenue-label {
  display: block;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  margin-bottom: 8px;
}

.revenue-value {
  font-size: 32px;
  font-weight: bold;
  color: #fff;
}

.revenue-list {
  max-height: 200px;
  overflow-y: auto;
}

.revenue-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

.revenue-date {
  color: #606266;
  font-size: 14px;
}

.revenue-amount {
  color: #f56c6c;
  font-weight: 500;
}
</style>
