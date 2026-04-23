<template>
  <view class="page">
    <BackgroundGlow />
    <view class="content">
      <view class="search-bar">
        <text class="search-label">搜索方式</text>
        <view class="search-segment">
          <view
            class="search-segment-item"
            :class="searchMode === 'name' ? 'active' : ''"
            @tap="setSearchMode('name')"
          >
            姓名
          </view>
          <view
            class="search-segment-item"
            :class="searchMode === 'studentId' ? 'active' : ''"
            @tap="setSearchMode('studentId')"
          >
            学号
          </view>
        </view>
      </view>

      <view class="search-bar">
        <text class="search-label">关键词</text>
        <input
          class="search-input"
          v-model="searchKeyword"
          type="text"
          :placeholder="searchMode === 'name' ? '请输入姓名' : '请输入学号'"
          placeholder-class="search-placeholder"
        />
      </view>

      <view class="range-bar">
        <view class="range-group">
          <text class="range-label">时长范围</text>
          <view class="range-input-wrap">
            <PopupDurationPicker v-model="durationMin" title="选择最小时长" placeholder="最小" :max-hours="24" />
            <text class="range-sep">-</text>
            <PopupDurationPicker v-model="durationMax" title="选择最大时长" placeholder="最大" :max-hours="24" />
          </view>
        </view>

        <view class="range-group">
          <text class="range-label">项目范围</text>
          <view class="range-input-wrap">
            <input
              class="range-input"
              v-model="projectMin"
              type="number"
              placeholder="最小"
              placeholder-class="search-placeholder"
            />
            <text class="range-sep">-</text>
            <input
              class="range-input"
              v-model="projectMax"
              type="number"
              placeholder="最大"
              placeholder-class="search-placeholder"
            />
          </view>
        </view>
      </view>

      <view class="action-row">
        <button class="action-btn action-btn-secondary" @tap="resetFilters">重置</button>
        <button class="action-btn action-btn-primary" @tap="loadVolunteers(true)">查询</button>
      </view>

      <view class="table-wrapper">
        <view v-if="loading && !volunteerRows.length" class="state-row">正在加载志愿者列表...</view>
        <view v-else-if="errorMessage" class="state-row error">{{ errorMessage }}</view>
        <view v-else-if="!volunteerRows.length" class="state-row">暂无符合条件的数据</view>

        <view v-else class="card-list">
          <InfoLineCard v-for="item in volunteerRows" :key="item.userId" :card="buildVolunteerInfoCard(item)" />
        </view>

        <view v-if="volunteerRows.length" class="load-more-row">
          <text v-if="loadingMore">加载中...</text>
          <text v-else-if="!hasMore">没有更多了</text>
          <text v-else>上拉加载更多</text>
        </view>
      </view>
    </view>

  </view>
</template>

<script setup lang="ts">
import BackgroundGlow from '@/components/BackgroundGlow.vue'
import InfoLineCard from '@/components/InfoLineCard.vue'
import PopupDurationPicker from '@/components/PopupDurationPicker.vue'
import { computed, ref } from 'vue'
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'

import { useAuthGuard } from '@/composables/useAuthGuard'
import { currentRole } from '@/utils/auth'
import { DEFAULT_PAGE_SIZE } from '@/utils/constants'
import { openFunctionEntry } from '@/utils/navigation'
import {
  fetchAdminVolunteers,
  updateAdminVolunteerRole,
  type AdminVolunteerListItem
} from '@/utils/project'

const searchKeyword = ref('')
const searchMode = ref<'name' | 'studentId'>('name')
const durationMin = ref('')
const durationMax = ref('')
const projectMin = ref('')
const projectMax = ref('')

