<template>
  <view class="page">
    <BackgroundGlow />
    <view class="content">
      <ProjectRecordSection
        title="申请审批"
        :items="appealRecordItems"
        :loading="loading && !appeals.length"
        :loading-more="loadingMore"
        :has-more="hasMore"
        :error-message="errorMessage"
        loading-text="正在加载申请列表..."
        empty-text="暂无申请记录"
        no-more-text="没有更多了"
      >
        <template #filters>
          <SegmentFilter :model-value="statusFilterValue" :options="statusFilterOptions" @change="onStatusFilterChange" />

          <view class="filter-bar">
            <view class="filter-bar-item">
              <FilterInput v-model="projectName" label="项目名" placeholder="请输入项目名关键词" />
            </view>

            <view class="filter-bar-item">
              <FilterInput v-model="applicantName" label="申请人姓名" placeholder="请输入姓名关键词" />
            </view>

            <view class="filter-bar-item">
              <FilterInput v-model="applicantStudentId" label="申请人学号" placeholder="请输入学号关键词" />
            </view>

            <view class="scope-tip">{{ reviewScopeTips }}</view>
          </view>
        </template>
      </ProjectRecordSection>
    </view>

    <view v-if="showReviewModal" class="modal-mask" @tap="closeReviewModal">
      <view class="modal" @tap.stop>
        <view class="modal-title">{{ reviewMode === 1 ? '审核通过' : '审核拒绝' }}</view>
        <textarea
          v-model="reviewComment"
          class="modal-textarea"
          placeholder="请输入审核意见（必填）"
          placeholder-class="search-placeholder"
        />
        <view class="modal-actions">
          <button class="modal-btn modal-btn-secondary" @tap="closeReviewModal">取消</button>
          <button class="modal-btn modal-btn-primary" :disabled="actionLock" @tap="submitReview">确认提交</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'

import BackgroundGlow from '@/components/BackgroundGlow.vue'
import FilterInput from '@/components/FilterInput.vue'
import ProjectRecordSection, { type ProjectRecordItem } from '@/components/ProjectRecordSection.vue'
import SegmentFilter from '@/components/SegmentFilter.vue'
import { useAuthGuard } from '@/composables/useAuthGuard'
import { DEFAULT_PAGE_SIZE } from '@/utils/constants'
import { openFunctionEntry } from '@/utils/navigation'
import {
  appealStatusTextMap,
  approveAdminAppeal,
  fetchAdminAppeals,
  formatProjectDate,
  rejectAdminAppeal,
  type AdminAppealItem,
  type AppealStatus
} from '@/utils/project'

const appeals = ref<AdminAppealItem[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const errorMessage = ref('')
const actionLock = ref(false)
const page = ref(1)
const hasMore = ref(true)

const statusFilter = ref<AppealStatus | null>(0)
const projectName = ref('')
const applicantName = ref('')
const applicantStudentId = ref('')
const STATUS_FILTER_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '待审核', value: '0' },
  { label: '已通过', value: '1' },
  { label: '已拒绝', value: '2' }
] as const

const PAGE_SIZE = DEFAULT_PAGE_SIZE
const statusFilterOptions = [...STATUS_FILTER_OPTIONS]

const showReviewModal = ref(false)
const reviewComment = ref('')
const reviewMode = ref<1 | 2>(1)
const activeAppeal = ref<AdminAppealItem | null>(null)
let autoQueryTimer: ReturnType<typeof setTimeout> | null = null
let autoQueryReady = false

const reviewScopeTips = computed(() => '当前列表默认返回你可审核的申请；超级管理员可查看全部。')
const statusFilterValue = computed(() => {
  return statusFilter.value === null ? 'all' : String(statusFilter.value)
})

const formatParticipationTime = (item: AdminAppealItem) => {
  const checkIn = item.actualCheckInTime ? formatProjectDate(String(item.actualCheckInTime)) : '-'
  const checkOut = item.actualCheckOutTime ? formatProjectDate(String(item.actualCheckOutTime)) : '-'
  return `${checkIn} / ${checkOut}`
}

const buildAppealInfoCard = (item: AdminAppealItem) => {
  const statusWhen = item.status === 1 ? 'approved' : item.status === 2 ? 'rejected' : 'pending'

  return {
    title: {
      text: `${item.applicantName}（${item.applicantStudentId || '-'}）`
    },
    tag: {
      text: appealStatusTextMap[item.status],
      when: statusWhen,
      matchers: [
        { when: 'pending', type: 1 as const },
        { when: 'approved', type: 2 as const },
        { when: 'rejected', type: 3 as const }
      ]
    },
    rows: [
      [{ text: `项目：${item.projectName || '-'}` }, { text: `手机号：${item.applicantPhone || '-'}` }],
      [{ text: `参与时间：${formatParticipationTime(item)}` }],
      [{ text: `申请时间：${formatProjectDate(item.applyTime)}` }],
      [{ text: `申请时长：${item.time.toFixed(1)}h` }],
      [{ text: `理由：${item.reason || '-'}` }],
      [{ text: `审核意见：${item.reviewComment && item.reviewComment !== '-' ? item.reviewComment : '-'}` }]
    ],
    buttonRows:
      item.status === 0
        ? [[
            {
              text: '通过',
              type: 2 as const,
              disabled: actionLock.value,
              onTap: async () => {
                openReviewModal(item, 1)
              }
            },
            {
              text: '拒绝',
              type: 4 as const,
              disabled: actionLock.value,
              onTap: async () => {
                openReviewModal(item, 2)
              }
            }
          ]]
        : undefined
  }
}

