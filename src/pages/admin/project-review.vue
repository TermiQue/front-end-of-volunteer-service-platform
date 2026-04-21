<template>
  <view class="page">
    <BackgroundGlow />
    <view class="content">
      <view class="search-bar">
        <text class="search-label">状态</text>
        <view class="search-segment">
          <view class="search-segment-item" :class="statusFilter === null ? 'active' : ''" @tap="setStatusFilter(null)">
            全部
          </view>
          <view class="search-segment-item" :class="statusFilter === 0 ? 'active' : ''" @tap="setStatusFilter(0)">
            待审核
          </view>
          <view class="search-segment-item" :class="statusFilter === 1 ? 'active' : ''" @tap="setStatusFilter(1)">
            已通过
          </view>
          <view class="search-segment-item" :class="statusFilter === 2 ? 'active' : ''" @tap="setStatusFilter(2)">
            已拒绝
          </view>
        </view>
      </view>

      <view class="search-bar">
        <text class="scope-tip">{{ reviewScopeTips }}</text>
      </view>

      <view class="search-bar">
        <text class="search-label">申请人ID</text>
        <input class="search-input" v-model="applicantId" type="number" placeholder="可选" placeholder-class="search-placeholder" />
      </view>

      <view class="table-wrapper">
        <view v-if="loading && !appeals.length" class="state-row">正在加载申请列表...</view>
        <view v-else-if="errorMessage" class="state-row error">{{ errorMessage }}</view>
        <view v-else-if="!appeals.length" class="state-row">暂无申请记录</view>

        <view v-else class="card-list">
          <view v-for="item in appeals" :key="item.id" class="appeal-card">
            <view class="card-head">
              <text class="card-title">{{ item.applicantName }} ({{ item.applicantStudentId || '-' }})</text>
              <text class="card-status" :class="statusClass(item.status)">{{ appealStatusTextMap[item.status] }}</text>
            </view>
            <view class="meta">项目：{{ item.projectName || '-' }}</view>
            <view class="meta">期望时长：{{ item.time.toFixed(1) }}h</view>
            <view class="meta">期望审核员：{{ item.expectedReviewerName || '-' }}</view>
            <view class="meta">申请时间：{{ formatProjectDate(item.applyTime) }}</view>
            <view class="meta reason">理由：{{ item.reason }}</view>
            <view v-if="item.reviewComment && item.reviewComment !== '-'" class="meta">审核意见：{{ item.reviewComment }}</view>

            <view v-if="item.status === 0" class="actions">
              <button class="item-btn item-btn-approve" :disabled="actionLock" @tap="openReviewModal(item, 1)">通过</button>
              <button class="item-btn item-btn-reject" :disabled="actionLock" @tap="openReviewModal(item, 2)">拒绝</button>
            </view>
          </view>
        </view>

        <view v-if="appeals.length" class="load-more-row">
          <text v-if="loadingMore">加载中...</text>
          <text v-else-if="!hasMore">没有更多了</text>
          <text v-else>上拉加载更多</text>
        </view>
      </view>
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
import { computed, ref } from 'vue'
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'

import BackgroundGlow from '@/components/BackgroundGlow.vue'
import { useAuthGuard } from '@/composables/useAuthGuard'
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
const applicantId = ref('')

const PAGE_SIZE = 8

const showReviewModal = ref(false)
const reviewComment = ref('')
const reviewMode = ref<1 | 2>(1)
const activeAppeal = ref<AdminAppealItem | null>(null)

const reviewScopeTips = computed(() => '当前列表默认返回你可审核的请求')

const toMaybeNumber = (value: string) => {
  if (!value.trim()) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const statusClass = (status: AppealStatus) => {
  if (status === 1) {
    return 'approved'
  }

  if (status === 2) {
    return 'rejected'
  }

  return 'pending'
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
  applicantId: toMaybeNumber(applicantId.value),
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

const setStatusFilter = async (status: AppealStatus | null) => {
  statusFilter.value = status
  await loadAppeals(true)
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
  }
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
  padding: 40rpx 30rpx calc(200rpx + env(safe-area-inset-bottom));
}

.search-bar {
  margin-bottom: 20rpx;
  padding: 22rpx 24rpx;
  background: rgba(255, 255, 255, 0.84);
  border: 1rpx solid rgba(255, 255, 255, 0.72);
  border-radius: 22rpx;
  box-shadow: 0 14rpx 34rpx rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.search-label {
  flex-shrink: 0;
  font-size: 28rpx;
  font-weight: 700;
  color: #2b7a78;
}

.scope-tip {
  font-size: 24rpx;
  color: #64748b;
}

.search-segment {
  display: flex;
  gap: 10rpx;
  flex-wrap: wrap;
}

.search-segment-item {
  min-width: 110rpx;
  height: 56rpx;
  padding: 0 16rpx;
  border-radius: 12rpx;
  border: 1rpx solid #d7dde3;
  background: rgba(248, 250, 252, 0.96);
  color: #4b5563;
  font-size: 24rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-segment-item.active {
  color: #ffffff;
  border-color: transparent;
  background: linear-gradient(135deg, #2d7b7c 0%, #3ea88f 100%);
}

.search-input {
  flex: 1;
  height: 72rpx;
  padding: 0 20rpx;
  border-radius: 16rpx;
  background: rgba(248, 250, 252, 0.96);
  font-size: 26rpx;
  color: #111827;
  box-sizing: border-box;
}

.search-placeholder {
  color: #9ca3af;
}

.table-wrapper {
  background: rgba(255, 255, 255, 0.84);
  border: 1rpx solid rgba(255, 255, 255, 0.72);
  border-radius: 22rpx;
  box-shadow: 0 14rpx 34rpx rgba(15, 23, 42, 0.08);
  overflow: hidden;
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

.card-list {
  padding: 18rpx;
}

.appeal-card {
  border-radius: 16rpx;
  background: #f8fafc;
  border: 1rpx solid #e5e7eb;
  padding: 18rpx;
  margin-bottom: 14rpx;
}

.appeal-card:last-child {
  margin-bottom: 0;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 10rpx;
}

.card-title {
  color: #111827;
  font-size: 28rpx;
  font-weight: 700;
}

.card-status {
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 600;
}

.card-status.pending {
  color: #9a6700;
  background: #fff7d6;
}

.card-status.approved {
  color: #047857;
  background: #dcfce7;
}

.card-status.rejected {
  color: #b42318;
  background: #fee2e2;
}

.meta {
  font-size: 24rpx;
  color: #4b5563;
  margin-top: 6rpx;
}

.meta.reason {
  line-height: 1.6;
}

.actions {
  margin-top: 16rpx;
  display: flex;
  gap: 12rpx;
}

.item-btn {
  margin: 0;
  flex: 1;
  height: 70rpx;
  border: none;
  border-radius: 12rpx;
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 600;
}

.item-btn::after {
  border: none;
}

.item-btn-approve {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
}

.item-btn-reject {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
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