const volunteerRows = ref<AdminVolunteerListItem[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const errorMessage = ref('')
const page = ref(1)
const hasMore = ref(true)

const PAGE_SIZE = DEFAULT_PAGE_SIZE

const changingRoleUserId = ref<number | null>(null)

const isSuperAdmin = computed(() => currentRole.value === 3)

const toNumberOrUndefined = (value: string) => {
  if (!value.trim()) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const toRoleLabel = (role: number) => {
  if (role === 3) {
    return '超级管理员'
  }

  if (role === 2) {
    return '管理员'
  }

  if (role === 1) {
    return '临界青年'
  }

  return '志愿者'
}

const buildVolunteerInfoCard = (item: AdminVolunteerListItem) => {
  const roleKey = item.role === 3 ? 'super_admin' : item.role === 2 ? 'admin' : 'volunteer'
  const canToggleRole = isSuperAdmin.value && (item.role === 0 || item.role === 2)
  const isChangingRole = changingRoleUserId.value === item.userId

  return {
    title: {
      text: `${item.name || '-'}（${item.nickname || '-'}）`
    },
    tag: {
      text: toRoleLabel(item.role),
      when: roleKey,
      matchers: [
        { when: 'super_admin', type: 3 as const },
        { when: 'admin', type: 2 as const },
        { when: 'volunteer', type: 1 as const }
      ]
    },
    rows: [
      [{ text: `学号：${item.studentId || '-'}` }, { text: `手机号：${item.phone || '-'}` }],
      [{ text: `时长：${item.volunteerHours.toFixed(2)}h` }, { text: `项目数：${item.projectCount}` }],
      [{ text: `昵称：${item.nickname || '-'}` }]
    ],
    buttonRows: [[
      canToggleRole
        ? {
            text: item.role === 0 ? '提升为管理员' : '降低为志愿者',
            type: item.role === 0 ? (2 as const) : (4 as const),
            loading: isChangingRole,
            loadingText: '处理中...',
            onTap: async () => {
              await toggleVolunteerRole(item)
            }
          }
        : {
            text: '',
            type: 0 as const
          },
      {
        text: '详细',
        type: 1 as const,
        onTap: async () => {
          await goToDetailPage(item.userId)
        }
      }
    ]]
  }
}

const buildQuery = () => ({
  name: searchMode.value === 'name' ? searchKeyword.value.trim() || undefined : undefined,
  studentId: searchMode.value === 'studentId' ? searchKeyword.value.trim() || undefined : undefined,
  volunteerHoursMin: toNumberOrUndefined(durationMin.value),
  volunteerHoursMax: toNumberOrUndefined(durationMax.value),
  projectCountMin: toNumberOrUndefined(projectMin.value),
  projectCountMax: toNumberOrUndefined(projectMax.value),
  page: page.value,
  pageSize: PAGE_SIZE
})

const appendUniqueVolunteers = (existing: AdminVolunteerListItem[], incoming: AdminVolunteerListItem[]) => {
  const seen = new Set(existing.map((item) => item.userId))
  const next = [...existing]
  incoming.forEach((item) => {
    if (seen.has(item.userId)) {
      return
    }
    next.push(item)
    seen.add(item.userId)
  })
  return next
}

const loadVolunteers = async (reset = false) => {
  if (reset) {
    loading.value = true
    loadingMore.value = false
    errorMessage.value = ''
    page.value = 1
    hasMore.value = true
    volunteerRows.value = []
  } else {
    if (!hasMore.value || loadingMore.value || loading.value) {
      return
    }
    loadingMore.value = true
  }

  errorMessage.value = ''

  try {
    const data = await fetchAdminVolunteers(buildQuery())
    volunteerRows.value = reset ? data.items : appendUniqueVolunteers(volunteerRows.value, data.items)
    hasMore.value = volunteerRows.value.length < data.total && data.items.length === PAGE_SIZE
    if (data.items.length > 0) {
      page.value += 1
    }
  } catch {
    if (reset) {
      errorMessage.value = '志愿者列表加载失败，请稍后重试'
      volunteerRows.value = []
    } else {
      uni.showToast({ title: '加载下一页失败，请重试', icon: 'none' })
    }
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const resetFilters = async () => {
  searchKeyword.value = ''
  searchMode.value = 'name'
  durationMin.value = ''
  durationMax.value = ''
  projectMin.value = ''
  projectMax.value = ''
  await loadVolunteers(true)
}

const setSearchMode = (mode: 'name' | 'studentId') => {
  searchMode.value = mode
  searchKeyword.value = ''
}

const goToDetailPage = async (userId: number) => {
  uni.navigateTo({
    url: `/pages/admin/volunteer-detail?userId=${userId}`
  })
}

const toggleVolunteerRole = async (item: AdminVolunteerListItem) => {
  if (changingRoleUserId.value !== null) {
    return
  }

  if (item.role !== 0 && item.role !== 2) {
    return
  }

  const nextRole: 0 | 2 = item.role === 0 ? 2 : 0
  const actionLabel = nextRole === 2 ? '提升' : '降低'

  changingRoleUserId.value = item.userId
  try {
    await updateAdminVolunteerRole(item.userId, nextRole)
    item.role = nextRole
    uni.showToast({ title: `${actionLabel}成功`, icon: 'success' })
  } catch {
    uni.showToast({ title: `${actionLabel}失败，请重试`, icon: 'none' })
  } finally {
    changingRoleUserId.value = null
  }
}

useAuthGuard({
  routePath: '/pages/admin/volunteer-info',
  roleCheck: (role) => role === 2 || role === 3,
  onForbidden: () => {
    openFunctionEntry()
  },
  onAuthorized: () => loadVolunteers(true)
})

onReachBottom(async () => {
  await loadVolunteers(false)
})

onPullDownRefresh(async () => {
  await loadVolunteers(true)
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
  padding: 40rpx 30rpx calc(200rpx + env(safe-area-inset-bottom));
}

.search-bar {
  margin-bottom: 20rpx;
  padding: 22rpx 24rpx;
  background: rgba(255, 255, 255, 0.84);
  border: 1rpx solid rgba(255, 255, 255, 0.72);
  border-radius: 22rpx;
  box-shadow: 0 14rpx 34rpx rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.search-label {
  flex-shrink: 0;
  font-size: 28rpx;
  font-weight: 700;
  color: #2b7a78;
}

.search-segment {
  display: flex;
  gap: 10rpx;
}

.search-segment-item {
  min-width: 92rpx;
  height: 56rpx;
  padding: 0 16rpx;
  border-radius: 12rpx;
  border: 1rpx solid #d7dde3;
  background: rgba(248, 250, 252, 0.96);
  color: #4b5563;
  font-size: 24rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-segment-item.active {
  color: #ffffff;
  border-color: transparent;
  background: linear-gradient(135deg, #2d7b7c 0%, #3ea88f 100%);
}

.search-input {
  flex: 1;
  height: 72rpx;
  padding: 0 20rpx;
  border-radius: 16rpx;
  background: rgba(248, 250, 252, 0.96);
  font-size: 26rpx;
  color: #111827;
  box-sizing: border-box;
}

.search-placeholder {
  color: #9ca3af;
}

.range-bar {
  margin-bottom: 20rpx;
  padding: 22rpx 24rpx;
  background: rgba(255, 255, 255, 0.84);
  border: 1rpx solid rgba(255, 255, 255, 0.72);
  border-radius: 22rpx;
  box-shadow: 0 14rpx 34rpx rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.range-group {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.range-label {
  flex: 0 0 120rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: #2b7a78;
}

.range-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.range-input {
  flex: 1;
  height: 64rpx;
  padding: 0 16rpx;
  border-radius: 12rpx;
  background: rgba(248, 250, 252, 0.96);
  font-size: 24rpx;
  color: #111827;
  box-sizing: border-box;
}

.range-sep {
  flex: 0 0 auto;
  color: #6b7280;
  font-size: 26rpx;
}

.review-filter-bar {
  margin-bottom: 20rpx;
  padding: 22rpx 24rpx;
  background: rgba(255, 255, 255, 0.84);
  border: 1rpx solid rgba(255, 255, 255, 0.72);
  border-radius: 22rpx;
  box-shadow: 0 14rpx 34rpx rgba(15, 23, 42, 0.08);
}

.review-filter-label {
  display: block;
  margin-bottom: 14rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: #2b7a78;
}

.review-filter-segment {
  display: flex;
  gap: 12rpx;
}

.review-filter-item {
  flex: 1;
  min-width: 0;
  height: 62rpx;
  border-radius: 12rpx;
  border: 1rpx solid #d7dde3;
  background: rgba(248, 250, 252, 0.96);
  color: #4b5563;
  font-size: 24rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}

.review-filter-item.active {
  color: #ffffff;
  border-color: transparent;
  background: linear-gradient(135deg, #2d7b7c 0%, #3ea88f 100%);
}

.action-row {
  display: flex;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.action-btn {
  margin: 0;
  flex: 1;
  height: 70rpx;
  border: none;
  border-radius: 14rpx;
  font-size: 24rpx;
  font-weight: 600;
}

.action-btn::after {
  border: none;
}

.action-btn-primary {
  color: #ffffff;
  background: linear-gradient(135deg, #2d7b7c 0%, #3ea88f 100%);
}

.load-more-row {
  padding: 18rpx 0 12rpx;
  text-align: center;
  color: #6b7280;
  font-size: 22rpx;
}

.action-btn-secondary {
  color: #374151;
  background: #e5e7eb;
}

.table-wrapper {
  background: rgba(255, 255, 255, 0.84);
  border: 1rpx solid rgba(255, 255, 255, 0.72);
  border-radius: 22rpx;
  box-shadow: 0 14rpx 34rpx rgba(15, 23, 42, 0.08);
  overflow: hidden;
  padding: 10rpx 14rpx 4rpx;
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

.card-list {
  width: 100%;
}

</style>
