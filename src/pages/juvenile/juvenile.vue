<template>
  <view class="page">
    <BackgroundGlow />

    <view class="content">
      <view class="hero-title">临界青年</view>
      <view class="hero-subtitle">为临界青年提供成长支持、活动参与与团队连接入口。</view>

      <view class="profile-card">
        <image class="avatar" :src="avatarUrl" mode="aspectFill" />

        <view class="info">
          <view class="info-row"><text class="label">昵称：</text><text class="value">{{ nickname }}</text></view>
          <view class="info-row"><text class="label">姓名：</text><text class="value">{{ profileName }}</text></view>
          <view class="info-row"><text class="label">身份：</text><text class="value">临界青年</text></view>
        </view>
      </view>

      <view class="tips-card">
        <text class="tips-title">快捷入口</text>
        <view class="tips-list">
          <view class="tip-item">活动报名</view>
          <view class="tip-item">帮扶记录</view>
          <view class="tip-item">成长档案</view>
        </view>
      </view>
    </view>

    <BottomTabbar :selected="1" />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import BackgroundGlow from '@/components/BackgroundGlow.vue'
import BottomTabbar from '@/components/BottomTabbar.vue'
import { currentRole } from '@/utils/auth'
import { useAuthGuard } from '@/composables/useAuthGuard'
import { useUserInfo } from '@/composables/useUserInfo'
import { openFunctionEntry } from '@/utils/navigation'

const userInfo = useUserInfo({ fallbackName: '临界青年' })
const avatarUrl = computed(() => userInfo.value.avatar)
const nickname = computed(() => userInfo.value.name || '临界青年')
const profileName = computed(() => userInfo.value.name || '未填写')

useAuthGuard({
  routePath: '/pages/juvenile/juvenile',
  roleCheck: (role) => role === 1,
  onForbidden: () => {
    if (currentRole.value !== 1) {
      openFunctionEntry()
    }
  }
})
</script>

<style scoped lang="scss">
.page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(245, 224, 157, 0.46), transparent 34%),
    radial-gradient(circle at bottom right, rgba(92, 119, 255, 0.12), transparent 32%),
    linear-gradient(180deg, #f7f6ef 0%, #f4f1e6 100%);
}

.content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  padding: 44rpx 24rpx 220rpx;
  box-sizing: border-box;
}

.hero-title {
  text-align: center;
  font-size: 78rpx;
  line-height: 1.1;
  font-weight: 700;
  color: #2d7b7c;
  letter-spacing: 12rpx;
}

.hero-subtitle {
  margin-top: 18rpx;
  text-align: center;
  font-size: 28rpx;
  line-height: 1.7;
  color: #667085;
}

.profile-card,
.tips-card {
  margin-top: 36rpx;
  padding: 32rpx;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 16rpx 38rpx rgba(15, 23, 42, 0.08);
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 28rpx;
}

.avatar {
  width: 168rpx;
  height: 168rpx;
  border-radius: 84rpx;
  background: #eef2f7;
  flex-shrink: 0;
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
  font-size: 26rpx;
  font-weight: 600;
}

.tips-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #1f2937;
}

.tips-list {
  margin-top: 18rpx;
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
}

.tip-item {
  padding: 16rpx 20rpx;
  border-radius: 999rpx;
  background: rgba(45, 123, 124, 0.1);
  color: #2d7b7c;
  font-size: 24rpx;
}
</style>