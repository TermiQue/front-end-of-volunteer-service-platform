<template>
  <view class="page">
    <BackgroundGlow />

    <view class="content">
      <ProjectRecordSection
        title="事务申请"
        :items="appealRecordItems"
        :loading="loadingTargets && !appealTargets.length"
        :error-message="errorMessage"
        :has-more="false"
        loading-text="正在加载可申请对象..."
        empty-text="暂无可发起申请的对象"
        no-more-text=""
        idle-more-text=""
      >
        <template #filters>
          <SegmentFilter :model-value="appealTypeFilterValue" :options="appealTypeFilterOptions" @change="onAppealTypeFilterChange" />
        </template>
      </ProjectRecordSection>
    </view>

    <view v-if="showAppealModal" class="modal-mask" @tap="closeAppealModal">
      <view class="modal" @tap.stop>
        <view class="modal-title">提交事务申请</view>

        <view class="modal-item">
          <text class="modal-label">项目</text>
          <view class="modal-readonly">{{ activeTarget?.projectName || '-' }}</view>
        </view>

        <view class="modal-item">
          <text class="modal-label">申请类型</text>
          <view class="modal-readonly">{{ activeTargetTypeText }}</view>
        </view>

        <view class="modal-item">
          <text class="modal-label">负责人</text>
          <view class="modal-readonly">{{ activeTarget?.responsibleName || '-' }}</view>
        </view>

        <view class="modal-item">
          <text class="modal-label">签到 / 签退</text>
          <view class="modal-readonly">{{ activeCheckTimeText }}</view>
        </view>

        <view class="modal-item">
          <text class="modal-label">期望时长(小时)</text>
          <PopupDurationPicker v-model="appealTime" title="选择期望时长" placeholder="例如 2.5" :max-hours="24" />
        </view>

        <view class="modal-item">
          <text class="modal-label">申请理由</text>
          <textarea class="modal-textarea" v-model="appealReason" placeholder="请填写申请理由" placeholder-class="placeholder" />
        </view>

        <view class="modal-actions">
          <button class="btn btn-secondary" @tap="closeAppealModal">取消</button>
          <button class="btn btn-primary" :disabled="submitting" @tap="submitAppeal">
            {{ submitting ? '提交中...' : '提交申请' }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onPullDownRefresh } from '@dcloudio/uni-app'

import BackgroundGlow from '@/components/BackgroundGlow.vue'
import PopupDurationPicker from '@/components/PopupDurationPicker.vue'
import ProjectRecordSection, { type ProjectRecordItem } from '@/components/ProjectRecordSection.vue'
import SegmentFilter from '@/components/SegmentFilter.vue'
import { useAuthGuard } from '@/composables/useAuthGuard'
import { openFunctionEntry } from '@/utils/navigation'
import {
  createAppeal,
  fetchAppealTargets,
  fetchMyAppeals,
  formatProjectDate,
  type AppealTargetItem,
  type AppealTargetType
} from '@/utils/project'

const appealTypeFilter = ref<0 | AppealTargetType>(0)
const appealTime = ref('')
const appealReason = ref('')
const appealTargets = ref<AppealTargetItem[]>([])
const loadingTargets = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const showAppealModal = ref(false)
const activeTarget = ref<AppealTargetItem | null>(null)

const PAGE_SIZE = 50
const APPEAL_TYPE_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '无效记录申诉', value: '1' },
  { label: '时长变更', value: '2' }
] as const

const appealTypeFilterOptions = [...APPEAL_TYPE_OPTIONS]
const appealTypeFilterValue = computed(() => (appealTypeFilter.value === 0 ? 'all' : String(appealTypeFilter.value)))
const activeTargetTypeText = computed(() => {
  if (!activeTarget.value) {
    return '-'
  }
  return activeTarget.value.type === 1 ? '无效记录申诉' : '时长变更'
})
const activeCheckTimeText = computed(() => {
  if (!activeTarget.value) {
    return '-'
  }

  return `${formatActualTime(activeTarget.value.actualCheckInTime)} / ${formatActualTime(activeTarget.value.actualCheckOutTime)}`
})

