<template>
  <view class="page">
    <BackgroundGlow />

    <view class="content">
      <view class="card">
        <view class="profile-head">
          <image class="avatar" :src="avatarUrl" mode="aspectFill" />
          <view class="profile-meta">
            <text class="name">{{ displayName }}</text>
            <text class="role">{{ roleLabel }}</text>
          </view>
        </view>

        <view v-if="isLoggedIn" class="detail-list">
          <view class="detail-item"><text class="label">姓名</text><text class="value">{{ profileName }}</text></view>
          <view class="detail-item"><text class="label">学号</text><text class="value">{{ studentId }}</text></view>
          <view class="detail-item"><text class="label">手机号</text><text class="value">{{ phone }}</text></view>
          <view class="detail-item"><text class="label">身份</text><text class="value">{{ roleLabel }}</text></view>
        </view>

        <view v-else class="login-tip">
          <text class="tip-title">尚未登录</text>
          <text class="tip-desc">请先登录后再访问功能、图标和消息入口。</text>
        </view>

        <view class="action-row">
          <button v-if="!isLoggedIn" class="primary-btn" @tap="handleLogin">登录</button>
          <button v-else class="primary-btn" @tap="handleEditProfile">修改信息</button>
        </view>

        <view v-if="!isLoggedIn && isDebugMode" class="debug-row">
          <button class="debug-btn" @tap="handleDebugLogin">一键登录(调试)</button>
        </view>

        <view v-if="isLoggedIn" class="secondary-row">
          <button class="secondary-btn" @tap="handleLogout">退出登录</button>
        </view>
      </view>
    </view>

    <BottomTabbar :selected="4" />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'

import BackgroundGlow from '@/components/BackgroundGlow.vue'
import BottomTabbar from '@/components/BottomTabbar.vue'
import {
  clearAuthState,
  currentAvatar,
  currentNickname,
  currentProfile,
  currentRole,
  ensureLoginForRoute,
  fetchCurrentUser,
  goToProfileForm,
  hasProfile,
  isLoggedIn,
  loginWithDebugCode,
  loginWithWechat,
  logout
} from '@/utils/auth'

const avatarUrl = computed(() => currentAvatar.value || '/default_avatar.svg')
const displayName = computed(() => currentNickname.value || currentProfile.value?.name || '我的')
const profileName = computed(() => currentProfile.value?.name || '未完善')
const studentId = computed(() => currentProfile.value?.student_id || '未完善')
const phone = computed(() => currentProfile.value?.phone || '未完善')
const rawDebugFlag = (import.meta.env as Record<string, unknown>).IS_DEBUG ?? import.meta.env.VITE_IS_DEBUG
const isDebugMode = String(rawDebugFlag || '').toLowerCase() === 'true'

const roleLabel = computed(() => {
  if (currentRole.value === 3) {
    return '超级管理员'
  }

  if (currentRole.value === 2) {
    return '管理员'
  }

  if (currentRole.value === 1) {
    return '临界青年'
  }

  return '志愿者'
})

const handleLogin = async () => {
  try {
    await loginWithWechat()

    if (!hasProfile.value) {
      goToProfileForm('/pages/mine/mine')
      return
    }

    uni.showToast({ title: '登录成功', icon: 'none' })
  } catch (error) {
    uni.showToast({ title: '登录失败', icon: 'none' })
  }
}

const handleEditProfile = () => {
  goToProfileForm('/pages/mine/mine')
}

const handleDebugLogin = async () => {
  try {
    await loginWithDebugCode('test-code-001')

    if (!hasProfile.value) {
      goToProfileForm('/pages/mine/mine')
      return
    }

    uni.showToast({ title: '调试登录成功', icon: 'none' })
  } catch {
    uni.showToast({ title: '调试登录失败', icon: 'none' })
  }
}

const handleLogout = async () => {
  try {
    await logout()
    clearAuthState()
    uni.showToast({ title: '已退出登录', icon: 'none' })
  } catch {
    clearAuthState()
  }
}

onShow(async () => {
  if (!isLoggedIn.value) {
    return
  }

  try {
    await fetchCurrentUser()
  } catch {
    ensureLoginForRoute('/pages/mine/mine')
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
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx 32rpx 220rpx;
  box-sizing: border-box;
}

.card {
  width: 100%;
  max-width: 680rpx;
  padding: 40rpx 34rpx 36rpx;
  border-radius: 34rpx;
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 18rpx 48rpx rgba(15, 23, 42, 0.08);
}

.profile-head {
  display: flex;
  gap: 24rpx;
  align-items: center;
}

.avatar {
  width: 150rpx;
  height: 150rpx;
  border-radius: 75rpx;
  background: #eef2f7;
  flex-shrink: 0;
}

.profile-meta {
  flex: 1;
}

.name {
  display: block;
  font-size: 46rpx;
  font-weight: 700;
  color: #2d7b7c;
}

.role {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  color: #667085;
}

.detail-list {
  margin-top: 30rpx;
}

.detail-item {
  display: flex;
  padding: 16rpx 0;
  border-bottom: 1rpx dashed #e5e7eb;
}

.detail-item:last-child {
  border-bottom: none;
}

.label {
  width: 100rpx;
  font-size: 26rpx;
  color: #4b5563;
}

.value {
  flex: 1;
  font-size: 26rpx;
  color: #111827;
  text-align: right;
}

.login-tip {
  margin-top: 30rpx;
  padding: 28rpx;
  border-radius: 24rpx;
  background: rgba(45, 123, 124, 0.08);
}

.tip-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #2d7b7c;
}

.tip-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  line-height: 1.7;
  color: #667085;
}

.action-row,
.secondary-row {
  margin-top: 28rpx;
}

.debug-row {
  margin-top: 16rpx;
}

.primary-btn,
.secondary-btn {
  height: 92rpx;
  line-height: 92rpx;
  border: none;
  border-radius: 18rpx;
  font-size: 30rpx;
  font-weight: 600;
}

.primary-btn {
  background: linear-gradient(135deg, #2d7b7c 0%, #3ea88f 100%);
  color: #ffffff;
}

.secondary-btn {
  background: rgba(17, 24, 39, 0.06);
  color: #1f2937;
}

.debug-btn {
  height: 86rpx;
  line-height: 86rpx;
  border: 1rpx solid #2d7b7c;
  border-radius: 18rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: #2d7b7c;
  background: rgba(45, 123, 124, 0.08);
}

.primary-btn::after,
.secondary-btn::after,
.debug-btn::after {
  border: none;
}
</style>