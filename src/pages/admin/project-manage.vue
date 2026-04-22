<template>
  <view class="page">
    <BackgroundGlow />

    <view class="content">
      <view class="toolbar">
        <view class="toolbar-title">项目管理</view>
        <button class="create-btn" @tap="openCreateModal">创建项目</button>
      </view>

      <view class="filter-panel">
        <view class="filter-grid">
          <view class="filter-item">
            <text class="filter-label">状态</text>
            <picker mode="selector" :range="statusOptions" range-key="label" :value="statusIndex" @change="onStatusChange">
              <view class="filter-value">{{ statusOptions[statusIndex].label }}</view>
            </picker>
          </view>
          <view class="filter-item">
            <text class="filter-label">项目名称</text>
            <input class="filter-input" v-model="queryName" type="text" placeholder="关键字" placeholder-class="placeholder" />
          </view>
          <view class="filter-item">
            <text class="filter-label">创建者ID</text>
            <input class="filter-input" v-model="queryCreatedBy" type="number" placeholder="如 1001" placeholder-class="placeholder" />
          </view>
          <view class="filter-item">
            <text class="filter-label">负责人ID</text>
            <input class="filter-input" v-model="queryResponsibleId" type="number" placeholder="如 2001" placeholder-class="placeholder" />
          </view>
          <view class="filter-item">
            <text class="filter-label">时长最小值</text>
            <PopupDurationPicker v-model="queryDurationMin" title="选择时长最小值" placeholder="小时" :max-hours="24" />
          </view>
          <view class="filter-item">
            <text class="filter-label">时长最大值</text>
            <PopupDurationPicker v-model="queryDurationMax" title="选择时长最大值" placeholder="小时" :max-hours="24" />
          </view>
          <view class="filter-item">
            <text class="filter-label">开始时间下界</text>
            <PopupDateCalendar v-model="queryStartFrom" title="选择开始时间下界" placeholder="请选择" />
          </view>
          <view class="filter-item">
            <text class="filter-label">开始时间上界</text>
            <PopupDateCalendar v-model="queryStartTo" title="选择开始时间上界" placeholder="请选择" />
          </view>
          <view class="filter-item">
            <text class="filter-label">结束时间下界</text>
            <PopupDateCalendar v-model="queryEndFrom" title="选择结束时间下界" placeholder="请选择" />
          </view>
          <view class="filter-item">
            <text class="filter-label">结束时间上界</text>
            <PopupDateCalendar v-model="queryEndTo" title="选择结束时间上界" placeholder="请选择" />
          </view>
        </view>

        <view class="filter-actions">
          <button class="btn btn-secondary" @tap="resetQuery">重置</button>
          <button class="btn btn-primary" @tap="loadProjects(true)">查询</button>
        </view>
      </view>

      <view class="list-panel">
        <view v-if="loading && !projects.length" class="state-row">正在加载项目列表...</view>
        <view v-else-if="errorMessage" class="state-row error">{{ errorMessage }}</view>
        <view v-else-if="!projects.length" class="state-row">暂无符合条件的项目</view>

        <block v-else v-for="item in projects" :key="item.projectId">
          <view class="project-item">
            <view class="project-head">
              <text class="name">{{ item.name }}</text>
              <text class="status">{{ projectStatusTextMap[item.status] }}</text>
            </view>
            <view class="meta">时间：{{ formatProjectDate(item.startTime) }} - {{ formatProjectDate(item.endTime) }}</view>
            <view class="meta">时长：{{ item.durationHours.toFixed(2) }}h ｜ 创建者：{{ item.createdById }} ｜ 负责人：{{ item.responsibleId }}</view>
            <view class="meta">描述：{{ item.description || '无' }}</view>

            <view class="actions">
              <view class="action-slot">
                <button
                  v-if="canOperateProject(item) && item.status === 0"
                  class="item-btn item-btn-start"
                  @tap="updateStatus(item.projectId, 'start')"
                >
                  开启项目
                </button>
                <button
                  v-else-if="canOperateProject(item) && item.status === 1"
                  class="item-btn item-btn-end"
                  @tap="updateStatus(item.projectId, 'end')"
                >
                  结束项目
                </button>
                <view v-else-if="canOperateProject(item)" class="done-text">已结束项目不可变更</view>
                <view v-else class="action-placeholder" aria-hidden="true"></view>
              </view>

              <view class="action-slot">
                <button
                  v-if="isSuperAdmin && item.status !== 2"
                  class="item-btn item-btn-responsible"
                  @tap="openResponsibleModal(item)"
                >
                  修改负责人
                </button>
                <view v-else class="action-placeholder" aria-hidden="true"></view>
              </view>

              <view class="action-slot">
                <button
                  v-if="canExportProject(item)"
                  class="item-btn item-btn-export"
                  :disabled="exportingProjectId === item.projectId"
                  @tap="exportParticipants(item)"
                >
                  {{ exportingProjectId === item.projectId ? '导出中...' : '导出参与信息' }}
                </button>
                <view v-else class="action-placeholder" aria-hidden="true"></view>
              </view>
            </view>
          </view>
        </block>

        <view v-if="projects.length" class="load-more-row">
          <text v-if="loadingMore">加载中...</text>
          <text v-else-if="!hasMore">没有更多了</text>
          <text v-else>上拉加载更多</text>
        </view>
      </view>
    </view>

    <view class="modal-mask" v-if="showCreateModal" @tap="closeCreateModal">
      <view class="modal" @tap.stop>
        <view class="modal-title">创建项目</view>

        <view class="modal-item">
          <text class="modal-label">项目名称</text>
          <input class="modal-input" v-model="createForm.name" type="text" placeholder="请输入项目名称" placeholder-class="placeholder" />
        </view>

        <view class="modal-item">
          <text class="modal-label">项目描述</text>
          <textarea class="modal-textarea" v-model="createForm.description" placeholder="可选" placeholder-class="placeholder" />
        </view>

        <view class="modal-item">
          <text class="modal-label">开始时间</text>
          <view class="datetime-row">
            <view class="datetime-cell">
              <PopupDateCalendar v-model="createForm.startDate" title="选择开始日期" placeholder="开始日期" />
            </view>
            <view class="datetime-cell">
              <PopupTimePicker v-model="createForm.startTime" title="选择开始时间" placeholder="开始时间" />
            </view>
          </view>
        </view>

        <view class="modal-item">
          <text class="modal-label">结束时间</text>
          <view class="datetime-row">
            <view class="datetime-cell">
              <PopupDateCalendar v-model="createForm.endDate" title="选择结束日期" placeholder="结束日期" />
            </view>
            <view class="datetime-cell">
              <PopupTimePicker v-model="createForm.endTime" title="选择结束时间" placeholder="结束时间" />
            </view>
          </view>
          <text class="hint">时间最小单位为半小时（00分或30分）。</text>
        </view>

        <view class="modal-item">
          <text class="modal-label">时长(小时，自动计算)</text>
          <view class="modal-readonly">{{ durationText }}</view>
        </view>

        <view class="modal-item">
          <text class="modal-label">负责人</text>
          <picker mode="selector" :range="adminUserOptions" range-key="label" :value="createResponsibleIndex" @change="onCreateResponsibleChange">
            <view class="modal-picker">{{ selectedCreateResponsibleLabel }}</view>
          </picker>
        </view>

        <view class="modal-actions">
          <button class="btn btn-secondary" @tap="closeCreateModal">取消</button>
          <button class="btn btn-primary" @tap="submitCreate">创建</button>
        </view>
      </view>
    </view>

    <view class="modal-mask" v-if="showResponsibleModal" @tap="closeResponsibleModal">
      <view class="modal" @tap.stop>
        <view class="modal-title">修改负责人</view>
        <view class="modal-item">
          <text class="modal-label">项目</text>
          <view class="modal-readonly">{{ selectedProjectName }}</view>
        </view>
        <view class="modal-item">
          <text class="modal-label">新负责人</text>
          <picker mode="selector" :range="adminUserOptions" range-key="label" :value="responsibleSelectIndex" @change="onResponsibleSelectChange">
            <view class="modal-picker">{{ selectedResponsibleLabel }}</view>
          </picker>
        </view>
        <view class="modal-actions">
          <button class="btn btn-secondary" @tap="closeResponsibleModal">取消</button>
          <button class="btn btn-primary" @tap="submitResponsibleUpdate">确认修改</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'

