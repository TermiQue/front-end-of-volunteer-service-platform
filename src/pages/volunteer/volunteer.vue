<template>
  <view class="container">
    <BackgroundGlow />

    <view class="title">归途·桥链</view>
    <view class="sub">“归途·桥链”青年志愿先锋队</view>

    <view class="user-card">
      <image class="avatar" :src="userInfo.avatar" mode="aspectFill" />

      <view class="info">
        <view class="info-row"><text class="label">姓名：</text><text class="value">{{ userInfo.name }}</text></view>
        <view class="info-row"><text class="label">学号：</text><text class="value">{{ userInfo.studentId }}</text></view>
        <view class="info-row"><text class="label">身份：</text><text class="value">{{ identityText }}</text></view>
        <view class="info-row"><text class="label">时长：</text><text class="value">{{ userInfo.duration }}</text></view>
        <view class="info-row"><text class="label">项目：</text><text class="value">{{ userInfo.project }}</text></view>
      </view>
    </view>

    <view class="action-grid">
      <view class="action-row">
        <view class="action-card" @tap="scanQrCode">
          <image class="action-icon" :src="checkinIcon" mode="aspectFit" />
          <text class="action-text">签到/签退扫码</text>
        </view>
      </view>

      <view class="action-row">
        <view class="action-card" @tap="goToAppealPage">
          <image class="action-icon" :src="declareIcon" mode="aspectFit" />
          <text class="action-text">事务申请</text>
        </view>

        <view class="action-card" @tap="goToProgressPage">
          <image class="action-icon" :src="reviewIcon" mode="aspectFit" />
          <text class="action-text">审核进度</text>
        </view>
      </view>
    </view>

    <view class="history-block">
      <view class="history-title">历史项目记录</view>

      <view class="status-filter">
        <view
          class="status-pill"
          :class="statusFilter === 'all' ? 'active' : ''"
          @tap="setStatusFilter('all')"
        >
          全部
        </view>
        <view
          class="status-pill"
          :class="statusFilter === 'ongoing' ? 'active' : ''"
          @tap="setStatusFilter('ongoing')"
        >
          进行中
        </view>
        <view
          class="status-pill"
          :class="statusFilter === 'ended' ? 'active' : ''"
          @tap="setStatusFilter('ended')"
        >
          已结束
        </view>
      </view>

      <view class="filter-bar">
        <view class="filter-item full-width">
          <text class="filter-label">项目关键字</text>
          <input
            class="filter-input"
            v-model="keyword"
            type="text"
            placeholder="请输入项目名称关键字"
            placeholder-class="filter-placeholder"
          />
        </view>

        <view class="filter-item">
          <text class="filter-label">开始日期</text>
          <PopupDateCalendar v-model="dateStart" title="选择开始日期" placeholder="请选择" />
        </view>

        <view class="filter-item">
          <text class="filter-label">结束日期</text>
          <PopupDateCalendar v-model="dateEnd" title="选择结束日期" placeholder="请选择" />
        </view>

        <view class="filter-item">
          <text class="filter-label">最小时长 (h)</text>
          <PopupDurationPicker v-model="hourMin" title="选择最小时长" placeholder="例如 1.5" :max-hours="24" />
        </view>

        <view class="filter-item">
          <text class="filter-label">最大时长 (h)</text>
          <PopupDurationPicker v-model="hourMax" title="选择最大时长" placeholder="例如 8" :max-hours="24" />
        </view>
      </view>

      <view v-if="loading" class="state-row">正在加载项目记录...</view>
      <view v-else-if="errorMessage" class="state-row error">{{ errorMessage }}</view>
      <view v-else-if="!filteredHistory.length" class="state-row">暂无符合条件的项目记录</view>

      <block v-else>
        <InfoLineCard v-for="item in filteredHistory" :key="item.id" :card="item.card" />
      </block>

      <view v-if="!loading && filteredHistory.length" class="load-more-row">
        <text v-if="loadingMore">加载中...</text>
        <text v-else-if="!hasMore">没有更多项目了</text>
        <text v-else>上滑加载更多</text>
      </view>
    </view>
  </view>

  <BottomTabbar :selected="1" />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'

import BackgroundGlow from '@/components/BackgroundGlow.vue'
import BottomTabbar from '@/components/BottomTabbar.vue'
import InfoLineCard from '@/components/InfoLineCard.vue'
import PopupDateCalendar from '@/components/PopupDateCalendar.vue'
import PopupDurationPicker from '@/components/PopupDurationPicker.vue'
import { useAuthGuard } from '@/composables/useAuthGuard'
import { useUserInfo } from '@/composables/useUserInfo'
import { currentRole } from '@/utils/auth'
import { DEFAULT_PAGE_SIZE } from '@/utils/constants'
import {
  fetchVolunteerProjects,
  formatProjectDate,
  scanProjectQrToken,
  type VolunteerProjectRecord
} from '@/utils/project'
import { openFunctionEntry } from '@/utils/navigation'
import { getAssetUrl } from '@/utils/urls'

