<template>
  <view class="page">
    <BackgroundGlow />
    <view class="content">
      <view class="panel">
        <view class="panel-title">志愿者详情</view>

        <view v-if="loading" class="state-row">加载中...</view>
        <view v-else-if="errorMessage" class="state-row error">{{ errorMessage }}</view>
        <view v-else-if="detailData">
          <view class="detail-head">
            <text>{{ detailData.volunteer.name }}（{{ detailData.volunteer.studentId || '-' }}）</text>
            <text>{{ detailData.volunteer.volunteerHours.toFixed(2) }}h / {{ detailData.volunteer.projectCount }} 项</text>
          </view>

          <view v-if="!projectCards.length" class="state-row">暂无项目记录</view>
          <view v-else class="card-list">
            <InfoLineCard v-for="card in projectCards" :key="card.id" :card="card.data" />
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'

import BackgroundGlow from '@/components/BackgroundGlow.vue'
import InfoLineCard from '@/components/InfoLineCard.vue'
import { useAuthGuard } from '@/composables/useAuthGuard'
import { openFunctionEntry } from '@/utils/navigation'
import {
  fetchAdminVolunteerDetail,
  formatProjectDate,
  projectStatusTextMap,
  recordValidityTextMap,
  type AdminVolunteerDetail
} from '@/utils/project'

const loading = ref(false)
const errorMessage = ref('')
const detailData = ref<AdminVolunteerDetail | null>(null)
const targetUserId = ref<number | null>(null)

const projectCards = computed(() => {
  if (!detailData.value) {
    return []
  }

  return detailData.value.projects.map((project) => ({
    id: project.projectId,
    data: {
      title: {
        text: project.projectName || '-'
      },
      tag: {
        text: recordValidityTextMap[project.isValid],
        when: project.isValid === 1 ? 'valid' : 'invalid',
        matchers: [
          { when: 'valid', type: 2 as const },
          { when: 'invalid', type: 3 as const }
        ]
      },
      rows: [
        [{ text: `描述：${project.projectDescription || '-'}` }],
        [{ text: `时长：${project.durationHours.toFixed(2)}h` }, { text: `项目状态：${projectStatusTextMap[project.projectStatus]}` }],
        [{ text: `结算时长：${project.settlementHours === null ? '-' : `${project.settlementHours.toFixed(1)}h`}` }, { text: `备注：${project.note || '-'}` }],
        [{ text: `签到：${formatProjectDate(project.checkInAt || '')}` }, { text: `签退：${formatProjectDate(project.checkOutAt || '')}` }]
      ]
    }
  }))
})

const loadDetail = async () => {
  if (targetUserId.value === null) {
    errorMessage.value = '缺少用户参数'
    detailData.value = null
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    detailData.value = await fetchAdminVolunteerDetail(targetUserId.value)
  } catch {
    detailData.value = null
    errorMessage.value = '详情加载失败，请下拉重试'
  } finally {
    loading.value = false
  }
}

useAuthGuard({
  routePath: '/pages/admin/volunteer-detail',
  roleCheck: (role) => role === 2 || role === 3,
  onForbidden: () => {
    openFunctionEntry()
  },
  onAuthorized: async () => {
    await loadDetail()
  }
})

onLoad((query) => {
  const safeQuery = query ?? {}
  const rawUserId = Array.isArray(safeQuery.userId) ? safeQuery.userId[0] : safeQuery.userId
  const parsed = Number(rawUserId)
  targetUserId.value = Number.isFinite(parsed) ? parsed : null
})

onPullDownRefresh(async () => {
  await loadDetail()
  uni.stopPullDownRefresh()
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
  padding: 40rpx 30rpx;
  box-sizing: border-box;
}

.panel {
  background: rgba(255, 255, 255, 0.9);
  border: 1rpx solid rgba(255, 255, 255, 0.75);
  border-radius: 22rpx;
  box-shadow: 0 14rpx 34rpx rgba(15, 23, 42, 0.08);
  padding: 20rpx;
  box-sizing: border-box;
}

.panel-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #111827;
  margin-bottom: 14rpx;
}

.state-row {
  text-align: center;
  padding: 24rpx;
  font-size: 24rpx;
  color: #6b7280;
}

.state-row.error {
  color: #b42318;
}

.detail-head {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: 14rpx;
  color: #1f2937;
  font-size: 24rpx;
}

.card-list {
  width: 100%;
  background: rgba(255, 255, 255, 0.82);
  border-radius: 16rpx;
  padding: 8rpx 12rpx 4rpx;
  box-sizing: border-box;
}
</style>
