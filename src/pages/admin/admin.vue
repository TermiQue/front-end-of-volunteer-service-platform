<template>
  <view class="page">
    <BackgroundGlow />
    <view class="content">
      <view class="title">归途·桥梁</view>
      <view class="sub">“归途·桥梁”青年志愿先锋队</view>

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
          <view class="action-card" @tap="navigateTo('/pages/admin/volunteer-info')">
            <image class="action-icon" :src="volunteerInfoIcon" mode="aspectFit" />
            <text class="action-text">志愿者信息管理</text>
          </view>
          <view class="action-card" @tap="navigateTo('/pages/admin/project-review')">
            <image class="action-icon" :src="projectReviewIcon" mode="aspectFit" />
            <text class="action-text">申请审批</text>
          </view>
        </view>
        <view class="action-row">
          <view class="action-card" @tap="navigateTo('/pages/admin/juvenile')">
            <image class="action-icon" :src="juvenileInfoIcon" mode="aspectFit" />
            <text class="action-text">临界少年信息管理</text>
          </view>
          <view class="action-card" @tap="navigateTo('/pages/admin/clockin')">
            <image class="action-icon" :src="clockinIcon" mode="aspectFit" />
            <text class="action-text">打卡管理</text>
          </view>
        </view>
        <view class="action-row">
          <view class="action-card" @tap="navigateTo('/pages/admin/project-manage')">
            <image class="action-icon" :src="projectManageIcon" mode="aspectFit" />
            <text class="action-text">项目管理</text>
          </view>
          <view class="action-card" @tap="navigateTo('/pages/admin/check')">
            <image class="action-icon" :src="checkInOutIcon" mode="aspectFit" />
            <text class="action-text">签到签退</text>
          </view>
        </view>
      </view>
    </view>

    <BottomTabbar :selected="2" />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import BackgroundGlow from '@/components/BackgroundGlow.vue'
import BottomTabbar from '@/components/BottomTabbar.vue'
import { useAuthGuard } from '@/composables/useAuthGuard'
import { useUserInfo } from '@/composables/useUserInfo'
import { openFunctionEntry } from '@/utils/navigation'
import { currentRole } from '@/utils/auth'

const userInfo = useUserInfo({ fallbackName: '管理员' })
const roleTextMap: Record<number, string> = {
  0: '志愿者',
  1: '临界青年',
  2: '管理员',
  3: '超级管理员'
}
const identityText = computed(() => {
  const role = currentRole.value
  if (role === null || role === undefined) {
    return '管理员'
  }
  return roleTextMap[role] || '管理员'
})
const volunteerInfoIcon = 'https://img.icons8.com/fluency/96/administrator-male.png'
const projectReviewIcon = 'https://img.icons8.com/fluency/96/approval.png'
const juvenileInfoIcon = 'https://img.icons8.com/fluency/96/teenager-male.png'
const clockinIcon = 'https://img.icons8.com/fluency/96/touch-id.png'
const projectManageIcon = 'https://img.icons8.com/fluency/96/project-management.png'
const checkInOutIcon = 'https://img.icons8.com/fluency/96/qr-code.png'

const navigateTo = (url: string) => {
  uni.navigateTo({
    url,
    fail: () => {
      uni.showToast({
        title: '页面跳转失败',
        icon: 'none'
      })
    }
  })
}

useAuthGuard({
  routePath: '/pages/admin/admin',
  roleCheck: (role) => role === 2 || role === 3,
  onForbidden: () => {
    openFunctionEntry()
  }
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
  padding-bottom: 220rpx;
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
  min-width: 0;
  padding-top: 28rpx;
  padding-bottom: 28rpx;
  padding-left: 20rpx;
  padding-right: 20rpx;
  background: rgba(255, 255, 255, 0.88);
  border: 1rpx solid rgba(255, 255, 255, 0.75);
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 24rpx rgba(15, 23, 42, 0.08);
  box-sizing: border-box;
}

.action-icon {
  width: 52rpx;
  height: 52rpx;
  margin-bottom: 12rpx;
}

.action-text {
  font-size: 30rpx;
  color: #2b7a78;
  font-weight: 700;
  letter-spacing: 1rpx;
  text-align: center;
  line-height: 1.35;
}
</style>