const declareIcon = getAssetUrl('/icons/file-text.svg')
const reviewIcon = getAssetUrl('/icons/review.svg')
const checkinIcon = getAssetUrl('/icons/checkin.svg')

const PAGE_SIZE = DEFAULT_PAGE_SIZE

type HistoryViewItem = {
  id: number
  card: {
    title: {
      text: string
      className?: string
    }
    tag: {
      text: string
      when: string
      matchers: Array<{
        when: string
        type: 1 | 2 | 3
      }>
    }
    rows: Array<
      Array<{
        text: string
        className?: string
      }>
    >
  }
}

const userInfo = useUserInfo({ fallbackName: '志愿者' })
const roleTextMap: Record<number, string> = {
  0: '志愿者',
  1: '临界青年',
  2: '管理员',
  3: '超级管理员'
}
const identityText = computed(() => {
  const role = currentRole.value
  if (role === null || role === undefined) {
    return '志愿者'
  }
  return roleTextMap[role] || '志愿者'
})

const historySource = ref<VolunteerProjectRecord[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const errorMessage = ref('')
const page = ref(1)
const hasMore = ref(true)

const statusFilter = ref<'all' | 'ongoing' | 'ended'>('all')
const keyword = ref('')
const dateStart = ref('')
const dateEnd = ref('')
const hourMin = ref('')
const hourMax = ref('')

const toMaybeNumber = (value: string) => {
  if (!value.trim()) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const formatActualTime = (value: string | number | null) => {
  if (value === 0 || value === '0' || value === null || value === undefined || value === '') {
    return '未签到/签退'
  }

  return formatProjectDate(String(value))
}

const resolveRecordType = (note: string | null) => {
  if (!note) {
    return '-'
  }

  const lowered = note.toLowerCase()
  if (lowered.includes('auto')) {
    return '自动'
  }

  if (note.includes('申诉')) {
    return '申诉'
  }

  if (note.includes('更改') || note.includes('时长') || note.includes('申请通过')) {
    return '更改'
  }

  return note
}

const toDurationHours = (startIso: string, endIso: string) => {
  const startTs = new Date(startIso).getTime()
  const endTs = new Date(endIso).getTime()
  if (Number.isNaN(startTs) || Number.isNaN(endTs) || endTs <= startTs) {
    return 0
  }
  return (endTs - startTs) / (1000 * 60 * 60)
}

const dayStartTs = (value: string) => {
  if (!value) {
    return null
  }

  const ts = new Date(`${value}T00:00:00`).getTime()
  return Number.isNaN(ts) ? null : ts
}

const dayEndTs = (value: string) => {
  if (!value) {
    return null
  }

  const ts = new Date(`${value}T23:59:59`).getTime()
  return Number.isNaN(ts) ? null : ts
}

const normalizeScanToken = (raw: string) => {
  const value = raw.trim()
  if (!value) {
    return ''
  }

  if (value.includes('token=')) {
    const query = value.split('?')[1] || value
    const params = new URLSearchParams(query)
    return params.get('token') || value
  }

  return value
}

const goToAppealPage = () => {
  uni.navigateTo({ url: '/pages/volunteer/appeal' })
}

const goToProgressPage = () => {
  uni.navigateTo({ url: '/pages/volunteer/progress' })
}

const scanQrCode = async () => {
  try {
    const scanResult = await new Promise<UniApp.ScanCodeSuccessRes>((resolve, reject) => {
      uni.scanCode({
        onlyFromCamera: true,
        scanType: ['qrCode'],
        success: resolve,
        fail: reject
      })
    })

    const token = normalizeScanToken(scanResult.result || '')
    if (!token) {
      uni.showToast({ title: '二维码内容无效', icon: 'none' })
      return
    }

    const result = await scanProjectQrToken(token)
    const actionMessageMap = {
      checked_in: '签到成功',
      checked_out: '签退成功',
      already_checked_in: '您已签到',
      already_checked_out: '您已签退'
    } as const

    uni.showToast({
      title: actionMessageMap[result.action],
      icon: 'none'
    })

    await loadHistory(true)
  } catch {
    uni.showToast({ title: '扫码失败或请求异常', icon: 'none' })
  }
}

const appendUniqueRecords = (existing: VolunteerProjectRecord[], incoming: VolunteerProjectRecord[]) => {
  const seen = new Set(existing.map((item) => item.id))
  const next = [...existing]
  incoming.forEach((item) => {
    if (seen.has(item.id)) {
      return
    }
    next.push(item)
    seen.add(item.id)
  })
  return next
}

const loadHistory = async (reset = false) => {
  if (reset) {
    loading.value = true
    errorMessage.value = ''
    page.value = 1
    hasMore.value = true
    historySource.value = []
  } else {
    if (!hasMore.value || loadingMore.value || loading.value) {
      return
    }
    loadingMore.value = true
  }

  try {
    const data = await fetchVolunteerProjects({
      projectStatus: statusFilter.value === 'ongoing' ? 1 : statusFilter.value === 'ended' ? 2 : undefined,
      page: page.value,
      pageSize: PAGE_SIZE
    })

    historySource.value = appendUniqueRecords(historySource.value, data.items)

    const loadedCount = historySource.value.length
    hasMore.value = loadedCount < data.total && data.items.length === PAGE_SIZE
    if (data.items.length > 0) {
      page.value += 1
    }
  } catch {
    if (reset) {
      errorMessage.value = '项目记录加载失败，请下拉重试'
      historySource.value = []
    } else {
      uni.showToast({ title: '加载下一页失败，请重试', icon: 'none' })
    }
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const setStatusFilter = async (value: 'all' | 'ongoing' | 'ended') => {
  if (statusFilter.value === value) {
    return
  }

  statusFilter.value = value
  await loadHistory(true)
}

const filteredHistory = computed<HistoryViewItem[]>(() => {
  const key = keyword.value.trim().toLowerCase()
  const minHours = toMaybeNumber(hourMin.value)
  const maxHours = toMaybeNumber(hourMax.value)
  const startLimit = dayStartTs(dateStart.value)
  const endLimit = dayEndTs(dateEnd.value)

  return historySource.value
    .filter((item) => {
      if (key && !item.projectName.toLowerCase().includes(key)) {
        return false
      }

      const designHours = toDurationHours(item.projectDesignStartTime, item.projectDesignEndTime)

      if (minHours !== null && designHours < minHours) {
        return false
      }

      if (maxHours !== null && designHours > maxHours) {
        return false
      }

      const startTs = new Date(item.projectDesignStartTime).getTime()
      const endTs = new Date(item.projectDesignEndTime).getTime()

      if (startLimit !== null && !Number.isNaN(startTs) && startTs < startLimit) {
        return false
      }

      if (endLimit !== null && !Number.isNaN(endTs) && endTs > endLimit) {
        return false
      }

      return true
    })
    .map((item) => ({
      id: item.id,
      card: {
        title: {
          text: item.projectName
        },
        tag: {
          text: item.settlementHours === null ? '-' : `${item.settlementHours.toFixed(1)}`,
          when: item.projectIsValid === 1 ? 'valid' : 'invalid',
          matchers: [
            { when: 'default', type: 1 },
            { when: 'valid', type: 2 },
            { when: 'invalid', type: 3 }
          ]
        },
        rows: [
          [{ text: `描述：${item.projectDescription || '-'}` }],
          [{ text: `时间：${formatProjectDate(item.projectDesignStartTime)} - ${formatProjectDate(item.projectDesignEndTime)}` }],
          [{ text: `参与：${formatActualTime(item.actualCheckInTime)} - ${formatActualTime(item.actualCheckOutTime)}` }],
          [
            { text: `创建：${item.creatorName || '未命名用户'}` },
            { text: `负责：${item.responsibleName || '未分配负责人'}` },
            { text: `类型：${resolveRecordType(item.note)}` }
          ]
        ]
      }
    }))
})

useAuthGuard({
  routePath: '/pages/volunteer/volunteer',
  roleCheck: (role) => role !== 1,
  onForbidden: () => {
    openFunctionEntry()
  },
  onAuthorized: async () => {
    await loadHistory(true)
  }
})

onReachBottom(async () => {
  await loadHistory(false)
})

onPullDownRefresh(async () => {
  await loadHistory(true)
  uni.stopPullDownRefresh()
})
</script>

<style scoped lang="scss">
.container {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(180deg, #f8fafc 0%, #f3f4f6 100%);
  isolation: isolate;
  padding-bottom: calc(220rpx + env(safe-area-inset-bottom));
}

.title,
.sub,
.user-card,
.action-grid,
.history-block {
  position: relative;
  z-index: 1;
}

.title {
  margin-top: 40rpx;
  width: 100%;
  text-align: center;
  font-size: 86rpx;
  font-weight: 700;
  color: #2b7a78;
  letter-spacing: 16rpx;
}

.sub {
  margin-top: 16rpx;
  width: 100%;
  text-align: center;
  font-size: 30rpx;
  color: #667085;
  letter-spacing: 1rpx;
}

.user-card {
  position: relative;
  overflow: hidden;
  margin: 40rpx 24rpx 0;
  padding: 32rpx;
  background: rgba(255, 255, 255, 0.34);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  border-radius: 34rpx;
  box-shadow:
    0 14rpx 32rpx rgba(15, 23, 42, 0.1),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(16rpx) saturate(135%);
  -webkit-backdrop-filter: blur(16rpx) saturate(135%);
  display: flex;
  gap: 30rpx;
  align-items: center;
}

.user-card::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 44%;
  pointer-events: none;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0));
  z-index: 1;
}

.avatar {
  position: relative;
  z-index: 2;
  width: 176rpx;
  height: 176rpx;
  border-radius: 88rpx;
  background: #cececf;
  flex-shrink: 0;
  border: 4rpx solid rgba(255, 255, 255, 0.9);
}

.info {
  position: relative;
  z-index: 2;
  flex: 1;
}

.info-row {
  display: flex;
  padding: 10rpx 0;
  border-bottom: 1rpx dashed #e5e7eb;
}

.info-row:last-child {
  border-bottom: none;
}

.label {
  width: 88rpx;
  color: #4b5563;
  font-size: 26rpx;
}

.value {
  flex: 1;
  color: #111827;
  font-size: 24rpx;
  font-weight: 600;
  text-align: center;
  letter-spacing: 2rpx;
}

.action-grid {
  margin: 36rpx 24rpx 0;
}

.action-row {
  display: flex;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.action-row:last-child {
  margin-bottom: 0;
}

.action-card {
  position: relative;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  padding-top: 28rpx;
  padding-bottom: 28rpx;
  padding-left: 20rpx;
  padding-right: 20rpx;
  background: rgba(255, 255, 255, 0.34);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 14rpx 32rpx rgba(15, 23, 42, 0.1),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(16rpx) saturate(135%);
  -webkit-backdrop-filter: blur(16rpx) saturate(135%);
  box-sizing: border-box;
}

.action-card::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 44%;
  pointer-events: none;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0));
  z-index: 1;
}

