<template>
  <view class="page">
    <BackgroundGlow />
    <view class="content">
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
          <button class="action-btn btn-purple" @tap="navigateTo('/pages/admin/volunteer-info')">志愿者信息管理</button>
          <button class="action-btn btn-green" @tap="navigateTo('/pages/admin/project-review')">申请审批</button>
        </view>
        <view class="action-row">
          <button class="action-btn btn-amber" @tap="navigateTo('/pages/admin/juvenile')">临界少年信息管理</button>
          <button class="action-btn btn-sky" @tap="navigateTo('/pages/admin/clockin')">打卡管理</button>
        </view>
        <view class="action-row">
          <button class="action-btn btn-indigo" @tap="navigateTo('/pages/admin/project-manage')">项目管理</button>
          <button class="action-btn btn-orange" @tap="navigateTo('/pages/admin/check')">签到签退</button>
        </view>
      </view>
    </view>

    <BottomTabbar :selected="2" />
  </view>
</template>

<script setup lang="ts">
import BackgroundGlow from '@/components/BackgroundGlow.vue'
import BottomTabbar from '@/components/BottomTabbar.vue'
import { useAuthGuard } from '@/composables/useAuthGuard'
import { useUserInfo } from '@/composables/useUserInfo'
import { openFunctionEntry } from '@/utils/navigation'

const userInfo = useUserInfo({ fallbackName: '管理员' })

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
.user-card {
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

.action-btn {
  flex: 1;
  min-width: 0;
  height: 128rpx;
  margin: 0;
  padding: 0 20rpx;
  border: none;
  border-radius: 22rpx;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 600;
  text-align: center;
  line-height: 1.3;
  box-shadow: 0 14rpx 28rpx rgba(31, 41, 55, 0.12);
}

.action-btn::after {
  border: none;
}

.btn-purple {
  background: linear-gradient(135deg, #6366f1 0%, #5f60e7 100%);
}

.btn-green {
  background: linear-gradient(135deg, #79c89d 0%, #53b88c 100%);
}

.btn-amber {
  background: linear-gradient(135deg, #ebb04f 0%, #dca13d 100%);
}

.btn-sky {
  background: linear-gradient(135deg, #8bc3df 0%, #5baed8 100%);
}

.btn-indigo {
  background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
}

.btn-orange {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
}
</style>
