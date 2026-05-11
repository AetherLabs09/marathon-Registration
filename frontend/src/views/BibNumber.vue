<template>
  <div class="bib-page container">
    <div class="page-header">
      <h1>参赛凭证</h1>
    </div>

    <el-card v-loading="loading" class="bib-card">
      <div v-if="registration" class="bib-content">
        <div class="bib-header">
          <h2>{{ registration.event_name }}</h2>
          <p>{{ registration.category_name }}</p>
        </div>

        <div class="bib-number">
          <span class="label">参赛号</span>
          <span class="number">{{ registration.bib_number }}</span>
        </div>

        <div class="bib-qrcode">
          <canvas ref="qrcodeCanvas"></canvas>
        </div>

        <div class="bib-info">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="姓名">{{ registration.user_name }}</el-descriptions-item>
            <el-descriptions-item label="性别">{{ registration.gender }}</el-descriptions-item>
            <el-descriptions-item label="身份证">{{ maskIdCard(registration.id_card) }}</el-descriptions-item>
            <el-descriptions-item label="比赛地点">{{ registration.location }}</el-descriptions-item>
            <el-descriptions-item label="比赛时间">{{ formatDateTime(registration.start_time) }}</el-descriptions-item>
            <el-descriptions-item label="紧急联系人">{{ registration.emergency_contact }}</el-descriptions-item>
            <el-descriptions-item label="紧急电话">{{ registration.emergency_phone }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="bib-actions">
          <el-button type="primary" @click="handlePrint">打印号码布</el-button>
          <el-button @click="handleDownload">下载图片</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../utils/api'
import QRCode from 'qrcode'

const route = useRoute()

const registration = ref(null)
const loading = ref(false)
const qrcodeCanvas = ref(null)

onMounted(() => {
  fetchRegistration()
})

async function fetchRegistration() {
  loading.value = true
  try {
    const res = await api.get(`/registrations/${route.params.id}`)
    registration.value = res

    await nextTick()
    generateQRCode()
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

async function generateQRCode() {
  if (!qrcodeCanvas.value || !registration.value) return

  try {
    await QRCode.toCanvas(qrcodeCanvas.value, JSON.stringify({
      bib: registration.value.bib_number,
      event: registration.value.event_name,
      name: registration.value.user_name,
      id: registration.value.id
    }), {
      width: 200,
      margin: 2
    })
  } catch (error) {
    console.error(error)
  }
}

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString('zh-CN')
}

function maskIdCard(idCard) {
  if (!idCard || idCard.length < 10) return idCard
  return idCard.slice(0, 6) + '****' + idCard.slice(-4)
}

function handlePrint() {
  window.print()
}

function handleDownload() {
  ElMessage.info('请使用截图功能保存')
}
</script>

<style scoped>
.bib-page {
  max-width: 600px;
}

.bib-card {
  text-align: center;
}

.bib-header {
  margin-bottom: 24px;
}

.bib-header h2 {
  font-size: 24px;
  color: #303133;
  margin-bottom: 8px;
}

.bib-header p {
  color: #909399;
}

.bib-number {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: #fff;
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.bib-number .label {
  display: block;
  font-size: 14px;
  margin-bottom: 8px;
  opacity: 0.9;
}

.bib-number .number {
  font-size: 48px;
  font-weight: bold;
  letter-spacing: 4px;
}

.bib-qrcode {
  margin-bottom: 24px;
}

.bib-qrcode canvas {
  border: 2px solid #ebeef5;
  border-radius: 8px;
}

.bib-info {
  text-align: left;
  margin-bottom: 24px;
}

.bib-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

@media print {
  .bib-actions {
    display: none;
  }
}
</style>
