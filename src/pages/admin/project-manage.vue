<template>
  <view class="page">
    <BackgroundGlow />

    <view class="content">
      <ProjectRecordSection
        title="项目列表"
        :items="projectRecordItems"
        :loading="loading && !projects.length"
        :loading-more="loadingMore"
        :has-more="hasMore"
        :error-message="errorMessage"
        loading-text="正在加载项目列表..."
        empty-text="暂无符合条件的项目"
        no-more-text="没有更多了"
      >
        <template #header-actions>
          <button class="create-btn" @tap="openCreateModal">创建项目</button>
        </template>

        <template #filters>
          <SegmentFilter :model-value="statusFilterValue" :options="statusFilterOptions" @change="onStatusFilterChange" />

          <view class="filter-bar">
            <view class="filter-bar-item">
              <FilterInput v-model="queryName" label="项目名称" placeholder="请输入项目名称关键字" />
            </view>

            <view class="filter-bar-item">
              <DateRangeFilter
                :start="queryDateFrom"
                :end="queryDateTo"
                label="时间范围"
                placeholder="请选择时间范围"
                @open="openDateRangePopup"
              />
            </view>

            <view class="filter-bar-item">
              <DurationRangeFilter
                :min="queryDurationMin"
                :max="queryDurationMax"
                label="时长范围"
                placeholder="请选择时长范围"
                @open="openDurationRangePopup"
              />
            </view>
          </view>
        </template>
      </ProjectRecordSection>
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
        </view>

        <view class="modal-item">
          <text class="modal-label">时长(自动计算)</text>
          <view class="modal-readonly">{{ durationText }}</view>
        </view>

        <view class="modal-item">
          <text class="modal-label">负责人</text>
          <PopupResponsiblePicker
            v-model="createResponsibleId"
            :options="adminUserOptions"
            title="选择负责人"
            placeholder="请选择负责人"
            empty-text="暂无可选管理员"
          />
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
          <PopupResponsiblePicker
            v-model="selectedResponsibleId"
            :options="adminUserOptions"
            title="选择新负责人"
            placeholder="请选择负责人"
            empty-text="暂无可选管理员"
          />
        </view>
        <view class="modal-actions">
          <button class="btn btn-secondary" @tap="closeResponsibleModal">取消</button>
          <button class="btn btn-primary" @tap="submitResponsibleUpdate">确认修改</button>
        </view>
      </view>
    </view>

    <DateRangePopup v-model:visible="dateRangePopupVisible" v-model:start="queryDateFrom" v-model:end="queryDateTo" label="时间范围" />

    <DurationRangePopup
      v-model:visible="durationRangePopupVisible"
      v-model:min="queryDurationMin"
      v-model:max="queryDurationMax"
      label="时长范围"
      :max-hours="24"
    />

    <view v-if="showQrModal" class="modal-mask qr-modal-mask" @tap="closeQrModal">
      <view class="modal qr-modal" @tap.stop>
        <view class="modal-title">{{ activeModeLabel }} - {{ activeProjectName }}</view>
        <view class="modal-subtitle">自动轮询中（2秒/次）</view>

        <view class="qr-wrap" :style="{ borderColor: currentQrColorHex }">
          <image v-if="qrImageUrl" class="qr-image" :src="qrImageUrl" mode="aspectFit" />
          <view v-else class="empty">正在获取二维码...</view>
        </view>

        <view class="token">{{ shortToken || '-' }}</view>
        <view class="refresh-time">最近刷新：{{ lastRefreshAt || '-' }}</view>

        <view class="modal-actions">
          <button class="btn btn-secondary qr-close-btn" @tap="closeQrModal">关闭并停止</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { onHide, onPullDownRefresh, onReachBottom, onUnload } from '@dcloudio/uni-app'

