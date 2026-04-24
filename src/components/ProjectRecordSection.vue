<template>
  <view class="project-record-section">
    <view class="project-record-header">
      <view class="project-record-title">{{ title }}</view>

      <view v-if="$slots['header-actions']" class="project-record-header-actions">
        <slot name="header-actions" />
      </view>
    </view>

    <view v-if="$slots.filters" class="project-record-filters-wrap">
      <slot name="filters" />
    </view>

    <view class="project-record-list">
      <view v-if="loading" class="project-record-state-row">{{ loadingText }}</view>
      <view v-else-if="errorMessage" class="project-record-state-row error">{{ errorMessage }}</view>
      <view v-else-if="!items.length" class="project-record-state-row">{{ emptyText }}</view>

      <block v-else>
        <InfoLineCard v-for="item in items" :key="item.id" :card="item.card" />
      </block>

      <view v-if="!loading && items.length" class="project-record-load-more-row">
        <text v-if="loadingMore">{{ loadingMoreText }}</text>
        <text v-else-if="!hasMore">{{ noMoreText }}</text>
        <text v-else>{{ idleMoreText }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import InfoLineCard from '@/components/InfoLineCard.vue'

type ProjectRecordMatcher = {
  when: string
  type: 1 | 2 | 3
}

type ProjectRecordButton = {
  text?: string
  type?: 0 | 1 | 2 | 3 | 4
  className?: string
  disabled?: boolean
  loading?: boolean
  loadingText?: string
  onTap?: (payload: { button: ProjectRecordButton; rowIndex: number; buttonIndex: number }) => void | Promise<void>
}

type ProjectRecordCard = {
  title: {
    text: string
    className?: string
  }
  tag: {
    text: string
    when: string
    matchers: ProjectRecordMatcher[]
  }
  rows: Array<
    Array<{
      text: string
      className?: string
    }>
  >
  buttonRows?: ProjectRecordButton[][]
}

type ProjectRecordItem = {
  id: number | string
  card: ProjectRecordCard
}

withDefaults(
  defineProps<{
    title?: string
    items: ProjectRecordItem[]
    loading: boolean
    loadingMore?: boolean
    hasMore?: boolean
    errorMessage?: string
    loadingText?: string
    emptyText?: string
    loadingMoreText?: string
    noMoreText?: string
    idleMoreText?: string
  }>(),
  {
    title: '项目记录',
    loadingMore: false,
    hasMore: true,
    errorMessage: '',
    loadingText: '正在加载项目记录...',
    emptyText: '暂无符合条件的项目记录',
    loadingMoreText: '加载中...',
    noMoreText: '没有更多项目了',
    idleMoreText: '上滑加载更多'
  }
)

export type { ProjectRecordCard, ProjectRecordItem }
</script>

<style scoped lang="scss">
.project-record-section {
  position: relative;
  overflow: hidden;
  margin: 36rpx 24rpx 36rpx;
  padding: 20rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.34);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  box-shadow:
    0 14rpx 32rpx rgba(15, 23, 42, 0.1),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(16rpx) saturate(135%);
  -webkit-backdrop-filter: blur(16rpx) saturate(135%);
  box-sizing: border-box;
}

.project-record-section::before {
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

.project-record-header,
.project-record-title,
.project-record-header-actions,
.project-record-filters-wrap,
.project-record-state-row,
.project-record-load-more-row {
  position: relative;
  z-index: 2;
}

.project-record-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.project-record-title {
  flex: 1;
  min-width: 0;
  font-size: 34rpx;
  font-weight: 700;
  color: #2b7a78;
}

.project-record-header-actions {
  flex: 0 0 auto;
}

.project-record-filters-wrap {
  margin-bottom: 14rpx;
}

.project-record-list {
  position: relative;
  z-index: 2;
}

.project-record-state-row {
  padding: 24rpx 0;
  text-align: center;
  font-size: 24rpx;
  color: #6b7280;
}

.project-record-state-row.error {
  color: #b42318;
}

.project-record-load-more-row {
  padding: 18rpx 0 8rpx;
  text-align: center;
  color: #9ca3af;
  font-size: 22rpx;
}
</style>