.action-icon {
  position: relative;
  z-index: 2;
  width: 52rpx;
  height: 52rpx;
  margin-bottom: 12rpx;
}

.action-text {
  position: relative;
  z-index: 2;
  font-size: 30rpx;
  color: #2b7a78;
  font-weight: 700;
  letter-spacing: 1rpx;
  text-align: center;
  line-height: 1.35;
}

.action-desc {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #9ca3af;
}

.history-block {
  margin: 36rpx 24rpx 36rpx;
  padding: 20rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.88);
  border: 1rpx solid rgba(255, 255, 255, 0.75);
  box-shadow: 0 10rpx 24rpx rgba(15, 23, 42, 0.08);
}

.history-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #2b7a78;
  margin-bottom: 12rpx;
}

.status-filter {
  display: flex;
  gap: 12rpx;
  margin-bottom: 14rpx;
}

.status-pill {
  flex: 1;
  height: 62rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  border: 1rpx solid #dbe2ea;
  color: #4b5563;
  font-size: 24rpx;
  font-weight: 600;
  background: #f8fafc;
}

.status-pill.active {
  color: #ffffff;
  border-color: transparent;
  background: linear-gradient(135deg, #5f60e7 0%, #6366f1 100%);
}

.filter-bar {
  display: flex;
  gap: 12rpx;
  margin-bottom: 14rpx;
  flex-wrap: wrap;
}

.filter-item {
  flex: 1;
  min-width: 220rpx;
  background: #f8fafc;
  border: 1rpx solid #e5e7eb;
  border-radius: 14rpx;
  padding: 10rpx 12rpx;
  box-sizing: border-box;
}

.filter-item.full-width {
  min-width: 100%;
}

.filter-label {
  display: block;
  font-size: 20rpx;
  color: #6b7280;
  margin-bottom: 6rpx;
}

.filter-input,
.filter-value {
  min-height: 42rpx;
  width: 100%;
  box-sizing: border-box;
  padding: 0 8rpx;
  font-size: 22rpx;
  color: #111827;
  font-weight: 500;
}

.filter-placeholder {
  color: #9ca3af;
}

.state-row {
  padding: 24rpx 0;
  text-align: center;
  font-size: 24rpx;
  color: #6b7280;
}

.state-row.error {
  color: #b42318;
}

.load-more-row {
  padding: 18rpx 0 8rpx;
  text-align: center;
  color: #9ca3af;
  font-size: 22rpx;
}
</style>
