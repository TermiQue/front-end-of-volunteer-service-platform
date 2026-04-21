<template>
  <view class="page">
    <BackgroundGlow />
    <view class="content">
      <view class="filter-panel">
        <view class="filter-grid">
          <view class="filter-item">
            <text class="filter-label">项目名称</text>
            <input class="filter-input" v-model="queryName" type="text" placeholder="关键字" placeholder-class="placeholder" />
          </view>
          <view class="filter-item">
            <text class="filter-label">创建者ID</text>
            <input class="filter-input" v-model="queryCreatedBy" type="number" placeholder="如 1001" placeholder-class="placeholder" />
          </view>
          <view class="filter-item">
            <text class="filter-label">时长最小值</text>
            <input class="filter-input" v-model="queryDurationMin" type="digit" placeholder="小时" placeholder-class="placeholder" />
          </view>
          <view class="filter-item">
            <text class="filter-label">时长最大值</text>
            <input class="filter-input" v-model="queryDurationMax" type="digit" placeholder="小时" placeholder-class="placeholder" />
          </view>
          <view class="filter-item">
            <text class="filter-label">开始时间下界</text>
            <picker mode="date" :value="queryStartFrom" @change="onQueryStartFromChange">
              <view class="filter-value">{{ queryStartFrom || '请选择' }}</view>
            </picker>
          </view>
          <view class="filter-item">
            <text class="filter-label">开始时间上界</text>
            <picker mode="date" :value="queryStartTo" @change="onQueryStartToChange">
              <view class="filter-value">{{ queryStartTo || '请选择' }}</view>
            </picker>
          </view>
          <view class="filter-item">
            <text class="filter-label">结束时间下界</text>
            <picker mode="date" :value="queryEndFrom" @change="onQueryEndFromChange">
              <view class="filter-value">{{ queryEndFrom || '请选择' }}</view>
            </picker>
          </view>
          <view class="filter-item">
            <text class="filter-label">结束时间上界</text>
            <picker mode="date" :value="queryEndTo" @change="onQueryEndToChange">
              <view class="filter-value">{{ queryEndTo || '请选择' }}</view>
            </picker>
          </view>
        </view>

        <view class="filter-actions">
          <button class="btn btn-secondary" @tap="resetQuery">重置</button>
          <button class="btn btn-primary" @tap="loadProjects(true)">查询</button>
        </view>
      </view>

      <view class="list-panel">
        <view v-if="loading && !projects.length" class="state-row">正在加载进行中项目...</view>
        <view v-else-if="errorMessage" class="state-row error">{{ errorMessage }}</view>
        <view v-else-if="!projects.length" class="state-row">暂无符合条件的进行中项目</view>

        <block v-else v-for="item in projects" :key="item.projectId">
          <view class="project-item">
            <view class="project-head">
              <text class="name">{{ item.name }}</text>
              <text class="status">进行中</text>
            </view>
            <view class="meta">时间：{{ formatProjectDate(item.startTime) }} - {{ formatProjectDate(item.endTime) }}</view>
            <view class="meta">时长：{{ item.durationHours.toFixed(2) }}h ｜ 创建者：{{ item.createdById }} ｜ 负责人：{{ item.responsibleId }}</view>
            <view class="meta">描述：{{ item.description || '无' }}</view>

            <view class="actions">
              <view class="action-row">
                <button class="item-btn item-btn-checkin" @tap="openQrModal(item, 'checkin')">签到码</button>
                <button class="item-btn item-btn-checkout" @tap="openQrModal(item, 'checkout')">签退码</button>
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
import { computed, ref } from 'vue'
import { onHide, onUnload, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'

import BackgroundGlow from '@/components/BackgroundGlow.vue'
import { useAuthGuard } from '@/composables/useAuthGuard'
import { currentRole } from '@/utils/auth'
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
const queryStartTo = ref('')
const queryEndFrom = ref('')
const queryEndTo = ref('')

const projects = ref<AdminProjectItem[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const errorMessage = ref('')
const page = ref(1)
const hasMore = ref(true)

const PAGE_SIZE = 5

const showQrModal = ref(false)
const activeProject = ref<AdminProjectItem | null>(null)
const activeMode = ref<QrMode>('checkin')
const activeToken = ref('')
const lastRefreshAt = ref('')
const qrNonce = ref(0)

const pollIntervalMs = 2000
let timer: ReturnType<typeof setInterval> | null = null

const qrColors = ['#2b7a78', '#5f60e7', '#e26464', '#ea580c', '#0f766e', '#7c3aed']
const qrColorIndex = ref(0)

const activeProjectName = computed(() => activeProject.value?.name || '-')
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

const onQueryStartFromChange = (event: { detail: { value: string } }) => {
  queryStartFrom.value = event.detail.value
}

const onQueryStartToChange = (event: { detail: { value: string } }) => {
  queryStartTo.value = event.detail.value
}

const onQueryEndFromChange = (event: { detail: { value: string } }) => {
  queryEndFrom.value = event.detail.value
}

const onQueryEndToChange = (event: { detail: { value: string } }) => {
  queryEndTo.value = event.detail.value
}

const buildQuery = () => ({
  status: 1 as const,
  name: queryName.value.trim() || undefined,
  createdById: toMaybeNumber(queryCreatedBy.value),
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

const resetQuery = async () => {
  queryName.value = ''
  queryCreatedBy.value = ''
  queryDurationMin.value = ''
  queryDurationMax.value = ''
  queryStartFrom.value = ''
  queryStartTo.value = ''
  queryEndFrom.value = ''
  queryEndTo.value = ''
  await loadProjects(true)
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
  routePath: '/pages/admin/clockin',
  roleCheck: (role) => role === 2 || role === 3,
  onForbidden: () => {
    openFunctionEntry()
  },
  onAuthorized: () => loadProjects(true)
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
  padding: 24rpx;
  box-sizing: border-box;
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
  width: 100%;
  min-height: 68rpx;
  border-radius: 10rpx;
  background: #ffffff;
  border: 1rpx solid #d1d5db;
  padding: 0 12rpx;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  font-size: 24rpx;
  color: #111827;
}

.filter-value.fixed {
  color: #2b7a78;
  font-weight: 700;
}

.placeholder {
  color: #9ca3af;
}

.filter-actions {
  margin-top: 12rpx;
  display: flex;
  gap: 12rpx;
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

.btn-primary {
  color: #ffffff;
  background: linear-gradient(135deg, #2d7b7c 0%, #3ea88f 100%);
}

.btn-secondary {
  color: #374151;
  background: #e5e7eb;
}

.state-row {
  text-align: center;
  padding: 24rpx;
  font-size: 24rpx;
  color: #6b7280;
}

.state-row.error {
  color: #b42318;
}

.list-panel {
  padding: 14rpx 16rpx;
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
}

.action-row {
  display: flex;
  gap: 12rpx;
}

.item-btn {
  margin: 0;
  flex: 1;
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

.item-btn-checkin {
  background: linear-gradient(135deg, #79c89d 0%, #53b88c 100%);
}

.item-btn-checkout {
  background: linear-gradient(135deg, #f08a8a 0%, #e26464 100%);
}

.load-more-row {
  padding: 18rpx 0 12rpx;
  text-align: center;
  color: #6b7280;
  font-size: 22rpx;
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
</style>
