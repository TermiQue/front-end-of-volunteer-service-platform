<template>
  <view class="page">
    <BackgroundGlow />

    <view class="content">
      <view class="card">
        <view class="title">签到签退二维码</view>

        <view class="field">
          <text class="label">进行中项目</text>
          <picker mode="selector" :range="projectOptions" range-key="name" :value="projectIndex" @change="onProjectChange">
            <view class="value">{{ projectOptions[projectIndex]?.name || '暂无进行中项目' }}</view>
          </picker>
        </view>

        <view class="field">
          <text class="label">二维码类型</text>
          <view class="segmented">
            <view class="segmented-item" :class="mode === 'checkin' ? 'active' : ''" @tap="switchMode('checkin')">签到码</view>
            <view class="segmented-item" :class="mode === 'checkout' ? 'active' : ''" @tap="switchMode('checkout')">签退码</view>
          </view>
        </view>

        <view class="field">
          <text class="label">轮询间隔</text>
          <view class="interval-row">
            <view
              v-for="item in intervalOptions"
              :key="item.value"
              class="interval-pill"
              :class="intervalMs === item.value ? 'active' : ''"
              @tap="setIntervalMs(item.value)"
            >
              {{ item.label }}
            </view>
          </view>
        </view>

        <view class="controls">
          <button class="btn btn-primary" @tap="startPolling">开始轮询</button>
          <button class="btn btn-secondary" @tap="stopPolling">停止轮询</button>
          <button class="btn btn-secondary" @tap="refreshQrNow">立即刷新</button>
        </view>

        <view class="status-row">
          <text>状态：{{ polling ? '轮询中' : '已停止' }}</text>
          <text>最近刷新：{{ lastRefreshAt || '-' }}</text>
        </view>

        <view class="qr-wrap" :class="pulseActive ? 'pulse' : ''">
          <view v-if="qrImageUrl" class="qr-inner">
            <image class="qr-image" :src="qrImageUrl" mode="aspectFit" />
            <text class="token">token: {{ shortToken }}</text>
          </view>
          <view v-else class="empty">请选择项目和二维码类型后开始轮询</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onHide, onUnload } from '@dcloudio/uni-app'

import BackgroundGlow from '@/components/BackgroundGlow.vue'
import { useAuthGuard } from '@/composables/useAuthGuard'
import { openFunctionEntry } from '@/utils/navigation'
import { fetchAdminProjects, fetchProjectQr, type QrMode, type ProjectQrInfo } from '@/utils/project'

type OptionProject = {
  projectId: number
  name: string
}

const projectOptions = ref<OptionProject[]>([])
const projectIndex = ref(0)
const mode = ref<QrMode>('checkin')
const intervalMs = ref(2000)
const polling = ref(false)
const lastRefreshAt = ref('')
const pulseActive = ref(false)

const qrInfo = ref<ProjectQrInfo | null>(null)
let timer: ReturnType<typeof setInterval> | null = null

const intervalOptions = [
  { label: '1秒', value: 1000 },
  { label: '2秒', value: 2000 },
  { label: '3秒', value: 3000 },
  { label: '5秒', value: 5000 }
]