import BackgroundGlow from '@/components/BackgroundGlow.vue'
import DateRangeFilter from '@/components/DateRangeFilter.vue'
import DateRangePopup from '@/components/DateRangePopup.vue'
import DurationRangeFilter from '@/components/DurationRangeFilter.vue'
import DurationRangePopup from '@/components/DurationRangePopup.vue'
import FilterInput from '@/components/FilterInput.vue'
import PopupDateCalendar from '@/components/PopupDateCalendar.vue'
import PopupResponsiblePicker from '@/components/PopupResponsiblePicker.vue'
import PopupTimePicker from '@/components/PopupTimePicker.vue'
import ProjectRecordSection, { type ProjectRecordItem } from '@/components/ProjectRecordSection.vue'
import SegmentFilter from '@/components/SegmentFilter.vue'
import { useAuthGuard } from '@/composables/useAuthGuard'
import { currentRole, currentUserId } from '@/utils/auth'
import { DEFAULT_PAGE_SIZE } from '@/utils/constants'
import { openFunctionEntry } from '@/utils/navigation'
import {
  createAdminProject,
  endAdminProject,
  exportAdminProjectParticipants,
  fetchAdminUsers,
  fetchAdminProjects,
  fetchProjectQr,
  formatProjectDate,
  startAdminProject,
  updateAdminProjectResponsible,
  type AdminUserItem,
  type AdminProjectItem,
  type ProjectStatus,
  type QrMode
} from '@/utils/project'

const statusOptionsAll: Array<{ label: string; value: ProjectStatus | null }> = [
  { label: '全部', value: null },
  { label: '草稿', value: 0 },
  { label: '进行中', value: 1 },
  { label: '已结束', value: 2 }
]

const statusIndex = ref(0)
const queryName = ref('')
const queryDurationMin = ref('')
const queryDurationMax = ref('')
const queryDateFrom = ref('')
const queryDateTo = ref('')
const dateRangePopupVisible = ref(false)
const durationRangePopupVisible = ref(false)

