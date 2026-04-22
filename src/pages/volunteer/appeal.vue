<template>
  <view class="container">
    <BackgroundGlow />

    <view class="card">
      <view class="card-title">提交事务申请</view>

      <view class="form-item">
        <text class="form-label">申请类型</text>
        <view class="segmented">
          <view class="segmented-item" :class="appealTypeFilter === 0 ? 'active' : ''" @tap="setAppealTypeFilter(0)">全部</view>
          <view class="segmented-item" :class="appealTypeFilter === 1 ? 'active' : ''" @tap="setAppealTypeFilter(1)">无效记录申诉</view>
          <view class="segmented-item" :class="appealTypeFilter === 2 ? 'active' : ''" @tap="setAppealTypeFilter(2)">时长变更</view>
        </view>
      </view>

      <view class="form-item">
        <text class="form-label">可申请对象</text>
        <picker mode="selector" :range="appealTargetOptions" range-key="label" :value="appealTargetIndex" @change="onAppealTargetChange">
          <view class="picker-value">{{ selectedAppealRecordLabel }}</view>
        </picker>
      </view>

      <view class="form-item">
        <text class="form-label">期望时长(小时)</text>
        <PopupDurationPicker v-model="appealTime" title="选择期望时长" placeholder="例如 2.5" :max-hours="24" />
      </view>

      <view class="form-item">
        <text class="form-label">申请理由</text>
        <textarea class="textarea" v-model="appealReason" placeholder="请填写申请理由" placeholder-class="placeholder" />
      </view>

      <view v-if="loadingTargets" class="state-row">正在加载可申请对象...</view>
      <view v-else-if="!appealTargetOptions.length" class="state-row">暂无可发起申请的对象</view>

      <view class="actions">
        <button class="btn btn-secondary" @tap="goBack">返回</button>
        <button class="btn btn-primary" :disabled="submitting || loadingTargets || !appealTargetOptions.length" @tap="submitAppeal">
          {{ submitting ? '提交中...' : '提交' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onPullDownRefresh } from '@dcloudio/uni-app'

import BackgroundGlow from '@/components/BackgroundGlow.vue'
import PopupDurationPicker from '@/components/PopupDurationPicker.vue'
import { useAuthGuard } from '@/composables/useAuthGuard'
import { openFunctionEntry } from '@/utils/navigation'
import {
  createAppeal,
  fetchAppealTargets,
  fetchMyAppeals,
  type AppealTargetItem,
  type AppealTargetType
} from '@/utils/project'

const appealTypeFilter = ref<0 | AppealTargetType>(0)
const appealTargetIndex = ref(0)
const appealTime = ref('')
const appealReason = ref('')
const appealTargets = ref<AppealTargetItem[]>([])
const loadingTargets = ref(false)
const submitting = ref(false)

const PAGE_SIZE = 50

const appealTargetOptions = computed(() =>
  appealTargets.value.map((item) => ({
    participantId: item.participantId,
    projectId: item.project.projectId,
    label: `${item.project.name} (${item.type === 1 ? '无效记录申诉' : '时长变更'})`
  }))
)

const selectedAppealRecordLabel = computed(() => {
  if (!appealTargetOptions.value.length) {
    return '暂无可申请记录'
  }

  return appealTargetOptions.value[appealTargetIndex.value]?.label || appealTargetOptions.value[0].label
})

const resetForm = () => {
  appealTargetIndex.value = 0
  appealTime.value = ''
  appealReason.value = ''
}

const loadAppealTargets = async () => {
  loadingTargets.value = true
  try {
    const data = await fetchAppealTargets(appealTypeFilter.value === 0 ? {} : { type: appealTypeFilter.value })
    appealTargets.value = data.items.filter((item) => !item.hasPendingAppeal)
    appealTargetIndex.value = 0
  } catch {
    appealTargets.value = []
    uni.showToast({ title: '可申请对象加载失败', icon: 'none' })
  } finally {
    loadingTargets.value = false
  }
}

const setAppealTypeFilter = async (type: 0 | AppealTargetType) => {
  if (appealTypeFilter.value === type || loadingTargets.value) {
    return
  }

  appealTypeFilter.value = type
  await loadAppealTargets()
}

const onAppealTargetChange = (event: { detail: { value: string } }) => {
  appealTargetIndex.value = Number(event.detail.value)
}

const hasPendingAppealForProject = async (projectId: number) => {
  let page = 1
  let totalLoaded = 0
  let total = Number.POSITIVE_INFINITY

  while (totalLoaded < total) {
    const data = await fetchMyAppeals({
      status: 0,
      page,
      pageSize: PAGE_SIZE
    })

    if (data.items.some((item) => item.projectId === projectId)) {
      return true
    }

    totalLoaded += data.items.length
    total = data.total

    if (!data.items.length) {
      break
    }

    page += 1
  }

  return false
}

const submitAppeal = async () => {
  if (submitting.value) {
    return
  }

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

  submitting.value = true
  try {
    const hasProjectPending = await hasPendingAppealForProject(selected.project.projectId)
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
    resetForm()
    await loadAppealTargets()
  } catch {
    uni.showToast({ title: '申请提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

const goBack = () => {
  uni.navigateBack()
}

useAuthGuard({
  routePath: '/pages/volunteer/appeal',
  roleCheck: (role) => role !== 1,
  onForbidden: () => {
    openFunctionEntry()
  },
  onAuthorized: async () => {
    resetForm()
    appealTypeFilter.value = 0
    await loadAppealTargets()
  }
})

onPullDownRefresh(async () => {
  await loadAppealTargets()
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
  padding: 26rpx 24rpx calc(36rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.card {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.9);
  border: 1rpx solid rgba(255, 255, 255, 0.75);
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 10rpx 24rpx rgba(15, 23, 42, 0.08);
}

.card-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #2b7a78;
  margin-bottom: 20rpx;
}

.form-item {
  margin-bottom: 16rpx;
}

.form-label {
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
  min-width: 150rpx;
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

.picker-value,
.textarea {
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

.textarea {
  min-height: 176rpx;
}

.placeholder {
  color: #9ca3af;
}

.state-row {
  padding: 10rpx 0 14rpx;
  text-align: center;
  font-size: 22rpx;
  color: #6b7280;
}

.actions {
  margin-top: 10rpx;
  display: flex;
  gap: 16rpx;
}

.btn {
  flex: 1;
  border: none;
  border-radius: 12rpx;
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 600;
}

.btn-primary {
  background: linear-gradient(135deg, #2b7a78 0%, #256f6d 100%);
}

.btn-secondary {
  background: #6b7280;
}

.btn[disabled] {
  opacity: 0.6;
}
</style>
