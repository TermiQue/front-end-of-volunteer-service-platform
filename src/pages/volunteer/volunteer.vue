<template>
  <view class="container">
    <BackgroundGlow />

    <view class="title">归途·桥链</view>
    <view class="sub">“归途·桥链” 青年志愿先锋队</view>

    <view class="user-card">
      <image class="avatar" :src="userInfo.avatar" mode="aspectFill" />

      <view class="info">
        <view class="info-row"><text class="label">姓名：</text><text class="value">{{ userInfo.name }}</text></view>
        <view class="info-row"><text class="label">学号：</text><text class="value">{{ userInfo.studentId }}</text></view>
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
        <view class="action-card" @tap="openAppealModal">
          <image class="action-icon" :src="declareIcon" mode="aspectFit" />
          <text class="action-text">事务申请</text>
        </view>

        <view class="action-card" @tap="openProgressModal">
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
          <picker mode="date" :value="dateStart" @change="onDateStartChange">
            <view class="filter-value">{{ dateStart || '请选择' }}</view>
          </picker>
        </view>

        <view class="filter-item">
          <text class="filter-label">结束日期</text>
          <picker mode="date" :value="dateEnd" @change="onDateEndChange">
            <view class="filter-value">{{ dateEnd || '请选择' }}</view>
          </picker>
        </view>

        <view class="filter-item">
          <text class="filter-label">最小时长(h)</text>
          <input
            class="filter-input"
            v-model="hourMin"
            type="digit"
            placeholder="例如 1.5"
            placeholder-class="filter-placeholder"
          />
        </view>

        <view class="filter-item">
          <text class="filter-label">最大时长(h)</text>
          <input
            class="filter-input"
            v-model="hourMax"
            type="digit"
            placeholder="例如 8"
            placeholder-class="filter-placeholder"
          />
        </view>
      </view>

      <view v-if="loading" class="state-row">正在加载项目记录...</view>
      <view v-else-if="errorMessage" class="state-row error">{{ errorMessage }}</view>
      <view v-else-if="!filteredHistory.length" class="state-row">暂无符合条件的项目记录</view>

      <block v-else v-for="item in filteredHistory" :key="item.id">
        <view class="history-item">
          <view class="history-head">
            <text class="history-name">{{ item.projectName }}</text>
            <text class="history-status" :class="item.statusClass">{{ item.statusText }}</text>
          </view>
          <view class="history-meta">
            <text>时间：{{ item.timeText }}</text>
          </view>
          <view class="history-meta">
            <text>时长：{{ item.hoursText }}</text>
            <text>结算：{{ item.settlementText }}</text>
          </view>
          <view class="history-meta">
            <text>记录：{{ item.validityText }}</text>
            <text>备注：{{ item.noteText }}</text>
          </view>
        </view>
      </block>

      <view v-if="!loading && filteredHistory.length" class="load-more-row">
        <text v-if="loadingMore">加载中...</text>
        <text v-else-if="!hasMore">没有更多项目了</text>
        <text v-else>上滑加载更多</text>
      </view>
    </view>
  </view>

  <BottomTabbar :selected="1" />

  <view v-if="showAppealModal" class="modal-mask" @tap="closeAppealModal">
    <view class="modal" @tap.stop>
      <view class="modal-title">提交事务申请</view>

      <view class="modal-item">
        <text class="modal-label">申请类型</text>
        <view class="segmented">
          <view class="segmented-item" :class="appealTypeFilter === 0 ? 'active' : ''" @tap="setAppealTypeFilter(0)">全部</view>
          <view class="segmented-item" :class="appealTypeFilter === 1 ? 'active' : ''" @tap="setAppealTypeFilter(1)">无效记录申诉</view>
          <view class="segmented-item" :class="appealTypeFilter === 2 ? 'active' : ''" @tap="setAppealTypeFilter(2)">时长变更</view>
        </view>
      </view>

      <view class="modal-item">
        <text class="modal-label">可申请对象</text>
        <picker mode="selector" :range="appealTargetOptions" range-key="label" :value="appealTargetIndex" @change="onAppealTargetChange">
          <view class="modal-picker">{{ selectedAppealRecordLabel }}</view>
        </picker>
      </view>

      <view class="modal-item">
        <text class="modal-label">期望时长(小时)</text>
        <input class="modal-input" v-model="appealTime" type="digit" placeholder="例如 2.5" placeholder-class="filter-placeholder" />
      </view>

      <view class="modal-item">
        <text class="modal-label">申请理由</text>
        <textarea class="modal-textarea" v-model="appealReason" placeholder="请填写申请理由" placeholder-class="filter-placeholder" />
      </view>
      <view class="modal-actions">
        <button class="modal-btn modal-btn-secondary" @tap="closeAppealModal">取消</button>
        <button class="modal-btn modal-btn-primary" @tap="submitAppeal">提交</button>
      </view>
    </view>
  </view>

  <view v-if="showProgressModal" class="modal-mask" @tap="closeProgressModal">
    <view class="modal progress-modal" @tap.stop>
      <view class="modal-title">我的审核进度</view>

      <view class="segmented">
        <view class="segmented-item" :class="progressStatusFilter === 'all' ? 'active' : ''" @tap="setProgressStatusFilter('all')">全部</view>
        <view class="segmented-item" :class="progressStatusFilter === 0 ? 'active' : ''" @tap="setProgressStatusFilter(0)">审核中</view>
        <view class="segmented-item" :class="progressStatusFilter === 1 ? 'active' : ''" @tap="setProgressStatusFilter(1)">通过</view>
        <view class="segmented-item" :class="progressStatusFilter === 2 ? 'active' : ''" @tap="setProgressStatusFilter(2)">拒绝</view>
      </view>

      <view v-if="progressLoading" class="state-row">正在加载审核进度...</view>
      <view v-else-if="!myAppeals.length" class="state-row">暂无审核记录</view>

      <scroll-view v-else class="progress-list" scroll-y @scrolltolower="onProgressScrollToLower">
        <view v-for="item in myAppeals" :key="item.id" class="progress-item">
          <view class="progress-head">
            <text class="history-name">{{ item.projectName }}</text>
            <text class="progress-status" :class="`s-${item.status}`">{{ progressStatusText(item.status) }}</text>
          </view>
          <view class="history-meta">
            <text>申请时长：{{ item.time.toFixed(1) }}h</text>
          </view>
          <view class="history-meta">
            <text>申请时间：{{ formatProjectDate(item.applyTime) }}</text>
          </view>
          <view class="history-meta">
            <text>申请理由：{{ item.reason || '-' }}</text>
          </view>
          <view class="history-meta">
            <text>审核意见：{{ item.reviewComment || '-' }}</text>
          </view>
        </view>
        <view class="load-more-row progress-load-more-row">
          <text v-if="progressLoadingMore">加载中...</text>
          <text v-else-if="!myAppealHasMore">没有更多了</text>
          <text v-else>上拉加载更多</text>
        </view>
      </scroll-view>

      <view class="modal-actions">
        <button class="modal-btn modal-btn-secondary" @tap="closeProgressModal">关闭</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'

