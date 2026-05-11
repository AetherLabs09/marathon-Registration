<template>
  <div class="admin-events">
    <el-card>
      <div class="toolbar">
        <el-button type="primary" @click="handleAdd">新增赛事</el-button>
      </div>

      <el-table :data="events" v-loading="loading" stripe>
        <el-table-column prop="name" label="赛事名称" min-width="200" />
        <el-table-column prop="location" label="地点" width="150" />
        <el-table-column label="比赛时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.start_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="success" @click="handleChangeStatus(row)">状态</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          :page-size="pagination.limit"
          :total="pagination.total"
          layout="total, prev, pager, next"
          @current-change="fetchEvents"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑赛事' : '新增赛事'" width="700px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="赛事名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入赛事名称" />
        </el-form-item>
        <el-form-item label="比赛地点" prop="location">
          <el-input v-model="form.location" placeholder="请输入比赛地点" />
        </el-form-item>
        <el-form-item label="赛事简介" prop="description">
          <el-input v-model="form.description" type="textarea" rows="3" placeholder="请输入赛事简介" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="比赛时间" prop="start_time">
              <el-date-picker v-model="form.start_time" type="datetime" placeholder="选择比赛时间" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" prop="end_time">
              <el-date-picker v-model="form.end_time" type="datetime" placeholder="选择结束时间" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="报名开始" prop="registration_start">
              <el-date-picker v-model="form.registration_start" type="datetime" placeholder="选择报名开始时间" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="报名截止" prop="registration_end">
              <el-date-picker v-model="form.registration_end" type="datetime" placeholder="选择报名截止时间" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="比赛规则" prop="rules">
          <el-input v-model="form.rules" type="textarea" rows="4" placeholder="请输入比赛规则" />
        </el-form-item>
        <el-form-item label="参赛要求" prop="requirements">
          <el-input v-model="form.requirements" type="textarea" rows="3" placeholder="请输入参赛要求" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="statusDialogVisible" title="修改状态" width="400px">
      <el-form label-width="80px">
        <el-form-item label="赛事状态">
          <el-select v-model="newStatus" placeholder="请选择状态">
            <el-option label="即将开始" value="upcoming" />
            <el-option label="报名中" value="open" />
            <el-option label="报名截止" value="closed" />
            <el-option label="进行中" value="ongoing" />
            <el-option label="已结束" value="finished" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveStatus">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../../utils/api'

const events = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const statusDialogVisible = ref(false)
const isEdit = ref(false)
const currentEvent = ref(null)
const newStatus = ref('')

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

const formRef = ref(null)
const form = reactive({
  name: '',
  location: '',
  description: '',
  start_time: '',
  end_time: '',
  registration_start: '',
  registration_end: '',
  rules: '',
  requirements: ''
})

const rules = {
  name: [{ required: true, message: '请输入赛事名称', trigger: 'blur' }],
  location: [{ required: true, message: '请输入比赛地点', trigger: 'blur' }],
  start_time: [{ required: true, message: '请选择比赛时间', trigger: 'change' }],
  end_time: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  registration_start: [{ required: true, message: '请选择报名开始时间', trigger: 'change' }],
  registration_end: [{ required: true, message: '请选择报名截止时间', trigger: 'change' }]
}

onMounted(() => {
  fetchEvents()
})

async function fetchEvents() {
  loading.value = true
  try {
    const res = await api.get('/admin/events', { params: pagination })
    events.value = res.data
    pagination.total = res.total
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('zh-CN')
}

function getStatusType(status) {
  const types = { open: 'success', upcoming: 'primary', closed: 'info', ongoing: 'warning', finished: 'info' }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = { open: '报名中', upcoming: '即将开始', closed: '报名截止', ongoing: '进行中', finished: '已结束' }
  return texts[status] || status
}

function resetForm() {
  Object.assign(form, {
    name: '', location: '', description: '',
    start_time: '', end_time: '',
    registration_start: '', registration_end: '',
    rules: '', requirements: ''
  })
}

function handleAdd() {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  currentEvent.value = row
  Object.assign(form, {
    name: row.name,
    location: row.location,
    description: row.description,
    start_time: row.start_time,
    end_time: row.end_time,
    registration_start: row.registration_start,
    registration_end: row.registration_end,
    rules: row.rules,
    requirements: row.requirements
  })
  dialogVisible.value = true
}

async function handleSave() {
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  saving.value = true
  try {
    const data = { ...form }
    if (isEdit.value) {
      await api.put(`/admin/events/${currentEvent.value.id}`, data)
      ElMessage.success('更新成功')
    } else {
      await api.post('/admin/events', data)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchEvents()
  } catch (error) {
    console.error(error)
  } finally {
    saving.value = false
  }
}

function handleChangeStatus(row) {
  currentEvent.value = row
  newStatus.value = row.status
  statusDialogVisible.value = true
}

async function handleSaveStatus() {
  try {
    await api.put(`/admin/events/${currentEvent.value.id}/status`, { status: newStatus.value })
    ElMessage.success('状态更新成功')
    statusDialogVisible.value = false
    fetchEvents()
  } catch (error) {
    console.error(error)
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确认删除该赛事？此操作不可恢复', '删除确认', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await api.delete(`/admin/events/${row.id}`)
    ElMessage.success('删除成功')
    fetchEvents()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
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