import BackgroundGlow from '@/components/BackgroundGlow.vue'
import PopupDateCalendar from '@/components/PopupDateCalendar.vue'
import PopupDurationPicker from '@/components/PopupDurationPicker.vue'
import PopupTimePicker from '@/components/PopupTimePicker.vue'
import { useAuthGuard } from '@/composables/useAuthGuard'
import { currentRole } from '@/utils/auth'
import { DEFAULT_PAGE_SIZE, STORAGE_KEYS } from '@/utils/constants'
import { openFunctionEntry } from '@/utils/navigation'
import {
  createAdminProject,
  endAdminProject,
  exportAdminProjectParticipants,
  fetchAdminUsers,
  fetchAdminProjects,
  formatProjectDate,
  projectStatusTextMap,
  startAdminProject,
  updateAdminProjectResponsible,
  type AdminUserItem,
  type AdminProjectItem,
  type ProjectStatus
} from '@/utils/project'

const statusOptions: Array<{ label: string; value: ProjectStatus | null }> = [
  { label: '全部', value: null },
  { label: '草稿', value: 0 },
  { label: '进行中', value: 1 },
  { label: '已结束', value: 2 }
]

const statusIndex = ref(0)
const queryName = ref('')
const queryCreatedBy = ref('')
const queryResponsibleId = ref('')
const queryDurationMin = ref('')
const queryDurationMax = ref('')
const queryStartFrom = ref('')
const queryStartTo = ref('')
const queryEndFrom = ref('')
const queryEndTo = ref('')