import BackgroundGlow from '@/components/BackgroundGlow.vue'
import BottomTabbar from '@/components/BottomTabbar.vue'
import { useAuthGuard } from '@/composables/useAuthGuard'
import { useUserInfo } from '@/composables/useUserInfo'
import { DEFAULT_PAGE_SIZE } from '@/utils/constants'
import {
  type AppealStatus,
  type AppealTargetItem,
  type AppealTargetType,
  type MyAppealItem,
  type MyAppealStatusFilter,
  appealStatusTextMap,
  createAppeal,
  fetchAppealTargets,
  fetchMyAppeals,
  recordValidityTextMap,
  fetchVolunteerProjects,
  formatProjectDate,
  projectStatusTextMap,
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
  projectName: string
  statusText: string
  statusClass: 'done' | 'ongoing'
  timeText: string
  hoursText: string
  settlementText: string
  validityText: string
  noteText: string
}

const userInfo = useUserInfo({ fallbackName: '志愿者' })

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

const showAppealModal = ref(false)
const appealTypeFilter = ref<0 | AppealTargetType>(0)
const appealTargetIndex = ref(0)
const appealTime = ref('')
const appealReason = ref('')
const appealTargets = ref<AppealTargetItem[]>([])
const showProgressModal = ref(false)
const progressLoading = ref(false)
const progressLoadingMore = ref(false)
const progressStatusFilter = ref<MyAppealStatusFilter>('all')
const myAppealPage = ref(1)
const myAppealHasMore = ref(true)
const myAppeals = ref<MyAppealItem[]>([])

