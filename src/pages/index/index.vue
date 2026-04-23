<template>
  <view class="page">
    <BackgroundGlow />

    <view class="content">
      <view class="hero-shell">
        <view class="hero-card">
          <swiper
            class="hero-swiper"
            :indicator-dots="true"
            indicator-color="rgba(255, 255, 255, 0.42)"
            indicator-active-color="#ffffff"
            :autoplay="true"
            :interval="3200"
            :duration="520"
            :circular="true"
          >
            <swiper-item v-for="item in banners" :key="item.url">
              <image class="hero-image" :src="item.url" mode="aspectFill" />
            </swiper-item>
          </swiper>

          <view class="hero-fade hero-fade-top"></view>
          <view class="hero-fade hero-fade-bottom"></view>
          <view class="hero-fade hero-fade-left"></view>
          <view class="hero-fade hero-fade-right"></view>
        </view>

        <view class="hero-caption">v0.0.6.1</view>
      </view>

      <view class="title-wrap">
        <text class="title">归途·桥链</text>
        <text class="subtitle">“归途·桥链” 青年志愿先锋队</text>
      </view>

      <view class="section-block">
        <view class="section-title">图集</view>
        <view class="gallery-list">
          <view class="gallery-card" v-for="item in galleryList" :key="item.url">
            <image class="gallery-image" :src="item.url" mode="widthFix" lazy-load />
            <view v-if="item.title" class="gallery-meta">{{ item.title }}</view>
          </view>
        </view>
      </view>
    </view>

    <BottomTabbar :selected="0" />
  </view>
</template>

<script setup lang="ts">
import BottomTabbar from '@/components/BottomTabbar.vue'
import BackgroundGlow from '@/components/BackgroundGlow.vue'
import { getAssetUrl } from '@/utils/urls'

type BannerItem = {
  url: string
}

type GalleryItem = {
  url: string
  title: string
}

const BANNER_PATHS = ['/banners/1.png', '/banners/2.png', '/banners/3.png']
const GALLERY_SOURCE = [
  { path: '/gallery/1.jpg', title: '活动现场 1' },
  { path: '/gallery/2.jpg', title: '活动现场 2' },
  { path: '/gallery/3.jpg', title: '活动现场 3' },
  { path: '/gallery/4.jpg', title: '活动现场 4' },
  { path: '/gallery/5.jpg', title: '活动现场 5' }
]

const banners: BannerItem[] = BANNER_PATHS.map((path) => ({ url: getAssetUrl(path) }))

const galleryList: GalleryItem[] =
  GALLERY_SOURCE.map((item) => ({
    title: item.title,
    url: getAssetUrl(item.path)
  }))
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
  padding-bottom: calc(200rpx + env(safe-area-inset-bottom));
}

.hero-shell {
  padding: 0 0 20rpx;
}

.hero-card {
  position: relative;
  width: 100%;
  height: 360rpx;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 16rpx 40rpx rgba(55, 65, 81, 0.08);
}

.hero-swiper,
.hero-image {
  width: 100%;
  height: 100%;
}

.hero-image {
  display: block;
}

.hero-fade {
  position: absolute;
  pointer-events: none;
  z-index: 2;
}

.hero-fade-top,
.hero-fade-bottom {
  left: 0;
  width: 100%;
  height: 54rpx;
}

.hero-fade-top {
  top: 0;
  background: linear-gradient(to bottom, rgba(244, 241, 230, 0.94), rgba(244, 241, 230, 0));
}

.hero-fade-bottom {
  bottom: 0;
  background: linear-gradient(to top, rgba(244, 241, 230, 0.94), rgba(244, 241, 230, 0));
}

.hero-fade-left,
.hero-fade-right {
  top: 0;
  width: 32rpx;
  height: 100%;
}

.hero-fade-left {
  left: 0;
  background: linear-gradient(to right, rgba(244, 241, 230, 0.9), rgba(244, 241, 230, 0));
}

.hero-fade-right {
  right: 0;
  background: linear-gradient(to left, rgba(244, 241, 230, 0.9), rgba(244, 241, 230, 0));
}

.hero-caption {
  margin-top: 12rpx;
  text-align: center;
  font-size: 24rpx;
  color: rgba(79, 93, 114, 0.75);
  letter-spacing: 1rpx;
}

.title-wrap {
  padding: 40rpx 32rpx 0;
  text-align: center;
}

.title {
  display: block;
  font-size: 86rpx;
  line-height: 1.08;
  font-weight: 700;
  color: #2d7b7c;
  letter-spacing: 20rpx;
  text-shadow: 0 8rpx 18rpx rgba(45, 123, 124, 0.08);
}

.subtitle {
  display: block;
  margin-top: 22rpx;
  font-size: 34rpx;
  color: #667085;
  letter-spacing: 2rpx;
}

.section-block {
  padding: 52rpx 0 0;
}

.section-title {
  padding: 0 32rpx 18rpx;
  font-size: 36rpx;
  line-height: 1.2;
  font-weight: 700;
  color: #334155;
}

.gallery-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  padding: 0 32rpx;
}

.gallery-card {
  position: relative;
  overflow: hidden;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.34);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  box-shadow:
    0 14rpx 32rpx rgba(15, 23, 42, 0.1),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(16rpx) saturate(135%);
  -webkit-backdrop-filter: blur(16rpx) saturate(135%);
}

.gallery-card::before {
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

.gallery-image {
  width: 100%;
  display: block;
}

.gallery-meta {
  position: relative;
  z-index: 2;
  padding: 16rpx 20rpx 20rpx;
  font-size: 26rpx;
  color: rgba(51, 65, 85, 0.92);
  text-shadow: 0 1rpx 2rpx rgba(255, 255, 255, 0.5);
}

</style>
