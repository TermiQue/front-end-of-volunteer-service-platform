<template>
  <view class="page">
    <BackgroundGlow />
    <view class="content">
      <ProjectRecordSection
        title="志愿者信息"
        :items="volunteerRecordItems"
        :loading="loading && !volunteerRows.length"
        :loading-more="loadingMore"
        :has-more="hasMore"
        :error-message="errorMessage"
        loading-text="正在加载志愿者列表..."
        empty-text="暂无符合条件的数据"
        no-more-text="没有更多了"
      >
        <template #filters>
          <SegmentFilter :model-value="searchMode" :options="searchModeOptions" @change="setSearchMode" />

          <view class="filter-bar">
            <view class="filter-bar-item">
              <FilterInput
                v-model="searchKeyword"
                :label="searchMode === 'name' ? '姓名关键词' : '学号关键词'"
                :placeholder="searchMode === 'name' ? '请输入姓名' : '请输入学号'"
              />
            </view>

            <view class="filter-bar-item">
              <DurationRangeFilter
                :min="durationMin"
                :max="durationMax"
                label="时长范围"
                placeholder="请选择时长范围"
                @open="openDurationRangePopup"
              />
            </view>
          </view>
        </template>
      </ProjectRecordSection>
    </view>

    <DurationRangePopup
      v-model:visible="durationRangePopupVisible"
      v-model:min="durationMin"
      v-model:max="durationMax"
      label="时长范围"
      :max-hours="24"
    />

  </view>
</template>

<script setup lang="ts">
import BackgroundGlow from '@/components/BackgroundGlow.vue'
import DurationRangeFilter from '@/components/DurationRangeFilter.vue'
import DurationRangePopup from '@/components/DurationRangePopup.vue'
import FilterInput from '@/components/FilterInput.vue'
import ProjectRecordSection, { type ProjectRecordItem } from '@/components/ProjectRecordSection.vue'
import SegmentFilter from '@/components/SegmentFilter.vue'
import { computed, ref, watch } from 'vue'
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
const durationRangePopupVisible = ref(false)

const volunteerRows = ref<AdminVolunteerListItem[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const errorMessage = ref('')
const page = ref(1)
const hasMore = ref(true)

const PAGE_SIZE = DEFAULT_PAGE_SIZE
const SEARCH_MODE_OPTIONS = [
  { label: '姓名', value: 'name' },
  { label: '学号', value: 'studentId' }
] as const

const changingRoleUserId = ref<number | null>(null)
let autoQueryTimer: ReturnType<typeof setTimeout> | null = null
let autoQueryReady = false

const isSuperAdmin = computed(() => currentRole.value === 3)
const searchModeOptions = [...SEARCH_MODE_OPTIONS]

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
      text: item.name || '-'
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
      [{ text: `时长：${item.volunteerHours.toFixed(2)}h` }, { text: `项目数：${item.projectCount}` }]
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

const volunteerRecordItems = computed<ProjectRecordItem[]>(() => {
  return volunteerRows.value.map((item) => ({
    id: item.userId,
    card: buildVolunteerInfoCard(item)
  }))
})

const triggerAutoQuery = (immediate = false) => {
  if (!autoQueryReady) {
    return
  }

  if (autoQueryTimer) {
    clearTimeout(autoQueryTimer)
    autoQueryTimer = null
  }

  if (immediate) {
    void loadVolunteers(true)
    return
  }

  autoQueryTimer = setTimeout(() => {
    autoQueryTimer = null
    void loadVolunteers(true)
  }, 260)
}

const openDurationRangePopup = () => {
  durationRangePopupVisible.value = true
}

const buildQuery = () => ({
  name: searchMode.value === 'name' ? searchKeyword.value.trim() || undefined : undefined,
  studentId: searchMode.value === 'studentId' ? searchKeyword.value.trim() || undefined : undefined,
  volunteerHoursMin: toNumberOrUndefined(durationMin.value),
  volunteerHoursMax: toNumberOrUndefined(durationMax.value),
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

const setSearchMode = (mode: string) => {
  if (mode !== 'name' && mode !== 'studentId') {
    return
  }

  if (searchMode.value === mode) {
    return
  }

  searchMode.value = mode
  searchKeyword.value = ''
  triggerAutoQuery(true)
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
  onAuthorized: async () => {
    await loadVolunteers(true)
    autoQueryReady = true
  }
})

watch(searchKeyword, () => {
  triggerAutoQuery(false)
})

watch([durationMin, durationMax], () => {
  triggerAutoQuery(true)
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
  padding: 24rpx 0 calc(200rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.filter-bar {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  width: 100%;
  box-sizing: border-box;
}

.filter-bar-item {
  width: 100%;
  min-width: 0;
  flex: 0 0 auto;
}

</style>