const appealRecordItems = computed<ProjectRecordItem[]>(() => {
  return appeals.value.map((item) => ({
    id: item.id,
    card: buildAppealInfoCard(item)
  }))
})

const triggerAutoQuery = (immediate = false) => {
  if (!autoQueryReady) {
    return
  }

  if (autoQueryTimer) {
    clearTimeout(autoQueryTimer)
    autoQueryTimer = null
  }

  if (immediate) {
    void loadAppeals(true)
    return
  }

  autoQueryTimer = setTimeout(() => {
    autoQueryTimer = null
    void loadAppeals(true)
  }, 260)
}

const appendUniqueAppeals = (existing: AdminAppealItem[], incoming: AdminAppealItem[]) => {
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

const buildQuery = () => ({
  status: statusFilter.value ?? undefined,
  projectName: projectName.value.trim() || undefined,
  applicantName: applicantName.value.trim() || undefined,
  applicantStudentId: applicantStudentId.value.trim() || undefined,
  page: page.value,
  pageSize: PAGE_SIZE
})

const loadAppeals = async (reset = false) => {
  if (reset) {
    loading.value = true
    loadingMore.value = false
    errorMessage.value = ''
    page.value = 1
    hasMore.value = true
    appeals.value = []
  } else {
    if (!hasMore.value || loadingMore.value || loading.value) {
      return
    }
    loadingMore.value = true
  }

  try {
    const data = await fetchAdminAppeals(buildQuery())
    appeals.value = reset ? data.items : appendUniqueAppeals(appeals.value, data.items)
    hasMore.value = appeals.value.length < data.total && data.items.length === PAGE_SIZE
    if (data.items.length > 0) {
      page.value += 1
    }
  } catch {
    if (reset) {
      errorMessage.value = '申请列表加载失败，请下拉重试'
      appeals.value = []
    } else {
      uni.showToast({ title: '加载下一页失败，请重试', icon: 'none' })
    }
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const onStatusFilterChange = (value: string) => {
  statusFilter.value = value === 'all' ? null : (Number(value) as AppealStatus)
  triggerAutoQuery(true)
}

const openReviewModal = (item: AdminAppealItem, mode: 1 | 2) => {
  activeAppeal.value = item
  reviewMode.value = mode
  reviewComment.value = ''
  showReviewModal.value = true
}

const closeReviewModal = () => {
  showReviewModal.value = false
  reviewComment.value = ''
  activeAppeal.value = null
}

const submitReview = async () => {
  if (actionLock.value || !activeAppeal.value) {
    return
  }

  const comment = reviewComment.value.trim()
  if (!comment) {
    uni.showToast({ title: '请填写审核意见', icon: 'none' })
    return
  }

  actionLock.value = true
  try {
    if (reviewMode.value === 1) {
      await approveAdminAppeal(activeAppeal.value.id, comment)
      uni.showToast({ title: '已通过申请', icon: 'none' })
    } else {
      await rejectAdminAppeal(activeAppeal.value.id, comment)
      uni.showToast({ title: '已拒绝申请', icon: 'none' })
    }
    closeReviewModal()
    await loadAppeals(true)
  } catch {
    uni.showToast({ title: '提交失败，请重试', icon: 'none' })
  } finally {
    actionLock.value = false
  }
}

useAuthGuard({
  routePath: '/pages/admin/project-review',
  roleCheck: (role) => role === 2 || role === 3,
  onForbidden: () => {
    openFunctionEntry()
  },
  onAuthorized: async () => {
    await loadAppeals(true)
    autoQueryReady = true
  }
})

watch(projectName, () => {
  triggerAutoQuery(false)
})

watch(applicantName, () => {
  triggerAutoQuery(false)
})

watch(applicantStudentId, () => {
  triggerAutoQuery(false)
})

onReachBottom(async () => {
  await loadAppeals(false)
})

onPullDownRefresh(async () => {
  await loadAppeals(true)
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
  padding: 24rpx 0 calc(200rpx + env(safe-area-inset-bottom));
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

.scope-tip {
  padding: 0 8rpx;
  font-size: 22rpx;
  color: #64748b;
}

.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(17, 24, 39, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx;
}

.modal {
  width: 100%;
  max-width: 680rpx;
  border-radius: 18rpx;
  background: #ffffff;
  padding: 24rpx;
}

.modal-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #111827;
  margin-bottom: 16rpx;
}

.modal-textarea {
  width: 100%;
  min-height: 180rpx;
  border-radius: 12rpx;
  border: 1rpx solid #d1d5db;
  background: #f8fafc;
  padding: 16rpx;
  font-size: 24rpx;
  color: #111827;
  box-sizing: border-box;
}

.modal-actions {
  margin-top: 18rpx;
  display: flex;
  gap: 12rpx;
}

.modal-btn {
  margin: 0;
  flex: 1;
  height: 70rpx;
  border: none;
  border-radius: 12rpx;
  font-size: 24rpx;
  font-weight: 600;
}

.modal-btn::after {
  border: none;
}

.modal-btn-primary {
  color: #ffffff;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.modal-btn-secondary {
  color: #374151;
  background: #e5e7eb;
}
</style>
