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

        <view class="hero-caption">v0.0.6.6</view>
      </view>

      <view class="title-wrap">
        <text class="title">归途·桥链</text>
        <text class="subtitle">“归途·桥链” 青年志愿先锋队</text>
      </view>

      <view class="section-block">
        <view class="section-title">图集</view>
        <view class="gallery-list">
          <view class="gallery-card" v-for="item in galleryList" :key="item.url" @tap="openGalleryPreview(item)">
            <image class="gallery-image" :src="item.url" mode="widthFix" lazy-load />
            <view v-if="item.title" class="gallery-meta">{{ item.title }}</view>
          </view>
        </view>
      </view>
    </view>

    <view
      v-if="previewItem"
      class="preview-mask"
      :class="{ 'preview-mask-open': previewOpen }"
      @tap="closeGalleryPreview"
      @touchstart="handlePreviewTouchStart"
      @touchmove="handlePreviewTouchMove"
      @touchend="handlePreviewTouchEnd"
      @touchcancel="closeGalleryPreview"
    >
      <view class="preview-stack">
        <view
          class="preview-frame"
          :class="{ 'preview-image-open': previewOpen }"
          :style="previewImageStyle"
        >
          <image
            class="preview-image"
            :src="previewItem.url"
            mode="aspectFill"
            @load="handlePreviewImageLoad($event, previewToken)"
            @error="handlePreviewImageError(previewToken)"
          />
        </view>

        <view v-if="previewTypedContent" class="preview-copy">
          <text
            v-for="(char, index) in previewTypedContentChars"
            :key="`${previewToken}-${index}`"
            class="preview-copy-char"
          >
            {{ char }}
          </text>
        </view>
      </view>
    </view>

    <BottomTabbar :selected="0" />
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'

import BottomTabbar from '@/components/BottomTabbar.vue'
import BackgroundGlow from '@/components/BackgroundGlow.vue'
import { getApiUrl, getAssetUrl } from '@/utils/urls'

type BannerItem = {
  url: string
}

type GalleryItem = {
  url: string
  title: string
  content: string
}

type GalleryDetailSource = {
  title?: unknown
  path?: unknown
  content?: unknown
}

const BANNER_PATHS = ['/banners/1.png', '/banners/2.png', '/banners/3.png']

const banners: BannerItem[] = BANNER_PATHS.map((path) => ({ url: getAssetUrl(path) }))
const GALLERY_DETAILS_PATH = 'gallery/details.json'

const galleryList = ref<GalleryItem[]>([])

const previewItem = ref<GalleryItem | null>(null)
const previewOpen = ref(false)
const previewRotate = ref(0)
const previewToken = ref(0)
const previewClosing = ref(false)
const previewTouchMoved = ref(false)
const previewTypedContent = ref('')
let previewTypeTimer: ReturnType<typeof setInterval> | null = null
const previewSize = ref({
  width: uni.upx2px(840),
  height: uni.upx2px(560)
})

const previewTypedContentChars = computed(() => previewTypedContent.value.split(''))

const previewImageStyle = computed(() => ({
  '--preview-rotate': `${previewRotate.value}deg`,
  width: `${previewSize.value.width}px`,
  height: `${previewSize.value.height}px`
}))

const normalizeGalleryImagePath = (path: string) => {
  const trimmedPath = path.trim()
  if (!trimmedPath) {
    return ''
  }

  if (trimmedPath.startsWith('/gallery/') || trimmedPath.startsWith('gallery/')) {
    return trimmedPath
  }

  return `/gallery/${trimmedPath.replace(/^\/+/, '')}`
}

const parseGalleryDetails = (data: unknown): GalleryItem[] => {
  const source = typeof data === 'string' ? JSON.parse(data) : data
  if (!Array.isArray(source)) {
    return []
  }

  return source
    .map((item: GalleryDetailSource) => {
      const path = typeof item?.path === 'string' ? normalizeGalleryImagePath(item.path) : ''
      if (!path) {
        return null
      }

      return {
        title: typeof item.title === 'string' ? item.title : '',
        content: typeof item.content === 'string' ? item.content : '',
        url: getAssetUrl(path)
      }
    })
    .filter((item): item is GalleryItem => Boolean(item))
}

const loadGalleryDetails = () => {
  uni.request({
    url: getApiUrl(`/content/public-file?path=${encodeURIComponent(GALLERY_DETAILS_PATH)}`),
    method: 'GET',
    success: (res) => {
      try {
        galleryList.value = parseGalleryDetails(res.data)
      } catch {
        galleryList.value = []
      }
    },
    fail: () => {
      galleryList.value = []
    }
  })
}

