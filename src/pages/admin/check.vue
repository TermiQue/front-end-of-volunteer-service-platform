<template>
  <view class="page">
    <BackgroundGlow />
    <view class="content">
      <ProjectRecordSection
        title="签到签退项目"
        :items="projectRecordItems"
        :loading="loading && !projects.length"
        :loading-more="loadingMore"
        :has-more="hasMore"
        :error-message="errorMessage"
        loading-text="正在加载进行中项目..."
        empty-text="暂无符合条件的进行中项目"
        no-more-text="没有更多了"
      >
        <template #filters>
          <view class="filter-bar">
            <view class="filter-bar-item">
              <FilterInput v-model="queryName" label="项目名称" placeholder="请输入项目名称关键字" />
            </view>

            <view class="filter-bar-item">
              <FilterInput v-model="queryCreatedBy" label="创建者编号" placeholder="如 1001" />
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

            <view class="filter-bar-item">
              <DateRangeFilter
                :start="queryStartFrom"
                :end="queryEndTo"
                label="时间范围"
                placeholder="请选择时间范围"
                @open="openDateRangePopup"
              />
            </view>
          </view>
        </template>
      </ProjectRecordSection>
    </view>

    <DateRangePopup
      v-model:visible="dateRangePopupVisible"
      v-model:start="queryStartFrom"
      v-model:end="queryEndTo"
      label="时间范围"
    />

    <DurationRangePopup
      v-model:visible="durationRangePopupVisible"
      v-model:min="queryDurationMin"
      v-model:max="queryDurationMax"
      label="时长范围"
      :max-hours="24"
    />

    <view v-if="showQrModal" class="modal-mask" @tap="closeQrModal">
      <view class="modal" @tap.stop>
        <view class="modal-title">{{ activeModeLabel }} - {{ activeProjectName }}</view>
        <view class="modal-subtitle">自动轮询中（2秒/次）</view>

        <view class="qr-wrap" :style="{ borderColor: currentQrColorHex }">
          <image v-if="qrImageUrl" class="qr-image" :src="qrImageUrl" mode="aspectFit" />
          <view v-else class="empty">正在获取二维码...</view>
        </view>

        <view class="token">{{ shortToken || '-' }}</view>
        <view class="refresh-time">最近刷新：{{ lastRefreshAt || '-' }}</view>

        <view class="modal-actions">
          <button class="btn btn-secondary" @tap="closeQrModal">关闭并停止</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onHide, onUnload, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'

import BackgroundGlow from '@/components/BackgroundGlow.vue'
import DateRangeFilter from '@/components/DateRangeFilter.vue'
import DateRangePopup from '@/components/DateRangePopup.vue'
import DurationRangeFilter from '@/components/DurationRangeFilter.vue'
import DurationRangePopup from '@/components/DurationRangePopup.vue'
import FilterInput from '@/components/FilterInput.vue'
import ProjectRecordSection, { type ProjectRecordItem } from '@/components/ProjectRecordSection.vue'
import { useAuthGuard } from '@/composables/useAuthGuard'
import { currentRole } from '@/utils/auth'
import { DEFAULT_PAGE_SIZE } from '@/utils/constants'
import { openFunctionEntry } from '@/utils/navigation'
import {
  fetchAdminProjects,
  fetchProjectQr,
  formatProjectDate,
  type AdminProjectItem,
  type QrMode
} from '@/utils/project'

const queryName = ref('')
const queryCreatedBy = ref('')
const queryDurationMin = ref('')
const queryDurationMax = ref('')
const queryStartFrom = ref('')
const queryEndTo = ref('')
const dateRangePopupVisible = ref(false)
const durationRangePopupVisible = ref(false)

