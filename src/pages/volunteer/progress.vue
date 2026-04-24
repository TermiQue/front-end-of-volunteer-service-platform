<template>
  <view class="page">
    <BackgroundGlow />

    <view class="content">
      <ProjectRecordSection
        title="我的审核进度"
        :items="appealRecordItems"
        :loading="progressLoading && !myAppeals.length"
        :loading-more="progressLoadingMore"
        :has-more="myAppealHasMore"
        :error-message="errorMessage"
        loading-text="正在加载审核进度..."
        empty-text="暂无审核记录"
        no-more-text="没有更多了"
      >
        <template #filters>
          <SegmentFilter :model-value="statusFilterValue" :options="statusFilterOptions" @change="onStatusFilterChange" />
        </template>
      </ProjectRecordSection>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'

import BackgroundGlow from '@/components/BackgroundGlow.vue'
import ProjectRecordSection, { type ProjectRecordItem } from '@/components/ProjectRecordSection.vue'
import SegmentFilter from '@/components/SegmentFilter.vue'
import { useAuthGuard } from '@/composables/useAuthGuard'
import { openFunctionEntry } from '@/utils/navigation'
import {
  appealStatusTextMap,
  fetchMyAppeals,
  formatProjectDate,
  type AppealStatus,
  type MyAppealItem,
  type MyAppealStatusFilter
} from '@/utils/project'

const PAGE_SIZE = 20

const progressLoading = ref(false)
const progressLoadingMore = ref(false)
const progressStatusFilter = ref<MyAppealStatusFilter>('all')
const myAppealPage = ref(1)
const myAppealHasMore = ref(true)
const myAppeals = ref<MyAppealItem[]>([])
const errorMessage = ref('')

const STATUS_FILTER_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '审核中', value: '0' },
  { label: '通过', value: '1' },
  { label: '拒绝', value: '2' }
] as const

const statusFilterOptions = [...STATUS_FILTER_OPTIONS]
const statusFilterValue = computed(() => {
  return progressStatusFilter.value === 'all' ? 'all' : String(progressStatusFilter.value)
})

const progressStatusText = (status: AppealStatus) => {
  if (status === 0) {
    return '审核中'
  }

  return appealStatusTextMap[status]
}

const buildAppealInfoCard = (item: MyAppealItem) => {
  const typeText = item.type === 1 ? '无效记录申诉' : '时长变更'
  const statusWhen = item.status === 1 ? 'approved' : item.status === 2 ? 'rejected' : 'pending'

  return {
    title: {
      text: item.projectName
    },
    tag: {
      text: progressStatusText(item.status),
      when: statusWhen,
      matchers: [
        { when: 'pending', type: 1 as const },
        { when: 'approved', type: 2 as const },
        { when: 'rejected', type: 3 as const }
      ]
    },
    rows: [
      [{ text: `申请类型：${typeText}` }],
      [{ text: `期望审核员：${item.expectedReviewerName || '-'}` }, { text: `实际审核员：${item.actualReviewerName || '-'}` }],
      [{ text: `申请时间：${formatProjectDate(item.applyTime)}` }],
      [{ text: `申请理由：${item.reason || '-'}` }],
      [{ text: `审核时间：${item.reviewTime ? formatProjectDate(item.reviewTime) : '待审核'}` }],
      [{ text: `审核意见：${item.reviewComment || '-'}` }]
    ]
  }
}

const appealRecordItems = computed<ProjectRecordItem[]>(() => {
  return myAppeals.value.map((item) => ({
    id: item.id,
    card: buildAppealInfoCard(item)
  }))
})

const loadMyAppeals = async (reset = false) => {
  if (reset) {
    progressLoading.value = true
    progressLoadingMore.value = false
    myAppealPage.value = 1
    myAppealHasMore.value = true
    myAppeals.value = []
    errorMessage.value = ''
  } else {
    if (!myAppealHasMore.value || progressLoading.value || progressLoadingMore.value) {
      return
    }
    progressLoadingMore.value = true
  }

  try {
    const data = await fetchMyAppeals({
      status: progressStatusFilter.value,
      page: myAppealPage.value,
      pageSize: PAGE_SIZE
    })

    myAppeals.value = reset ? data.items : [...myAppeals.value, ...data.items]
    myAppealHasMore.value = myAppeals.value.length < data.total && data.items.length === PAGE_SIZE
    if (data.items.length > 0) {
      myAppealPage.value += 1
    }
  } catch {
    if (reset) {
      myAppeals.value = []
      errorMessage.value = '审核进度加载失败，请下拉重试'
    } else {
      uni.showToast({ title: '加载下一页失败，请重试', icon: 'none' })
    }
  } finally {
    progressLoading.value = false
    progressLoadingMore.value = false
  }
}

const onStatusFilterChange = async (value: string) => {
  const nextStatus = value === 'all' ? 'all' : (Number(value) as Exclude<MyAppealStatusFilter, 'all'>)
  if (progressStatusFilter.value === nextStatus) {
    return
  }

  progressStatusFilter.value = nextStatus
  await loadMyAppeals(true)
}

const goBack = () => {
  uni.navigateBack()
}

useAuthGuard({
  routePath: '/pages/volunteer/progress',
  roleCheck: (role) => role !== 1,
  onForbidden: () => {
    openFunctionEntry()
  },
  onAuthorized: async () => {
    progressStatusFilter.value = 'all'
    await loadMyAppeals(true)
  }
})

onReachBottom(async () => {
  await loadMyAppeals(false)
})

onPullDownRefresh(async () => {
  await loadMyAppeals(true)
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
  padding: 24rpx 0 calc(220rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}
</style>
