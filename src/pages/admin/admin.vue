<template>
  <view class="page">
    <BackgroundGlow />
    <view class="content">
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
import { currentRole } from '@/utils/auth'
import { openFunctionEntry } from '@/utils/navigation'
import { getAssetUrl } from '@/utils/urls'

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

const ADMIN_ICON_PATHS = {
  volunteerInfo: '/icons/admin-volunteer-info.svg',
  projectReview: '/icons/admin-project-review.svg',
  juvenileInfo: '/icons/admin-juvenile-info.svg',
  clockin: '/icons/admin-clockin.svg',
  projectManage: '/icons/admin-project-manage.svg'
} as const

const volunteerInfoIcon = getAssetUrl(ADMIN_ICON_PATHS.volunteerInfo)
const projectReviewIcon = getAssetUrl(ADMIN_ICON_PATHS.projectReview)
const juvenileInfoIcon = getAssetUrl(ADMIN_ICON_PATHS.juvenileInfo)
const clockinIcon = getAssetUrl(ADMIN_ICON_PATHS.clockin)
const projectManageIcon = getAssetUrl(ADMIN_ICON_PATHS.projectManage)

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
</style>