const projects = ref<AdminProjectItem[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const errorMessage = ref('')
const page = ref(1)
const hasMore = ref(true)

const PAGE_SIZE = DEFAULT_PAGE_SIZE

const showQrModal = ref(false)
const activeProject = ref<AdminProjectItem | null>(null)
const activeMode = ref<QrMode>('checkin')
const activeToken = ref('')
const lastRefreshAt = ref('')
const qrNonce = ref(0)

const pollIntervalMs = 2000
let timer: ReturnType<typeof setInterval> | null = null
let autoQueryTimer: ReturnType<typeof setTimeout> | null = null
let autoQueryReady = false

const qrColors = ['#2b7a78', '#5f60e7', '#e26464', '#ea580c', '#0f766e', '#7c3aed']
const qrColorIndex = ref(0)

const activeProjectName = computed(() => activeProject.value?.projectName || '-')
const activeModeLabel = computed(() => (activeMode.value === 'checkin' ? '签到二维码' : '签退二维码'))
const currentQrColorHex = computed(() => qrColors[qrColorIndex.value % qrColors.length])

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

const buildCheckInfoCard = (item: AdminProjectItem) => {
  return {
    title: {
      text: item.projectName
    },
    tag: {
      text: '进行中',
      when: 'running',
      matchers: [
        { when: 'running', type: 1 as const }
      ]
    },
    rows: [
      [{ text: `描述：${item.description || '无'}` }],
      [{ text: `时间：${formatProjectDate(item.designStartTime)} - ${formatProjectDate(item.designEndTime)}` }],
      [
        { text: `创建者：${item.creatorName || '未命名用户'}` },
        { text: `负责人：${item.responsibleName || '未分配负责人'}` },
        { text: `时长：${item.designVolunteerHours.toFixed(1)}h` }
      ]
    ],
    buttonRows: [[
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
    ]]
  }
}

const projectRecordItems = computed<ProjectRecordItem[]>(() => {
  return projects.value.map((item) => ({
    id: item.projectId,
    card: buildCheckInfoCard(item)
  }))
})

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

const toMaybeNumber = (value: string) => {
  if (!value.trim()) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const toIsoTime = (value: string, endOfDay = false) => {
  if (!value) {
    return undefined
  }

  const suffix = endOfDay ? 'T23:59:59+08:00' : 'T00:00:00+08:00'
  return `${value}${suffix}`
}

const buildQuery = () => ({
  status: 1 as const,
  name: queryName.value.trim() || undefined,
  createdById: toMaybeNumber(queryCreatedBy.value),
  durationHoursMin: toMaybeNumber(queryDurationMin.value),
  durationHoursMax: toMaybeNumber(queryDurationMax.value),
  startTimeFrom: toIsoTime(queryStartFrom.value, false),
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
    const pageItems = data.items.filter((item) => item.status === 1)
    projects.value = reset ? pageItems : appendUniqueProjects(projects.value, pageItems)
    hasMore.value = projects.value.length < data.total && data.items.length === PAGE_SIZE
    if (data.items.length > 0) {
      page.value += 1
    }
  } catch {
    if (reset) {
      errorMessage.value = '进行中项目加载失败，请稍后重试'
      projects.value = []
    } else {
      uni.showToast({ title: '加载下一页失败，请重试', icon: 'none' })
    }
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const clearPollingTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
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

const startPolling = async () => {
  clearPollingTimer()
  await refreshQr()
  timer = setInterval(() => {
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
  await startPolling()
}

const closeQrModal = () => {
  showQrModal.value = false
  clearPollingTimer()
  activeProject.value = null
  activeToken.value = ''
  lastRefreshAt.value = ''
}

useAuthGuard({
  routePath: '/pages/admin/check',
  roleCheck: (role) => role === 2 || role === 3,
  onForbidden: () => {
    openFunctionEntry()
  },
  onAuthorized: async () => {
    await loadProjects(true)
    autoQueryReady = true
  }
})

watch(queryName, () => {
  triggerAutoQuery(false)
})

watch(queryCreatedBy, () => {
  triggerAutoQuery(false)
})

watch([queryDurationMin, queryDurationMax], () => {
  triggerAutoQuery(true)
})

watch([queryStartFrom, queryEndTo], () => {
  triggerAutoQuery(true)
})

onHide(() => {
  closeQrModal()
})

onUnload(() => {
  closeQrModal()
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
  padding: 24rpx 0;
  box-sizing: border-box;
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

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24rpx;
}

.modal {
  width: 100%;
  max-width: 660rpx;
  border-radius: 20rpx;
  background: #ffffff;
  padding: 22rpx;
  box-sizing: border-box;
}

.modal-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #111827;
}

.modal-subtitle {
  margin-top: 8rpx;
  color: #64748b;
  font-size: 22rpx;
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

.modal-actions {
  margin-top: 14rpx;
}

.btn {
  margin: 0;
  flex: 1;
  height: 66rpx;
  border: none;
  border-radius: 10rpx;
  font-size: 24rpx;
  font-weight: 600;
}

.btn::after {
  border: none;
}

.btn-secondary {
  color: #374151;
  background: #e5e7eb;
}
</style>