const stopPreviewTyping = () => {
  if (previewTypeTimer) {
    clearInterval(previewTypeTimer)
    previewTypeTimer = null
  }
}

const startPreviewTyping = () => {
  stopPreviewTyping()
  previewTypedContent.value = ''

  const content = previewItem.value?.content || ''
  if (!content) {
    return
  }

  let index = 0
  previewTypeTimer = setInterval(() => {
    index += 1
    previewTypedContent.value = content.slice(0, index)
    if (index >= content.length) {
      stopPreviewTyping()
    }
  }, 42)
}

const openGalleryPreview = (item: GalleryItem) => {
  previewToken.value += 1
  previewOpen.value = false
  previewClosing.value = false
  previewTouchMoved.value = false
  previewItem.value = item
  previewRotate.value = Math.round(Math.random() * 30 - 15)
  previewSize.value = {
    width: uni.upx2px(840),
    height: uni.upx2px(560)
  }
  stopPreviewTyping()
  previewTypedContent.value = ''
}

const showLoadedPreview = async (token: number) => {
  await nextTick()
  if (token === previewToken.value && previewItem.value) {
    previewOpen.value = true
    startPreviewTyping()
  }
}

const handlePreviewImageLoad = (event: Event, token: number) => {
  if (token !== previewToken.value) {
    return
  }

  const detail = (event as Event & { detail?: { width?: number; height?: number } }).detail
  const imageWidth = detail?.width || 0
  const imageHeight = detail?.height || 0
  if (!imageWidth || !imageHeight) {
    showLoadedPreview(token)
    return
  }

  const ratio = imageWidth / imageHeight
  const systemInfo = uni.getSystemInfoSync()
  const maxWidth = Math.min(systemInfo.windowWidth - uni.upx2px(32), uni.upx2px(900))
  const maxHeight = systemInfo.windowHeight * 0.74
  let width = maxWidth
  let height = width / ratio

  if (height > maxHeight) {
    height = maxHeight
    width = height * ratio
  }

  previewSize.value = {
    width,
    height
  }

  showLoadedPreview(token)
}

const handlePreviewImageError = (token: number) => {
  showLoadedPreview(token)
}

const handlePreviewTouchStart = () => {
  previewTouchMoved.value = false
}

const handlePreviewTouchMove = () => {
  previewTouchMoved.value = true
  closeGalleryPreview()
}

const handlePreviewTouchEnd = () => {
  if (previewTouchMoved.value) {
    return
  }

  closeGalleryPreview()
}

const closeGalleryPreview = () => {
  if (previewClosing.value || !previewItem.value) {
    return
  }

  stopPreviewTyping()
  previewClosing.value = true
  previewToken.value += 1
  previewOpen.value = false
  setTimeout(() => {
    previewItem.value = null
    previewTypedContent.value = ''
    previewClosing.value = false
    previewTouchMoved.value = false
  }, 260)
}

onMounted(() => {
  loadGalleryDetails()
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

.preview-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 64rpx 36rpx;
  background: rgba(0, 0, 0, 0);
  opacity: 0;
  transition:
    background 260ms ease,
    opacity 260ms ease;
  box-sizing: border-box;
}

.preview-mask-open {
  background: rgba(0, 0, 0, 0.72);
  opacity: 1;
}

.preview-stack {
  position: relative;
  z-index: 2;
  display: flex;
  width: 100%;
  max-height: calc(100vh - 128rpx);
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.preview-frame {
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 36rpx;
  box-shadow: 0 28rpx 72rpx rgba(0, 0, 0, 0.36);
  opacity: 0;
  transform: scale(0.72) rotate(0deg);
  transition:
    opacity 260ms ease,
    transform 320ms cubic-bezier(0.2, 0.86, 0.24, 1);
}

.preview-image {
  width: 100%;
  height: 100%;
  display: block;
  border-radius: 36rpx;
}

.preview-image-open {
  opacity: 1;
  transform: scale(1) rotate(var(--preview-rotate, 0deg));
}

.preview-copy {
  position: relative;
  z-index: 1;
  width: 100%;
  max-height: 24vh;
  margin-top: 56rpx;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.9);
  font-size: 32rpx;
  line-height: 1.65;
  font-weight: 400;
  letter-spacing: 4rpx;
  text-align: center;
  text-shadow: 0 4rpx 14rpx rgba(0, 0, 0, 0.42);
}

.preview-copy-char {
  display: inline-block;
  animation: preview-char-pop 180ms cubic-bezier(0.2, 0.86, 0.24, 1) both;
}

@keyframes preview-char-pop {
  from {
    opacity: 0;
    transform: translateY(12rpx) scale(0.82);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

</style>
