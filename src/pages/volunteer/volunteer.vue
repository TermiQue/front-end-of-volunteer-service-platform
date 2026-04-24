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

    <ProjectRecordSection
        :items="filteredHistory"
        :loading="loading"
        :loading-more="loadingMore"
        :has-more="hasMore"
        :error-message="errorMessage"
      >
        <template #filters>
          <SegmentFilter :model-value="statusFilter" :options="statusFilterOptions" @change="setStatusFilter" />

          <view class="filter-bar">
            <view class="filter-bar-item">
              <FilterInput v-model="keyword" label="项目关键字" placeholder="请输入项目名称关键字" />
            </view>

            <view class="filter-bar-item">
              <DateRangeFilter
                :start="dateStart"
                :end="dateEnd"
                label="日期范围"
                placeholder="请选择日期范围"
                @open="openDateRangePopup"
              />
            </view>

            <view class="filter-bar-item">
              <DurationRangeFilter
                :min="hourMin"
                :max="hourMax"
                label="时长范围"
                placeholder="请选择时长范围"
                @open="openDurationRangePopup"
              />
            </view>
          </view>
        </template>
      </ProjectRecordSection>
  </view>

  <DateRangePopup
    v-model:visible="dateRangePopupVisible"
    v-model:start="dateStart"
    v-model:end="dateEnd"
    label="日期范围"
  />

  <DurationRangePopup
    v-model:visible="durationRangePopupVisible"
    v-model:min="hourMin"
    v-model:max="hourMax"
    label="时长范围"
    :max-hours="24"
  />

  <BottomTabbar :selected="1" />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'

import BackgroundGlow from '@/components/BackgroundGlow.vue'
import BottomTabbar from '@/components/BottomTabbar.vue'
import DateRangeFilter from '@/components/DateRangeFilter.vue'
import DateRangePopup from '@/components/DateRangePopup.vue'
import DurationRangeFilter from '@/components/DurationRangeFilter.vue'
import DurationRangePopup from '@/components/DurationRangePopup.vue'
import FilterInput from '@/components/FilterInput.vue'
import ProjectRecordSection, { type ProjectRecordItem } from '@/components/ProjectRecordSection.vue'
import SegmentFilter from '@/components/SegmentFilter.vue'
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
const STATUS_FILTER_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '进行中', value: 'ongoing' },
  { label: '已结束', value: 'ended' }
] as const

type StatusFilter = (typeof STATUS_FILTER_OPTIONS)[number]['value']
const statusFilterOptions = [...STATUS_FILTER_OPTIONS]

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

const statusFilter = ref<StatusFilter>('all')
const keyword = ref('')
const dateStart = ref('')
const dateEnd = ref('')
const dateRangePopupVisible = ref(false)
const hourMin = ref('')
const hourMax = ref('')
const durationRangePopupVisible = ref(false)

const openDateRangePopup = () => {
  dateRangePopupVisible.value = true
}

const openDurationRangePopup = () => {
  durationRangePopupVisible.value = true
}

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

const isStatusFilter = (value: string): value is StatusFilter =>
  STATUS_FILTER_OPTIONS.some((option) => option.value === value)

const setStatusFilter = async (value: string) => {
  if (!isStatusFilter(value)) {
    return
  }

  if (statusFilter.value === value) {
    return
  }

  statusFilter.value = value
  await loadHistory(true)
}

const filteredHistory = computed<ProjectRecordItem[]>(() => {
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
.action-grid {
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

.filter-bar {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-bottom: 14rpx;
  width: 100%;
  box-sizing: border-box;
}

.filter-bar-item {
  width: 100%;
  min-width: 0;
  flex: 0 0 auto;
}
</style>
