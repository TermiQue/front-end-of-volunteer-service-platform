<template>
  <view class="page">
    <BackgroundGlow />

    <view class="content">
      <view class="empty-card">
        <text class="title">消息</text>
        <text class="desc">暂未开放消息内容，后续在这里接入通知、审核结果和系统消息。</text>
      </view>
    </view>

    <BottomTabbar :selected="3" />
  </view>
</template>

<script setup lang="ts">
import BackgroundGlow from '@/components/BackgroundGlow.vue'
import BottomTabbar from '@/components/BottomTabbar.vue'
import { useAuthGuard } from '@/composables/useAuthGuard'

useAuthGuard({
  routePath: '/pages/message/message',
  fetchUser: false
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

.empty-card {
  width: 100%;
  max-width: 640rpx;
  padding: 64rpx 44rpx;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 18rpx 48rpx rgba(15, 23, 42, 0.08);
  text-align: center;
}

.title {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  color: #2d7b7c;
}

.desc {
  display: block;
  margin-top: 20rpx;
  font-size: 28rpx;
  line-height: 1.8;
  color: #667085;
}
</style>