const projects = ref<AdminProjectItem[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const errorMessage = ref('')
const page = ref(1)
const hasMore = ref(true)

const PAGE_SIZE = DEFAULT_PAGE_SIZE

const showCreateModal = ref(false)
const showResponsibleModal = ref(false)
const showQrModal = ref(false)
const selectedProject = ref<AdminProjectItem | null>(null)
const selectedResponsibleId = ref<number | null>(null)
const adminUsers = ref<AdminUserItem[]>([])
const createResponsibleId = ref<number | null>(null)
const exportingProjectId = ref<number | null>(null)
const activeProject = ref<AdminProjectItem | null>(null)
const activeMode = ref<QrMode>('checkin')
const activeToken = ref('')
const lastRefreshAt = ref('')
const qrNonce = ref(0)
let autoQueryTimer: ReturnType<typeof setTimeout> | null = null
let autoQueryReady = false
let qrTimer: ReturnType<typeof setInterval> | null = null

const pollIntervalMs = 2000
const qrColors = ['#2b7a78', '#5f60e7', '#e26464', '#ea580c', '#0f766e', '#7c3aed']
const qrColorIndex = ref(0)

const adminUserOptions = computed(() =>
  adminUsers.value.map((item) => ({
    value: item.userId,
    label: `${item.name}(${item.studentId})`
  }))
)

const selectedProjectName = computed(() => selectedProject.value?.projectName || '-')
const activeProjectName = computed(() => activeProject.value?.projectName || '-')
const activeModeLabel = computed(() => (activeMode.value === 'checkin' ? '签到二维码' : '签退二维码'))
const currentQrColorHex = computed(() => qrColors[qrColorIndex.value % qrColors.length])
const isSuperAdmin = computed(() => currentRole.value === 3)
const statusOptions = computed(() =>
  isSuperAdmin.value ? statusOptionsAll : statusOptionsAll.filter((item) => item.value !== 0)
)
const statusFilterOptions = computed(() =>
  statusOptions.value.map((item) => ({
    label: item.label,
    value: item.value === null ? 'all' : String(item.value)
  }))
)
const statusFilterValue = computed(() => {
  const currentValue = statusOptions.value[statusIndex.value]?.value
  return currentValue === null || currentValue === undefined ? 'all' : String(currentValue)
})
const qrImageUrl = computed(() => {
  if (!activeToken.value) {
    return ''
  }

  const token = encodeURIComponent(activeToken.value)
  const color = colorToApiParam(currentQrColorHex.value)
  return `https://api.qrserver.com/v1/create-qr-code/?size=480x480&data=${token}&color=${color}&bgcolor=255-255-255&cb=${qrNonce.value}`
})
const shortToken = computed(() => {
  if (!activeToken.value) {
    return ''
  }

  return activeToken.value.length > 24
    ? `${activeToken.value.slice(0, 10)}...${activeToken.value.slice(-10)}`
    : activeToken.value
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

const colorToApiParam = (hex: string) => {
  const value = hex.replace('#', '')
  if (value.length !== 6) {
    return '43-122-120'
  }

  const r = Number.parseInt(value.slice(0, 2), 16)
  const g = Number.parseInt(value.slice(2, 4), 16)
  const b = Number.parseInt(value.slice(4, 6), 16)
  return `${r}-${g}-${b}`
}

const canOperateProject = (item: AdminProjectItem) => {
  return isSuperAdmin.value || item.responsibleId === currentUserId.value
}

const getProjectCardStatus = (item: AdminProjectItem) => {
  if (!isSuperAdmin.value && !canOperateProject(item)) {
    return {
      text: '不负责',
      className: 'status-neutral'
    }
  }

  if (item.status === 1) {
    return {
      text: '进行中',
      className: 'status-running'
    }
  }

  if (item.status === 0) {
    return {
      text: '草稿',
      className: 'status-neutral'
    }
  }

  return {
    text: '已结束',
    className: 'status-neutral'
  }
}

const canExportProject = (item: AdminProjectItem) => {
  return canOperateProject(item) && item.status === 2
}

const buildProjectInfoCard = (item: AdminProjectItem) => {
  const statusInfo = getProjectCardStatus(item)
  const canOperate = canOperateProject(item)
  const canExport = canExportProject(item)
  const isExporting = exportingProjectId.value === item.projectId

  const firstButton = canOperate
    ? item.status === 0
      ? {
          text: '开启项目',
          type: 2 as const,
          onTap: async () => {
            await updateStatus(item.projectId, 'start')
          }
        }
      : item.status === 1
        ? {
            text: '结束项目',
            type: 3 as const,
            onTap: async () => {
              await updateStatus(item.projectId, 'end')
            }
          }
        : {
            text: '',
            type: 0 as const
          }
    : {
        text: '',
        type: 0 as const
      }

  const secondButton = isSuperAdmin.value && item.status !== 2
    ? {
        text: '修改负责人',
        type: 1 as const,
        onTap: () => {
          openResponsibleModal(item)
        }
      }
    : {
        text: '',
        type: 0 as const
      }

  const thirdButton = canExport
    ? {
        text: isExporting ? '导出中...' : '导出参与信息',
        type: 1 as const,
        loading: isExporting,
        loadingText: '导出中...',
        onTap: async () => {
          await exportParticipants(item)
        }
      }
    : {
        text: '',
        type: 0 as const
      }

  const qrButtons = item.status === 1
    ? [
        {
          text: '签到码',
          type: 2 as const,
          onTap: async () => {
            await openQrModal(item, 'checkin')
          }
        },
        {
          text: '签退码',
          type: 4 as const,
          onTap: async () => {
            await openQrModal(item, 'checkout')
          }
        }
      ]
    : []

  return {
    title: {
      text: item.projectName
    },
    tag: {
      text: statusInfo.text,
      when: statusInfo.className === 'status-running' ? 'running' : 'neutral',
      matchers: [
        { when: 'running', type: 2 as const },
        { when: 'neutral', type: 1 as const }
      ]
    },
    rows: [
      [{ text: `描述：${item.description || '无'}` }],
      [{ text: `时间：${formatProjectDate(item.designStartTime)} - ${formatProjectDate(item.designEndTime)}` }],
      [
        { text: `创建：${item.creatorName || '未命名用户'}` },
        { text: `负责：${item.responsibleName || '未分配负责人'}` },
        { text: `时长：${item.designVolunteerHours.toFixed(2)}h` }
      ]
    ],
    buttonRows: qrButtons.length
      ? [
          [firstButton, secondButton, thirdButton],
          qrButtons
        ]
      : [[firstButton, secondButton, thirdButton]]
  }
}

const projectRecordItems = computed<ProjectRecordItem[]>(() => {
  return projects.value.map((item) => ({
    id: item.projectId,
    card: buildProjectInfoCard(item)
  }))
})

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

const onStatusFilterChange = (value: string) => {
  const nextIndex = statusOptions.value.findIndex((item) => {
    const optionValue = item.value === null ? 'all' : String(item.value)
    return optionValue === value
  })

  statusIndex.value = nextIndex >= 0 ? nextIndex : 0
}

const openDateRangePopup = () => {
  dateRangePopupVisible.value = true
}

const openDurationRangePopup = () => {
  durationRangePopupVisible.value = true
}

const triggerAutoQuery = (immediate = false) => {
  if (!autoQueryReady) {
    return
  }

  if (autoQueryTimer) {
    clearTimeout(autoQueryTimer)
    autoQueryTimer = null
  }

  if (immediate) {
    void loadProjects(true)
    return
  }

  autoQueryTimer = setTimeout(() => {
    autoQueryTimer = null
    void loadProjects(true)
  }, 260)
}

const buildQuery = () => ({
  status: statusOptions.value[statusIndex.value]?.value ?? undefined,
  name: queryName.value.trim() || undefined,
  durationHoursMin: toMaybeNumber(queryDurationMin.value),
  durationHoursMax: toMaybeNumber(queryDurationMax.value),
  startTimeFrom: toIsoTime(queryDateFrom.value, false),
  endTimeTo: toIsoTime(queryDateTo.value, true),
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

const clearQrPollingTimer = () => {
  if (qrTimer) {
    clearInterval(qrTimer)
    qrTimer = null
  }
}

const refreshQr = async () => {
  if (!activeProject.value) {
    return
  }

  try {
    const data = await fetchProjectQr(activeProject.value.projectId, activeMode.value)
    const changed = activeToken.value !== data.token
    activeToken.value = data.token
    if (changed) {
      qrColorIndex.value = (qrColorIndex.value + 1) % qrColors.length
      qrNonce.value += 1
    }
    lastRefreshAt.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  } catch {
    uni.showToast({ title: '二维码获取失败', icon: 'none' })
  }
}

const startQrPolling = async () => {
  clearQrPollingTimer()
  await refreshQr()
  qrTimer = setInterval(() => {
    void refreshQr()
  }, pollIntervalMs)
}

const openQrModal = async (project: AdminProjectItem, mode: QrMode) => {
  activeProject.value = project
  activeMode.value = mode
  activeToken.value = ''
  qrColorIndex.value = 0
  qrNonce.value = 0
  lastRefreshAt.value = ''
  showQrModal.value = true
  await startQrPolling()
}

const closeQrModal = () => {
  showQrModal.value = false
  clearQrPollingTimer()
  activeProject.value = null
  activeToken.value = ''
  lastRefreshAt.value = ''
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
    const pageItems = isSuperAdmin.value ? data.items : data.items.filter((item) => item.status !== 0)
    projects.value = reset ? pageItems : appendUniqueProjects(projects.value, pageItems)
    hasMore.value = isSuperAdmin.value
      ? projects.value.length < data.total && data.items.length === PAGE_SIZE
      : data.items.length === PAGE_SIZE
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

  createResponsibleId.value = adminUserOptions.value[0]?.value ?? null

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
  createResponsibleId.value = adminUserOptions.value[0]?.value ?? null
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

  const selectedResponsible = adminUserOptions.value.find((item) => item.value === createResponsibleId.value)
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
      responsibleId: Number(selectedResponsible.value)
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
  selectedResponsibleId.value = adminUserOptions.value.some((option) => option.value === item.responsibleId)
    ? item.responsibleId
    : (adminUserOptions.value[0]?.value ?? null)
  showResponsibleModal.value = true
}

const closeResponsibleModal = () => {
  showResponsibleModal.value = false
  selectedProject.value = null
  selectedResponsibleId.value = null
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

  const selectedResponsible = adminUserOptions.value.find((item) => item.value === selectedResponsibleId.value)
  if (!selectedResponsible) {
    uni.showToast({ title: '请选择有效负责人', icon: 'none' })
    return
  }

  const responsibleId = Number(selectedResponsible.value)

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
    autoQueryReady = true
  }
})

watch(statusIndex, () => {
  triggerAutoQuery(true)
})

watch(queryName, () => {
  triggerAutoQuery(false)
})

watch([queryDurationMin, queryDurationMax], () => {
  triggerAutoQuery(true)
})

watch([queryDateFrom, queryDateTo], () => {
  triggerAutoQuery(true)
})

onReachBottom(async () => {
  await loadProjects(false)
})

onPullDownRefresh(async () => {
  await loadProjects(true)
  uni.stopPullDownRefresh()
})

onHide(() => {
  closeQrModal()
})

onUnload(() => {
  closeQrModal()
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
  padding: 24rpx 0;
  box-sizing: border-box;
}

.create-btn {
  margin: 0;
  width: 200rpx;
  height: 62rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 14rpx;
  color: #2b7a78;
  font-size: 20rpx;
  line-height: 1;
  text-align: center;
  font-weight: 600;
  border: 1rpx solid #2b7a78;
  background: rgba(240, 253, 250, 0.92);
  box-sizing: border-box;
  box-shadow:
    inset 0 0 0 2rpx #2b7a78,
    inset 0 1rpx 0 rgba(255, 255, 255, 0.96),
    0 6rpx 16rpx rgba(15, 23, 42, 0.06);
}

.create-btn::after {
  border: none;
}

.filter-bar {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  width: 100%;
  box-sizing: border-box;
}

.filter-bar-item {
  width: 100%;
  min-width: 0;
  flex: 0 0 auto;
}

.btn {
  margin: 0;
  width: 156rpx;
  height: 66rpx;
  border-radius: 10rpx;
  font-size: 28rpx;
  line-height: 66rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.btn::after {
  border: none;
}

.btn-primary {
  color: #422006;
  background: linear-gradient(135deg, #facc15 0%, #f59e0b 100%);
}

.btn-secondary {
  color: #374151;
  background: #e5e7eb;
}

.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 10;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx;
  box-sizing: border-box;
}

.modal {
  width: 100%;
  max-width: 680rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.72);
  border: 1rpx solid rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  box-shadow: 0 20rpx 48rpx rgba(15, 23, 42, 0.22);
  padding: 24rpx;
  box-sizing: border-box;
}

.modal-title {
  text-align: center;
  font-size: 30rpx;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 16rpx;
}

.modal-item {
  margin-bottom: 16rpx;
}

.modal-label {
  display: block;
  font-size: 24rpx;
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
  background: #ffffff;
  padding: 0 12rpx;
  font-size: 24rpx;
  color: #111827;
  min-height: 68rpx;
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.96),
    0 6rpx 16rpx rgba(15, 23, 42, 0.06);
}

.modal-readonly {
  color: #334155;
  font-weight: 600;
  display: flex;
  align-items: center;
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
  padding-top: 16rpx;
  padding-bottom: 16rpx;
}

.modal-actions {
  margin-top: 20rpx;
  display: flex;
  justify-content: flex-end;
  gap: 12rpx;
}

.modal-subtitle {
  margin-top: 8rpx;
  color: #64748b;
  font-size: 22rpx;
}

.qr-modal-mask {
  z-index: 1000;
}

.qr-modal {
  max-width: 660rpx;
  padding: 22rpx;
}

.qr-wrap {
  margin-top: 16rpx;
  min-height: 480rpx;
  border: 4rpx solid #2b7a78;
  border-radius: 16rpx;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-image {
  width: 480rpx;
  height: 480rpx;
  background: #ffffff;
  border-radius: 10rpx;
}

.empty {
  color: #94a3b8;
  font-size: 24rpx;
}

.token,
.refresh-time {
  margin-top: 10rpx;
  color: #475569;
  font-size: 22rpx;
  text-align: center;
  word-break: break-all;
}

.qr-close-btn {
  width: 100%;
}

.placeholder {
  color: #9ca3af;
}
</style>