const toMaybeNumber = (value: string) => {
  if (!value.trim()) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
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

const onDateStartChange = (event: { detail: { value: string } }) => {
  dateStart.value = event.detail.value
}

const onDateEndChange = (event: { detail: { value: string } }) => {
  dateEnd.value = event.detail.value
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

const handleUnavailable = (label: string) => {
  uni.showToast({
    title: `${label}暂未开放`,
    icon: 'none'
  })
}

const appealTargetOptions = computed(() =>
  appealTargets.value.map((item) => ({
    participantId: item.participantId,
    label: `${item.project.name} (${item.type === 1 ? '无效记录申诉' : '时长变更'})${item.hasPendingAppeal ? ' [已有待审]' : ''}`
  }))
)

const selectedAppealRecordLabel = computed(() => {
  if (!appealTargetOptions.value.length) {
    return '暂无可申请记录'
  }

  return appealTargetOptions.value[appealTargetIndex.value]?.label || appealTargetOptions.value[0].label
})

const progressStatusText = (status: AppealStatus) => {
  if (status === 0) {
    return '审核中'
  }

  return appealStatusTextMap[status]
}

const loadMyAppeals = async (reset = false) => {
  if (reset) {
    progressLoading.value = true
    progressLoadingMore.value = false
    myAppealPage.value = 1
    myAppealHasMore.value = true
    myAppeals.value = []
  } else {
    if (!myAppealHasMore.value || progressLoading.value || progressLoadingMore.value) {
      return
    }
    progressLoadingMore.value = true
  }

  try {
    const data = await fetchMyAppeals({
      status: progressStatusFilter.value,
      page: myAppealPage.value,
      pageSize: PAGE_SIZE
    })

    myAppeals.value = reset ? data.items : [...myAppeals.value, ...data.items]
    myAppealHasMore.value = myAppeals.value.length < data.total && data.items.length === PAGE_SIZE
    if (data.items.length > 0) {
      myAppealPage.value += 1
    }
  } catch {
    if (reset) {
      myAppeals.value = []
    }
    uni.showToast({ title: '审核进度加载失败', icon: 'none' })
  } finally {
    progressLoading.value = false
    progressLoadingMore.value = false
  }
}

const setProgressStatusFilter = async (status: MyAppealStatusFilter) => {
  if (progressStatusFilter.value === status) {
    return
  }

  progressStatusFilter.value = status
  await loadMyAppeals(true)
}

const openProgressModal = async () => {
  progressStatusFilter.value = 'all'
  showProgressModal.value = true
  await loadMyAppeals(true)
}

const closeProgressModal = () => {
  showProgressModal.value = false
}

const onProgressScrollToLower = async () => {
  await loadMyAppeals(false)
}

const loadAppealTargets = async () => {
  try {
    const data = await fetchAppealTargets(appealTypeFilter.value === 0 ? {} : { type: appealTypeFilter.value })
    appealTargets.value = data.items.filter((item) => !item.hasPendingAppeal)
    appealTargetIndex.value = 0
  } catch {
    appealTargets.value = []
    uni.showToast({ title: '可申请对象加载失败', icon: 'none' })
  }
}

const setAppealTypeFilter = async (type: 0 | AppealTargetType) => {
  if (appealTypeFilter.value === type) {
    return
  }

  appealTypeFilter.value = type
  await loadAppealTargets()
}

const openAppealModal = async () => {
  appealTypeFilter.value = 0
  await loadAppealTargets()

  if (!appealTargetOptions.value.length) {
    uni.showToast({ title: '暂无可发起申请的对象', icon: 'none' })
    return
  }

  appealTargetIndex.value = 0
  appealTime.value = ''
  appealReason.value = ''
  showAppealModal.value = true
}

const closeAppealModal = () => {
  showAppealModal.value = false
}

const onAppealTargetChange = (event: { detail: { value: string } }) => {
  appealTargetIndex.value = Number(event.detail.value)
}

const submitAppeal = async () => {
  const selected = appealTargets.value[appealTargetIndex.value]
  if (!selected) {
    uni.showToast({ title: '请选择可申请对象', icon: 'none' })
    return
  }

  const time = Number(appealTime.value)
  if (!Number.isFinite(time) || time <= 0 || (time * 10) % 5 !== 0) {
    uni.showToast({ title: '请填写 0.5 精度的有效时长', icon: 'none' })
    return
  }

  const reason = appealReason.value.trim()
  if (!reason) {
    uni.showToast({ title: '请填写申请理由', icon: 'none' })
    return
  }

  try {
    await loadMyAppeals(true)
    const hasProjectPending = myAppeals.value.some((item) => item.projectId === selected.project.projectId && item.status === 0)
    if (hasProjectPending) {
      uni.showToast({ title: '该项目已有审核中的申请，暂不可重复发起', icon: 'none' })
      return
    }

    await createAppeal({
      participantId: selected.participantId,
      time,
      reason
    })
    uni.showToast({ title: '申请已提交', icon: 'none' })
    closeAppealModal()
    await loadMyAppeals()
  } catch {
    uni.showToast({ title: '申请提交失败', icon: 'none' })
  }
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

    const pageItems = data.items.filter((item) => item.projectStatus !== 0)
    historySource.value = appendUniqueRecords(historySource.value, pageItems)

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

      if (minHours !== null && item.durationHours < minHours) {
        return false
      }

      if (maxHours !== null && item.durationHours > maxHours) {
        return false
      }

      const startTs = new Date(item.startTime).getTime()
      const endTs = new Date(item.endTime).getTime()

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
      projectName: item.projectName,
      statusText: projectStatusTextMap[item.projectStatus],
      statusClass: item.projectStatus === 1 ? 'ongoing' : 'done',
      timeText: `${formatProjectDate(item.startTime)} - ${formatProjectDate(item.endTime)}`,
      hoursText: `${item.durationHours.toFixed(2)}h`,
      settlementText: item.settlementHours === null ? '-' : `${item.settlementHours.toFixed(1)}h`,
      validityText: recordValidityTextMap[item.isValid],
      noteText: item.note || '-'
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
  margin: 40rpx 24rpx 0;
  padding: 32rpx;
  background: rgba(255, 255, 255, 0.82);
  border: 1rpx solid rgba(255, 255, 255, 0.7);
  border-radius: 34rpx;
  box-shadow: 0 12rpx 32rpx rgba(15, 23, 42, 0.1);
  display: flex;
  gap: 30rpx;
  align-items: center;
}

.avatar {
  width: 176rpx;
  height: 176rpx;
  border-radius: 88rpx;
  background: #cececf;
  flex-shrink: 0;
  border: 4rpx solid rgba(255, 255, 255, 0.9);
}

.info {
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
  flex: 1;
  padding-top: 28rpx;
  padding-bottom: 28rpx;
  background: rgba(255, 255, 255, 0.88);
  border: 1rpx solid rgba(255, 255, 255, 0.75);
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 24rpx rgba(15, 23, 42, 0.08);
}

.action-icon {
  width: 50rpx;
  height: 50rpx;
  margin-bottom: 12rpx;
}

.action-text {
  font-size: 30rpx;
  color: #2b7a78;
  font-weight: 700;
  letter-spacing: 1rpx;
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

.history-item {
  padding: 14rpx 0;
  border-bottom: 1rpx dashed #e6e8ec;
}

.history-item:last-child {
  border-bottom: none;
}

.history-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6rpx;
  gap: 16rpx;
}

.history-name {
  font-size: 25rpx;
  color: #1f2d3d;
  font-weight: 600;
}

.history-status {
  font-size: 20rpx;
  padding: 4rpx 10rpx;
  border-radius: 999rpx;
}

.history-status.done {
  color: #0f766e;
  background: #ccfbf1;
}

.history-status.ongoing {
  color: #92400e;
  background: #fef3c7;
}

.history-meta {
  font-size: 21rpx;
  color: #667085;
  display: flex;
  gap: 20rpx;
  margin-top: 4rpx;
}

.load-more-row {
  padding: 18rpx 0 8rpx;
  text-align: center;
  color: #9ca3af;
  font-size: 22rpx;
}

.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 20;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx;
  box-sizing: border-box;
}

.modal {
  width: 100%;
  max-width: 680rpx;
  background: #ffffff;
  border-radius: 20rpx;
  padding: 24rpx;
  box-sizing: border-box;
}

.progress-modal {
  max-height: 78vh;
}

.progress-list {
  margin-top: 12rpx;
  max-height: 760rpx;
}

.progress-load-more-row {
  padding-top: 12rpx;
}

.progress-item {
  padding: 14rpx 0;
  border-bottom: 1rpx dashed #e6e8ec;
}

.progress-item:last-child {
  border-bottom: none;
}

.progress-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.progress-status {
  font-size: 20rpx;
  padding: 4rpx 10rpx;
  border-radius: 999rpx;
}

.progress-status.s-0 {
  color: #92400e;
  background: #fef3c7;
}

.progress-status.s-1 {
  color: #0f766e;
  background: #ccfbf1;
}

.progress-status.s-2 {
  color: #b42318;
  background: #fee4e2;
}

.modal-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #111827;
  margin-bottom: 16rpx;
}

