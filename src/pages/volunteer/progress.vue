<template>
  <view class="container">
    <BackgroundGlow />

    <view class="card">
      <view class="card-title">我的审核进度</view>

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
            <text class="project-name">{{ item.projectName }}</text>
            <text class="progress-status" :class="`s-${item.status}`">{{ progressStatusText(item.status) }}</text>
          </view>
          <view class="progress-meta">
            <text>申请类型：{{ item.type === 1 ? '无效记录申诉' : '时长变更' }}</text>
          </view>
          <view class="progress-meta">
            <text>期望审核员：{{ item.expectedReviewerName || '-' }}</text>
            <text>实际审核员：{{ item.actualReviewerName || '-' }}</text>
          </view>
          <view class="progress-meta">
            <text>申请时间：{{ formatProjectDate(item.applyTime) }}</text>
          </view>
          <view class="progress-meta">
            <text>申请理由：{{ item.reason || '-' }}</text>
          </view>
          <view class="progress-meta">
            <text>审核时间：{{ item.reviewTime ? formatProjectDate(item.reviewTime) : '待审核' }}</text>
          </view>
          <view class="progress-meta">
            <text>审核意见：{{ item.reviewComment || '-' }}</text>
          </view>
        </view>
        <view class="load-more-row">
          <text v-if="progressLoadingMore">加载中...</text>
          <text v-else-if="!myAppealHasMore">没有更多了</text>
          <text v-else>上拉加载更多</text>
        </view>
      </scroll-view>

      <view class="actions">
        <button class="btn btn-secondary" @tap="goBack">返回</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onPullDownRefresh } from '@dcloudio/uni-app'

import BackgroundGlow from '@/components/BackgroundGlow.vue'
import { useAuthGuard } from '@/composables/useAuthGuard'
import { openFunctionEntry } from '@/utils/navigation'
import {
  appealStatusTextMap,
  fetchMyAppeals,
  formatProjectDate,
  type AppealStatus,
  type MyAppealItem,
  type MyAppealStatusFilter
} from '@/utils/project'

const PAGE_SIZE = 20

const progressLoading = ref(false)
const progressLoadingMore = ref(false)
const progressStatusFilter = ref<MyAppealStatusFilter>('all')
const myAppealPage = ref(1)
const myAppealHasMore = ref(true)
const myAppeals = ref<MyAppealItem[]>([])

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

const onProgressScrollToLower = async () => {
  await loadMyAppeals(false)
}

const goBack = () => {
  uni.navigateBack()
}

useAuthGuard({
  routePath: '/pages/volunteer/progress',
  roleCheck: (role) => role !== 1,
  onForbidden: () => {
    openFunctionEntry()
  },
  onAuthorized: async () => {
    progressStatusFilter.value = 'all'
    await loadMyAppeals(true)
  }
})

onPullDownRefresh(async () => {
  await loadMyAppeals(true)
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

.segmented {
  display: flex;
  gap: 10rpx;
  flex-wrap: wrap;
  margin-bottom: 14rpx;
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

.state-row {
  padding: 24rpx 0;
  text-align: center;
  font-size: 24rpx;
  color: #6b7280;
}

.progress-list {
  max-height: calc(100vh - 380rpx);
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

.project-name {
  font-size: 25rpx;
  color: #1f2d3d;
  font-weight: 600;
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

.progress-meta {
  font-size: 21rpx;
  color: #667085;
  margin-top: 4rpx;
}

.load-more-row {
  padding: 18rpx 0 8rpx;
  text-align: center;
  color: #9ca3af;
  font-size: 22rpx;
}

.actions {
  margin-top: 10rpx;
  display: flex;
}

.btn {
  width: 100%;
  border: none;
  border-radius: 12rpx;
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 600;
}

.btn-secondary {
  background: #6b7280;
}
</style>