const currentProjectId = computed(() => projectOptions.value[projectIndex.value]?.projectId || null)
const qrImageUrl = computed(() => {
  if (!qrInfo.value?.token) {
    return ''
  }
  const token = encodeURIComponent(qrInfo.value.token)
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${token}`
})

const shortToken = computed(() => {
  const token = qrInfo.value?.token || ''
  if (!token) {
    return ''
  }
  return token.length > 24 ? `${token.slice(0, 10)}...${token.slice(-10)}` : token
})

const triggerPulse = () => {
  pulseActive.value = false
  setTimeout(() => {
    pulseActive.value = true
  }, 20)
  setTimeout(() => {
    pulseActive.value = false
  }, 500)
}

const loadOngoingProjects = async () => {
  try {
    const data = await fetchAdminProjects({
      status: 1,
      page: 1,
      pageSize: 100
    })
    projectOptions.value = data.items.map((item) => ({
      projectId: item.projectId,
      name: item.name
    }))
    projectIndex.value = 0
  } catch {
    projectOptions.value = []
    uni.showToast({ title: '加载进行中项目失败', icon: 'none' })
  }
}

const refreshQrNow = async () => {
  const projectId = currentProjectId.value
  if (!projectId) {
    uni.showToast({ title: '请先选择进行中项目', icon: 'none' })
    return
  }

  try {
    const previousToken = qrInfo.value?.token || ''
    const nextQr = await fetchProjectQr(projectId, mode.value)
    const changed = previousToken !== nextQr.token
    qrInfo.value = nextQr
    lastRefreshAt.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
    if (changed) {
      triggerPulse()
    }
  } catch {
    uni.showToast({ title: '二维码获取失败', icon: 'none' })
  }
}

const clearPollingTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const startPolling = async () => {
  if (!currentProjectId.value) {
    uni.showToast({ title: '没有可用的进行中项目', icon: 'none' })
    return
  }

  clearPollingTimer()
  polling.value = true
  await refreshQrNow()
  timer = setInterval(() => {
    void refreshQrNow()
  }, intervalMs.value)
}

const stopPolling = () => {
  polling.value = false
  clearPollingTimer()
}

const restartPollingIfActive = async () => {
  if (polling.value) {
    await startPolling()
  }
}

const onProjectChange = async (event: { detail: { value: string } }) => {
  projectIndex.value = Number(event.detail.value)
  pulseActive.value = false
  qrInfo.value = null
  await restartPollingIfActive()
}

const switchMode = async (nextMode: QrMode) => {
  if (mode.value === nextMode) {
    return
  }
  mode.value = nextMode
  await startPolling()
}

const setIntervalMs = async (value: number) => {
  if (intervalMs.value === value) {
    return
  }
  intervalMs.value = value
  await restartPollingIfActive()
}

useAuthGuard({
  routePath: '/pages/admin/qr-attendance',
  roleCheck: (role) => role === 2 || role === 3,
  onForbidden: () => {
    openFunctionEntry()
  },
  onAuthorized: loadOngoingProjects
})

onHide(() => {
  stopPolling()
})

onUnload(() => {
  stopPolling()
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

.card {
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.9);
  border: 1rpx solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 14rpx 30rpx rgba(15, 23, 42, 0.08);
  padding: 20rpx;
}

.title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 16rpx;
}

.field {
  margin-bottom: 14rpx;
}

.label {
  display: block;
  font-size: 22rpx;
  color: #6b7280;
  margin-bottom: 8rpx;
}

.value {
  min-height: 48rpx;
  border-radius: 10rpx;
  border: 1rpx solid #d1d5db;
  background: #f8fafc;
  padding: 10rpx 12rpx;
  font-size: 24rpx;
  color: #111827;
  box-sizing: border-box;
}

.segmented {
  display: flex;
  gap: 10rpx;
}

.segmented-item {
  flex: 1;
  min-height: 58rpx;
  border-radius: 10rpx;
  border: 1rpx solid #d1d5db;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #4b5563;
  font-weight: 600;
}

.segmented-item.active {
  color: #fff;
  border-color: transparent;
  background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
}

.interval-row {
  display: flex;
  gap: 10rpx;
  flex-wrap: wrap;
}

.interval-pill {
  min-width: 120rpx;
  min-height: 52rpx;
  padding: 0 14rpx;
  border-radius: 999rpx;
  border: 1rpx solid #d1d5db;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4b5563;
  font-size: 22rpx;
}

.interval-pill.active {
  color: #fff;
  border-color: transparent;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
}

.controls {
  margin-top: 6rpx;
  display: flex;
  gap: 10rpx;
}

.btn {
  margin: 0;
  flex: 1;
  height: 64rpx;
  border-radius: 10rpx;
  border: none;
  font-size: 22rpx;
}

.btn::after {
  border: none;
}

.btn-primary {
  color: #fff;
  background: linear-gradient(135deg, #5f60e7 0%, #6366f1 100%);
}

.btn-secondary {
  color: #374151;
  background: #e5e7eb;
}

.status-row {
  margin-top: 14rpx;
  display: flex;
  justify-content: space-between;
  gap: 16rpx;
  color: #64748b;
  font-size: 22rpx;
}

.qr-wrap {
  margin-top: 16rpx;
  min-height: 420rpx;
  border-radius: 16rpx;
  border: 1rpx dashed #d1d5db;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx;
  box-sizing: border-box;
}

.qr-wrap.pulse {
  animation: pulse-fade 0.5s ease;
}

.qr-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qr-image {
  width: 320rpx;
  height: 320rpx;
  border-radius: 8rpx;
  background: #fff;
}

.token {
  margin-top: 12rpx;
  max-width: 520rpx;
  font-size: 20rpx;
  color: #64748b;
}

.empty {
  color: #94a3b8;
  font-size: 24rpx;
}

@keyframes pulse-fade {
  0% {
    transform: scale(0.98);
    opacity: 0.65;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
