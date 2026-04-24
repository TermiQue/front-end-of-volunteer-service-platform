<template>
  <view class="bg-shell" aria-hidden="true">
    <view class="bg-base"></view>
    <view class="bg-glow">
      <view class="glow glow-red glow-red-1"></view>
      <view class="glow glow-red glow-red-2"></view>
      <view class="glow glow-yellow glow-yellow-1"></view>
      <view class="glow glow-yellow glow-yellow-2"></view>
    </view>
  </view>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
.bg-shell {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 0;
}

.bg-base {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #f8fafc 0%, #f3f4f6 100%);
}

.bg-glow {
  position: absolute;
  inset: 0;
}

.glow {
  position: absolute;
  border-radius: 9999rpx;
  filter: blur(100rpx);
  opacity: 0.95;
}

.glow-yellow {
  background: rgba(241, 205, 96, 0.26);
}

.glow-red {
  background: rgba(233, 117, 108, 0.18);
}

.bg-glow .glow-red-1 {
  left: 85%;
  top: 80%;
  width: 720rpx;
  height: 640rpx;
  transform: translate(-50%, -50%);
  background: rgba(239, 68, 68, 0.22);
}

.bg-glow .glow-red-2 {
  left: 70%;
  top: 85%;
  width: 640rpx;
  height: 420rpx;
  transform: translate(-50%, -50%);
  background: rgba(239, 68, 68, 0.26);
}

.bg-glow .glow-yellow-1 {
  left: 12%;
  top: 18%;
  width: 720rpx;
  height: 640rpx;
  transform: translate(-50%, -50%);
  background: rgba(253, 224, 71, 0.22);
}

.bg-glow .glow-yellow-2 {
  left: 20%;
  top: 24%;
  width: 640rpx;
  height: 420rpx;
  transform: translate(-50%, -50%);
  background: rgba(253, 224, 71, 0.26);
}
</style>