const projects = ref<AdminProjectItem[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const errorMessage = ref('')
const page = ref(1)
const hasMore = ref(true)

const PAGE_SIZE = DEFAULT_PAGE_SIZE

const showCreateModal = ref(false)
const showResponsibleModal = ref(false)
const selectedProject = ref<AdminProjectItem | null>(null)
const responsibleSelectIndex = ref(0)
const adminUsers = ref<AdminUserItem[]>([])
const createResponsibleIndex = ref(0)
const exportingProjectId = ref<number | null>(null)

const adminUserOptions = computed(() =>
  adminUsers.value.map((item) => ({
    userId: item.userId,
    label: `${item.name}(${item.studentId})`
  }))
)

const selectedCreateResponsibleLabel = computed(() => {
  if (!adminUserOptions.value.length) {
    return '暂无可选管理员'
  }
  return adminUserOptions.value[createResponsibleIndex.value]?.label || adminUserOptions.value[0].label
})

const selectedResponsibleLabel = computed(() => {
  if (!adminUserOptions.value.length) {
    return '暂无可选管理员'
  }
  return adminUserOptions.value[responsibleSelectIndex.value]?.label || adminUserOptions.value[0].label
})

const selectedProjectName = computed(() => selectedProject.value?.name || '-')
const isSuperAdmin = computed(() => currentRole.value === 3)
const currentUserId = computed(() => {
  const raw = uni.getStorageSync(STORAGE_KEYS.USER_CACHE)
  if (!raw) {
    return 0
  }

  try {
    const parsed = JSON.parse(raw as string) as { userId?: number; user_id?: number }
    return parsed.userId ?? parsed.user_id ?? 0
  } catch {
    return 0
  }
})

const createForm = reactive({
  name: '',
  description: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: ''
})

const toMaybeNumber = (value: string) => {
  if (!value.trim()) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const canOperateProject = (item: AdminProjectItem) => {
  return isSuperAdmin.value || item.responsibleId === currentUserId.value
}

const canExportProject = (item: AdminProjectItem) => {
  return canOperateProject(item) && item.status === 2
}

const toIsoTime = (value: string, endOfDay = false) => {
  if (!value) {
    return undefined
  }
  const suffix = endOfDay ? 'T23:59:59+08:00' : 'T00:00:00+08:00'
  return `${value}${suffix}`
}

const composeIsoDateTime = (date: string, time: string) => {
  if (!date || !time) {
    return ''
  }
  return `${date}T${time}:00+08:00`
}

const durationHours = computed(() => {
  const start = composeIsoDateTime(createForm.startDate, createForm.startTime)
  const end = composeIsoDateTime(createForm.endDate, createForm.endTime)
  if (!start || !end) {
    return 0
  }

  const diff = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60)
  if (!Number.isFinite(diff) || diff <= 0) {
    return 0
  }

  return diff
})

const durationText = computed(() => {
  if (!durationHours.value) {
    return '请先选择开始时间和结束时间'
  }

  return `${durationHours.value.toFixed(1)} 小时`
})

const onStatusChange = (event: { detail: { value: string } }) => {
  statusIndex.value = Number(event.detail.value)
}

const onCreateResponsibleChange = (event: { detail: { value: string } }) => {
  createResponsibleIndex.value = Number(event.detail.value)
}

const onResponsibleSelectChange = (event: { detail: { value: string } }) => {
  responsibleSelectIndex.value = Number(event.detail.value)
}

const buildQuery = () => ({
  status: statusOptions[statusIndex.value].value ?? undefined,
  name: queryName.value.trim() || undefined,
  createdById: toMaybeNumber(queryCreatedBy.value),
  responsibleId: toMaybeNumber(queryResponsibleId.value),
  durationHoursMin: toMaybeNumber(queryDurationMin.value),
  durationHoursMax: toMaybeNumber(queryDurationMax.value),
  startTimeFrom: toIsoTime(queryStartFrom.value, false),
  startTimeTo: toIsoTime(queryStartTo.value, true),
  endTimeFrom: toIsoTime(queryEndFrom.value, false),
  endTimeTo: toIsoTime(queryEndTo.value, true),
  page: page.value,
  pageSize: PAGE_SIZE
})

const appendUniqueProjects = (existing: AdminProjectItem[], incoming: AdminProjectItem[]) => {
  const seen = new Set(existing.map((item) => item.projectId))
  const next = [...existing]
  incoming.forEach((item) => {
    if (seen.has(item.projectId)) {
      return
    }
    next.push(item)
    seen.add(item.projectId)
  })
  return next
}

const loadProjects = async (reset = false) => {
  if (reset) {
    loading.value = true
    loadingMore.value = false
    errorMessage.value = ''
    page.value = 1
    hasMore.value = true
    projects.value = []
  } else {
    if (!hasMore.value || loadingMore.value || loading.value) {
      return
    }
    loadingMore.value = true
  }

  errorMessage.value = ''

  try {
    const data = await fetchAdminProjects(buildQuery())
    const pageItems = data.items
    projects.value = reset ? pageItems : appendUniqueProjects(projects.value, pageItems)
    hasMore.value = projects.value.length < data.total && data.items.length === PAGE_SIZE
    if (data.items.length > 0) {
      page.value += 1
    }
  } catch {
    if (reset) {
      errorMessage.value = '项目列表加载失败，请下拉重试'
      projects.value = []
    } else {
      uni.showToast({ title: '加载下一页失败，请重试', icon: 'none' })
    }
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const resetQuery = async () => {
  statusIndex.value = 0
  queryName.value = ''
  queryCreatedBy.value = ''
  queryResponsibleId.value = ''
  queryDurationMin.value = ''
  queryDurationMax.value = ''
  queryStartFrom.value = ''
  queryStartTo.value = ''
  queryEndFrom.value = ''
  queryEndTo.value = ''
  await loadProjects(true)
}

const updateStatus = async (projectId: number, mode: 'start' | 'end') => {
  try {
    if (mode === 'start') {
      await startAdminProject(projectId)
      uni.showToast({ title: '项目已开启', icon: 'none' })
    } else {
      await endAdminProject(projectId)
      uni.showToast({ title: '项目已结束', icon: 'none' })
    }
    await loadProjects(true)
  } catch {
    uni.showToast({ title: '状态更新失败', icon: 'none' })
  }
}

const openCreateModal = () => {
  if (!isSuperAdmin.value) {
    uni.showToast({ title: '仅超级管理员可创建项目', icon: 'none' })
    return
  }

  if (!adminUserOptions.value.length) {
    uni.showToast({ title: '管理员列表为空，无法创建项目', icon: 'none' })
    return
  }

  createResponsibleIndex.value = 0

  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
}

const resetCreateForm = () => {
  createForm.name = ''
  createForm.description = ''
  createForm.startDate = ''
  createForm.startTime = ''
  createForm.endDate = ''
  createForm.endTime = ''
  createResponsibleIndex.value = 0
}

const submitCreate = async () => {
  if (!createForm.name.trim()) {
    uni.showToast({ title: '请填写项目名称', icon: 'none' })
    return
  }

  if (!createForm.startDate || !createForm.startTime || !createForm.endDate || !createForm.endTime) {
    uni.showToast({ title: '请选择完整的开始和结束时间', icon: 'none' })
    return
  }

  const startTime = composeIsoDateTime(createForm.startDate, createForm.startTime)
  const endTime = composeIsoDateTime(createForm.endDate, createForm.endTime)

  if (!startTime || !endTime || durationHours.value <= 0) {
    uni.showToast({ title: '结束时间需晚于开始时间', icon: 'none' })
    return
  }

  if ((durationHours.value * 10) % 5 !== 0) {
    uni.showToast({ title: '时间差需为半小时的倍数', icon: 'none' })
    return
  }

  const selectedResponsible = adminUserOptions.value[createResponsibleIndex.value]
  if (!selectedResponsible) {
    uni.showToast({ title: '请选择负责人', icon: 'none' })
    return
  }

  try {
    await createAdminProject({
      name: createForm.name.trim(),
      description: createForm.description.trim() || undefined,
      startTime,
      endTime,
      durationHours: durationHours.value,
      responsibleId: selectedResponsible.userId
    })
    uni.showToast({ title: '项目创建成功', icon: 'none' })
    closeCreateModal()
    resetCreateForm()
    await loadProjects(true)
  } catch {
    uni.showToast({ title: '项目创建失败', icon: 'none' })
  }
}

const openResponsibleModal = (item: AdminProjectItem) => {
  if (item.status === 2) {
    uni.showToast({ title: '项目已结束，不能修改负责人', icon: 'none' })
    return
  }

  selectedProject.value = item
  const targetIndex = adminUserOptions.value.findIndex((option) => option.userId === item.responsibleId)
  responsibleSelectIndex.value = targetIndex >= 0 ? targetIndex : 0
  showResponsibleModal.value = true
}

const closeResponsibleModal = () => {
  showResponsibleModal.value = false
  selectedProject.value = null
  responsibleSelectIndex.value = 0
}

const submitResponsibleUpdate = async () => {
  if (!selectedProject.value) {
    return
  }

  if (selectedProject.value.status === 2) {
    uni.showToast({ title: '项目已结束，不能修改负责人', icon: 'none' })
    closeResponsibleModal()
    return
  }

  const selectedResponsible = adminUserOptions.value[responsibleSelectIndex.value]
  if (!selectedResponsible) {
    uni.showToast({ title: '请选择有效负责人', icon: 'none' })
    return
  }

  const responsibleId = selectedResponsible.userId

  try {
    await updateAdminProjectResponsible(selectedProject.value.projectId, responsibleId)
    uni.showToast({ title: '负责人修改成功', icon: 'none' })
    closeResponsibleModal()
    await loadProjects(true)
  } catch {
    uni.showToast({ title: '负责人修改失败', icon: 'none' })
  }
}

const exportParticipants = async (item: AdminProjectItem) => {
  if (item.status !== 2) {
    uni.showToast({ title: '仅已结束项目可导出', icon: 'none' })
    return
  }

  if (exportingProjectId.value !== null) {
    return
  }

  exportingProjectId.value = item.projectId
  uni.showLoading({ title: '正在导出' })

  try {
    const filePath = await exportAdminProjectParticipants(item.projectId)
    uni.hideLoading()
    uni.showToast({ title: '导出成功', icon: 'none' })

    if (filePath) {
      uni.openDocument({
        filePath,
        fileType: 'xlsx',
        showMenu: true,
        fail: () => {
          uni.showToast({ title: '文件已保存', icon: 'none' })
        }
      })
    }
  } catch {
    uni.hideLoading()
    uni.showToast({ title: '导出失败，请重试', icon: 'none' })
  } finally {
    exportingProjectId.value = null
  }
}

useAuthGuard({
  routePath: '/pages/admin/project-manage',
  roleCheck: (role) => role === 2 || role === 3,
  onForbidden: () => {
    openFunctionEntry()
  },
  onAuthorized: async () => {
    try {
      const users = await fetchAdminUsers()
      adminUsers.value = users.filter((item) => item.role === 2 || item.role === 3)
    } catch {
      adminUsers.value = []
      uni.showToast({ title: '管理员列表加载失败', icon: 'none' })
    }
    await loadProjects(true)
  }
})

onReachBottom(async () => {
  await loadProjects(false)
})

onPullDownRefresh(async () => {
  await loadProjects(true)
  uni.stopPullDownRefresh()
})
</script>

<style scoped lang="scss">
.page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(245, 224, 157, 0.55), transparent 34%),
    radial-gradient(circle at bottom right, rgba(92, 119, 255, 0.12), transparent 32%),
    linear-gradient(180deg, #f7f6ef 0%, #f4f1e6 100%);
}

.content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  padding: 24rpx;
  box-sizing: border-box;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.toolbar-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #1f2937;
}

.create-btn {
  margin: 0;
  width: 200rpx;
  height: 68rpx;
  border-radius: 12rpx;
  color: #fff;
  font-size: 24rpx;
  font-weight: 600;
  border: none;
  background: linear-gradient(135deg, #2d7b7c 0%, #3ea88f 100%);
}

.create-btn::after {
  border: none;
}

.filter-panel,
.list-panel {
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.88);
  border: 1rpx solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 12rpx 26rpx rgba(15, 23, 42, 0.08);
}

.filter-panel {
  padding: 16rpx;
  margin-bottom: 16rpx;
}

.filter-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.filter-item {
  width: calc(50% - 6rpx);
  min-height: 120rpx;
  border: 1rpx solid #e5e7eb;
  border-radius: 12rpx;
  background: #f8fafc;
  padding: 10rpx 12rpx;
  box-sizing: border-box;
}

.filter-label {
  display: block;
  font-size: 20rpx;
  color: #6b7280;
  margin-bottom: 8rpx;
}

.filter-value,
.filter-input {
  min-height: 44rpx;
  font-size: 24rpx;
  color: #111827;
  font-weight: 500;
}

.filter-actions {
  margin-top: 16rpx;
  display: flex;
  justify-content: flex-end;
  gap: 12rpx;
}

.btn {
  margin: 0;
  width: 156rpx;
  height: 62rpx;
  border-radius: 12rpx;
  font-size: 24rpx;
  border: none;
}

.btn::after {
  border: none;
}

.btn-primary {
  color: #fff;
  background: linear-gradient(135deg, #2d7b7c 0%, #3ea88f 100%);
}

.btn-secondary {
  color: #374151;
  background: #e5e7eb;
}

.list-panel {
  padding: 14rpx 16rpx;
}

.state-row {
  text-align: center;
  padding: 22rpx 0;
  font-size: 24rpx;
  color: #6b7280;
}

.state-row.error {
  color: #b42318;
}

.project-item {
  border-bottom: 1rpx dashed #d1d5db;
  padding: 14rpx 0;
}

.project-item:last-child {
  border-bottom: none;
}

.project-head {
  display: flex;
  justify-content: space-between;
  gap: 16rpx;
}

.name {
  font-size: 28rpx;
  font-weight: 700;
  color: #1f2937;
}

.status {
  font-size: 22rpx;
  color: #334155;
  background: #e2e8f0;
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
}

.meta {
  margin-top: 6rpx;
  color: #6b7280;
  font-size: 22rpx;
}

.actions {
  margin-top: 10rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.action-slot {
  flex: 1;
  min-width: 0;
}

.item-btn {
  margin: 0;
  width: 100%;
  height: 60rpx;
  border: none;
  border-radius: 10rpx;
  color: #fff;
  font-size: 22rpx;
  font-weight: 600;
}

.item-btn::after {
  border: none;
}

.item-btn-start {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.item-btn-end {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
}

.item-btn-responsible {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}

.item-btn-export {
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
}

.done-text {
  width: 100%;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 22rpx;
  border-radius: 10rpx;
  background: rgba(148, 163, 184, 0.14);
}

.action-placeholder {
  width: 100%;
  height: 60rpx;
  border-radius: 10rpx;
  background: transparent;
}

.load-more-row {
  padding: 20rpx 0 10rpx;
  text-align: center;
  color: #6b7280;
  font-size: 22rpx;
}

.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 10;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx;
  box-sizing: border-box;
}

.modal {
  width: 100%;
  max-width: 720rpx;
  border-radius: 20rpx;
  background: #fff;
  padding: 24rpx;
  box-sizing: border-box;
}

.modal-title {
  text-align: center;
  font-size: 32rpx;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12rpx;
}

.modal-item {
  margin-bottom: 14rpx;
}

.modal-label {
  display: block;
  font-size: 22rpx;
  color: #6b7280;
  margin-bottom: 8rpx;
}

.modal-input,
.modal-picker,
.modal-textarea,
.modal-readonly {
  width: 100%;
  box-sizing: border-box;
  border-radius: 10rpx;
  border: 1rpx solid #d1d5db;
  background: #f8fafc;
  padding: 16rpx;
  font-size: 24rpx;
  color: #111827;
  min-height: 64rpx;
}

.modal-readonly {
  color: #334155;
  font-weight: 600;
}

.datetime-row {
  display: flex;
  gap: 12rpx;
}

.datetime-cell {
  flex: 1;
  min-width: 0;
}

.modal-textarea {
  min-height: 176rpx;
}

.hint {
  display: block;
  margin-top: 8rpx;
  font-size: 20rpx;
  color: #64748b;
}

.modal-actions {
  margin-top: 12rpx;
  display: flex;
  justify-content: flex-end;
  gap: 12rpx;
}

.placeholder {
  color: #9ca3af;
}
</style>
