<template>
  <view class="tabbar-wrap">
    <view class="tabbar">
      <view class="tab-item" :class="selected === 0 ? 'active' : ''" @tap="handleHomeTap">
        <view class="icon-box" :class="selected === 0 ? 'active-box' : ''">
          <image class="icon" :src="homeIcon" mode="aspectFit" />
        </view>
        <text>首页</text>
      </view>

      <view class="tab-item" :class="selected === 1 ? 'active' : ''" @tap="handleFunctionTap">
        <view class="icon-box" :class="selected === 1 ? 'active-box' : ''">
          <image class="icon" :src="functionIcon" mode="aspectFit" />
        </view>
        <text>功能</text>
      </view>

      <view class="tab-item center-tab" :class="selected === 2 ? 'active' : ''" @tap="handleIconTap">
        <view class="icon-box icon-box-large">
          <image class="icon icon-large" :src="iconTabIcon" mode="aspectFit" />
        </view>
      </view>

      <view class="tab-item" :class="selected === 3 ? 'active' : ''" @tap="handleMessageTap">
        <view class="icon-box" :class="selected === 3 ? 'active-box' : ''">
          <image class="icon" :src="messageIcon" mode="aspectFit" />
        </view>
        <text>消息</text>
      </view>

      <view class="tab-item" :class="selected === 4 ? 'active' : ''" @tap="handleMineTap">
        <view class="icon-box" :class="selected === 4 ? 'active-box' : ''">
          <image class="icon" :src="mineIcon" mode="aspectFit" />
        </view>
        <text>我的</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'

import { openFunctionEntry, openHome, openIconEntry, openMessage, openMine } from '@/utils/navigation'
import { authReady, isLoggedIn } from '@/utils/auth'
import { notificationUnreadCount, refreshNotificationUnreadCount } from '@/utils/notification'
import { getAssetUrl } from '@/utils/urls'

const TABBAR_ICON_PATHS = [
  '/tabbar/house.svg',
  '/tabbar/function.svg',
  '/tabbar/logo_center.png',
  '/tabbar/message.svg',
  '/tabbar/message-dot.svg',
  '/tabbar/mine.svg'
] as const

const homeIcon = getAssetUrl(TABBAR_ICON_PATHS[0])
const functionIcon = getAssetUrl(TABBAR_ICON_PATHS[1])
const iconTabIcon = getAssetUrl(TABBAR_ICON_PATHS[2])
const messageDefaultIcon = getAssetUrl(TABBAR_ICON_PATHS[3])
const messageDotIcon = getAssetUrl(TABBAR_ICON_PATHS[4])
const mineIcon = getAssetUrl(TABBAR_ICON_PATHS[5])

const props = defineProps<{
  selected?: number
}>()

const selected = computed(() => props.selected ?? 0)
const messageIcon = computed(() => (notificationUnreadCount.value > 0 ? messageDotIcon : messageDefaultIcon))

onShow(async () => {
  if (!authReady.value || !isLoggedIn.value) {
    return
  }

  try {
    await refreshNotificationUnreadCount()
  } catch {
    // Keep the current icon state if unread refresh fails.
  }
})

const handleHomeTap = () => {
  if (selected.value === 0) {
    return
  }

  openHome()
}

const handleFunctionTap = () => {
  if (selected.value === 1) {
    return
  }

  openFunctionEntry()
}

const handleIconTap = () => {
  if (selected.value === 2) {
    return
  }

  openIconEntry()
}

const handleMessageTap = () => {
  if (selected.value === 3) {
    return
  }

  openMessage()
}

const handleMineTap = () => {
  if (selected.value === 4) {
    return
  }

  openMine()
}
</script>

<style scoped lang="scss">
.tabbar-wrap {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 80;
  background: transparent;
}

.tabbar {
  height: 128rpx;
  background: rgba(255, 255, 255, 0.94);
  border-top: 1rpx solid #eaeaea;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding-bottom: env(safe-area-inset-bottom);
  position: relative;
  backdrop-filter: blur(20rpx);
}

.tab-item {
  width: 150rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #7a7e83;
  font-size: 22rpx;
}

.icon-box {
  width: 58rpx;
  height: 58rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6rpx;
}

.icon-box-large {
  width: 128rpx;
  height: 128rpx;
}

.icon {
  width: 36rpx;
  height: 36rpx;
}

.icon-large {
  width: 128rpx;
  height: 128rpx;
}

.tab-item.active {
  color: #2d7b7c;
}

.active-box {
  background: rgba(45, 123, 124, 0.12);
}

.center-tab {
  transform: translateY(-24rpx);
}
</style>
