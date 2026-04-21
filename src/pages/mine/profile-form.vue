<template>
  <view class="page">
    <BackgroundGlow />

    <view class="content">
      <view class="card">
        <view class="header">
          <text class="title">完善信息</text>
          <text class="desc">头像上传后会自动保存，昵称和基础资料请统一点击保存。</text>
        </view>

        <view class="avatar-row">
          <image class="avatar" :src="avatarPreview" mode="aspectFill" />
          <view class="avatar-actions">
            <button class="action-btn" @tap="chooseAvatar">上传头像</button>
            <text class="hint">支持即时上传并回填到个人资料</text>
          </view>
        </view>

        <view class="form-item">
          <text class="label">昵称</text>
          <input class="input" v-model="nickname" type="text" placeholder="请输入昵称" placeholder-class="placeholder" />
        </view>

        <view class="form-item">
          <text class="label">姓名</text>
          <input class="input" v-model="name" type="text" placeholder="请输入姓名" placeholder-class="placeholder" />
        </view>

        <view class="form-item">
          <text class="label">学号</text>
          <input class="input" v-model="studentId" type="text" placeholder="请输入学号" placeholder-class="placeholder" />
        </view>

        <view class="form-item">
          <text class="label">手机号</text>
          <input class="input" v-model="phone" type="number" placeholder="请输入手机号" placeholder-class="placeholder" />
        </view>

        <button class="save-btn" @tap="saveProfile">保存</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onBackPress, onShow } from '@dcloudio/uni-app'

import BackgroundGlow from '@/components/BackgroundGlow.vue'
import {
  currentAvatar,
  currentNickname,
  currentProfile,
  ensureLoginForRoute,
  fetchCurrentUser,
  hasProfile,
  isLoggedIn,
  goToMine,
  updateAvatar,
  updateNickname,
  updateProfile,
  consumePendingRedirect
} from '@/utils/auth'
import { getAssetUrl } from '@/utils/urls'

const redirectPath = ref('')
const nickname = ref('')
const name = ref('')
const studentId = ref('')
const phone = ref('')
const avatarPreview = ref('')
const saving = ref(false)
const loaded = ref(false)

const initForm = () => {
  nickname.value = currentNickname.value || ''
  name.value = currentProfile.value?.name || ''
  studentId.value = currentProfile.value?.student_id || ''
  phone.value = currentProfile.value?.phone || ''
  avatarPreview.value = currentAvatar.value || getAssetUrl('/avatar/default.png')
  loaded.value = true
}

const isDirty = computed(() => {
  if (!loaded.value) {
    return false
  }

  return (
    nickname.value !== (currentNickname.value || '') ||
    name.value !== (currentProfile.value?.name || '') ||
    studentId.value !== (currentProfile.value?.student_id || '') ||
    phone.value !== (currentProfile.value?.phone || '')
  )
})

onShow(async () => {
  if (!ensureLoginForRoute('/pages/mine/profile-form')) {
    return
  }

  if (!isLoggedIn.value) {
    return
  }

  if (!currentProfile.value && !hasProfile.value) {
    try {
      await fetchCurrentUser()
    } catch {
      goToMine()
      return
    }
  }

  redirectPath.value = consumePendingRedirect() || ''
  initForm()
})

const chooseAvatar = async () => {
  const chooseResult = await new Promise<UniApp.ChooseImageSuccessCallbackResult>((resolve, reject) => {
    uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: resolve,
      fail: reject
    })
  })

  const filePath = chooseResult.tempFilePaths[0]
  if (!filePath) {
    return
  }

  avatarPreview.value = filePath

  try {
    saving.value = true
    await updateAvatar(filePath)
    uni.showToast({ title: '头像已更新', icon: 'none' })
  } catch (error) {
    uni.showToast({ title: '头像上传失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

const saveProfile = async () => {
  if (saving.value) {
    return
  }

  if (!name.value.trim() || !studentId.value.trim() || !phone.value.trim()) {
    uni.showToast({ title: '请先填写姓名、学号和手机号', icon: 'none' })
    return
  }

  try {
    saving.value = true

    if (nickname.value.trim() && nickname.value.trim() !== currentNickname.value) {
      await updateNickname(nickname.value.trim())
    }

    await updateProfile({
      name: name.value.trim(),
      studentId: studentId.value.trim(),
      phone: phone.value.trim()
    })

    uni.showToast({ title: '保存成功', icon: 'none' })

    const target = redirectPath.value || consumePendingRedirect() || '/pages/mine/mine'
    setTimeout(() => {
      const pages = getCurrentPages()
      if (pages.length > 1) {
        uni.navigateBack({ delta: 1 })
        return
      }

      uni.reLaunch({ url: target })
    }, 300)
  } catch (error) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

onBackPress(() => {
  if (!isDirty.value) {
    return false
  }

  uni.showModal({
    title: '未保存提醒',
    content: '还有未保存的修改，确定离开吗？',
    success: (res) => {
      if (res.confirm) {
        uni.navigateBack({ delta: 1 })
      }
    }
  })

  return true
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
  padding: 40rpx 24rpx 60rpx;
  box-sizing: border-box;
}

.card {
  padding: 36rpx 28rpx 40rpx;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 18rpx 48rpx rgba(15, 23, 42, 0.08);
}

.header {
  margin-bottom: 30rpx;
}

.title {
  display: block;
  font-size: 46rpx;
  font-weight: 700;
  color: #2d7b7c;
}

.desc {
  display: block;
  margin-top: 16rpx;
  font-size: 26rpx;
  line-height: 1.7;
  color: #667085;
}

.avatar-row {
  display: flex;
  gap: 24rpx;
  align-items: center;
  margin-bottom: 28rpx;
}

.avatar {
  width: 152rpx;
  height: 152rpx;
  border-radius: 76rpx;
  background: #eef2f7;
  flex-shrink: 0;
}

.avatar-actions {
  flex: 1;
}

.action-btn,
.save-btn {
  margin: 0;
  border: none;
  border-radius: 18rpx;
  background: linear-gradient(135deg, #2d7b7c 0%, #3ea88f 100%);
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 600;
}

.action-btn::after,
.save-btn::after {
  border: none;
}

.action-btn {
  padding: 0 28rpx;
  height: 88rpx;
}

.hint {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #667085;
}

.form-item {
  margin-bottom: 22rpx;
}

.label {
  display: block;
  margin-bottom: 12rpx;
  font-size: 26rpx;
  color: #1f2937;
  font-weight: 600;
}

.input {
  width: 100%;
  height: 92rpx;
  padding: 0 24rpx;
  box-sizing: border-box;
  border-radius: 18rpx;
  background: #f8fafc;
  color: #111827;
  font-size: 28rpx;
}

.placeholder {
  color: #9ca3af;
}

.save-btn {
  margin-top: 20rpx;
  height: 92rpx;
}
</style>