.modal-item {
  margin-bottom: 14rpx;
}

.modal-label {
  display: block;
  font-size: 22rpx;
  color: #4b5563;
  margin-bottom: 8rpx;
}

.segmented {
  display: flex;
  gap: 10rpx;
  flex-wrap: wrap;
}

.segmented-item {
  flex: 1;
  min-width: 140rpx;
  min-height: 64rpx;
  border-radius: 10rpx;
  border: 1rpx solid #d1d5db;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4b5563;
  font-size: 22rpx;
}

.segmented-item.active {
  color: #ffffff;
  border-color: transparent;
  background: linear-gradient(135deg, #2b7a78 0%, #256f6d 100%);
}

.modal-picker,
.modal-input,
.modal-textarea {
  width: 100%;
  border: 1rpx solid #d1d5db;
  border-radius: 12rpx;
  box-sizing: border-box;
  padding: 16rpx;
  background: #f9fafb;
  color: #111827;
  font-size: 22rpx;
  min-height: 64rpx;
}

.modal-textarea {
  min-height: 176rpx;
}

.modal-actions {
  margin-top: 10rpx;
  display: flex;
  gap: 16rpx;
}

.modal-btn {
  flex: 1;
  border: none;
  border-radius: 12rpx;
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 600;
}

.modal-btn-primary {
  background: linear-gradient(135deg, #2b7a78 0%, #256f6d 100%);
}

.modal-btn-secondary {
  background: #6b7280;
}
</style>