const formatActualTime = (value: string | number | null) => {
  if (value === 0 || value === '0' || value === null || value === undefined || value === '') {
    return '无'
  }

  return formatProjectDate(String(value))
}

const resetForm = () => {
  appealTime.value = ''
  appealReason.value = ''
}

const buildAppealTargetCard = (item: AppealTargetItem) => {
  const typeText = item.type === 1 ? '无效记录申诉' : '时长变更'
  const typeWhen = item.type === 1 ? 'appeal-invalid' : 'appeal-duration'

  return {
    title: {
      text: item.projectName
    },
    tag: {
      text: typeText,
      when: typeWhen,
      matchers: [
        { when: 'appeal-invalid', type: 3 as const },
        { when: 'appeal-duration', type: 2 as const }
      ]
    },
    rows: [
      [{ text: `负责人：${item.responsibleName || '-'}` }],
      [{ text: `签到：${formatActualTime(item.actualCheckInTime)}` }, { text: `签退：${formatActualTime(item.actualCheckOutTime)}` }]
    ],
    buttonRows: [[
      {
        text: '发起申请',
        type: 1 as const,
        onTap: async () => {
          openAppealModal(item)
        }
      }
    ]]
  }
}

const appealRecordItems = computed<ProjectRecordItem[]>(() => {
  return appealTargets.value.map((item) => ({
    id: item.participantId,
    card: buildAppealTargetCard(item)
  }))
})

const loadAppealTargets = async () => {
  loadingTargets.value = true
  errorMessage.value = ''
  try {
    const data = await fetchAppealTargets(appealTypeFilter.value === 0 ? {} : { type: appealTypeFilter.value })
    appealTargets.value = data.items
  } catch {
    appealTargets.value = []
    errorMessage.value = '可申请对象加载失败，请下拉重试'
  } finally {
    loadingTargets.value = false
  }
}

const onAppealTypeFilterChange = async (value: string) => {
  const nextType = value === 'all' ? 0 : (Number(value) as AppealTargetType)
  if (appealTypeFilter.value === nextType || loadingTargets.value) {
    return
  }

  appealTypeFilter.value = nextType
  await loadAppealTargets()
}

const hasPendingAppealForProject = async (projectName: string) => {
  let page = 1
  let totalLoaded = 0
  let total = Number.POSITIVE_INFINITY

  while (totalLoaded < total) {
    const data = await fetchMyAppeals({
      status: 0,
      page,
      pageSize: PAGE_SIZE
    })

    if (data.items.some((item) => item.status === 0 && item.projectName === projectName)) {
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

const openAppealModal = (item: AppealTargetItem) => {
  activeTarget.value = item
  resetForm()
  showAppealModal.value = true
}

const closeAppealModal = () => {
  if (submitting.value) {
    return
  }

  showAppealModal.value = false
  activeTarget.value = null
  resetForm()
}

const submitAppeal = async () => {
  if (submitting.value) {
    return
  }

  const selected = activeTarget.value
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
    const hasProjectPending = await hasPendingAppealForProject(selected.projectName)
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
    activeTarget.value = null
    showAppealModal.value = false
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
  padding: 24rpx 0 calc(220rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.actions {
  margin: -12rpx 24rpx 0;
  display: flex;
}

.btn {
  margin: 0;
  width: 100%;
  height: 66rpx;
  border: none;
  border-radius: 10rpx;
  font-size: 28rpx;
  line-height: 66rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn::after {
  border: none;
}

.btn-primary {
  color: #422006;
  background: linear-gradient(135deg, #facc15 0%, #f59e0b 100%);
}

.btn[disabled] {
  opacity: 0.6;
}

.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
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

.modal-readonly,
.modal-textarea {
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
  display: flex;
  align-items: center;
  color: #334155;
  font-weight: 600;
}

.modal-textarea {
  min-height: 176rpx;
  padding-top: 16rpx;
  padding-bottom: 16rpx;
}

.modal-actions {
  margin-top: 20rpx;
  display: flex;
  gap: 12rpx;
}

.placeholder {
  color: #9ca3af;
}
</style>
