<template>
  <view class="page">
    <BackgroundGlow />

    <view class="content">
      <ProjectRecordSection
        :title="sectionTitle"
        :items="notificationRecordItems"
        :loading="loading && !notifications.length"
        :loading-more="loadingMore"
        :has-more="hasMore"
        :error-message="errorMessage"
        loading-text="正在加载通知..."
        empty-text="暂时还没有通知"
        no-more-text="没有更多通知了"
      >
        <template #header-actions>
          <view class="header-actions">
            <button class="header-action-btn" :disabled="allReadLock || unreadCount <= 0" @tap="markAllNotificationsAsRead">
              {{ allReadLock ? '处理中...' : '全部已读' }}
            </button>
            <text class="unread-text">未读 {{ unreadCount }}</text>
          </view>
        </template>
      </ProjectRecordSection>
    </view>

    <BottomTabbar :selected="3" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'

import BackgroundGlow from '@/components/BackgroundGlow.vue'
import BottomTabbar from '@/components/BottomTabbar.vue'
import ProjectRecordSection, { type ProjectRecordItem } from '@/components/ProjectRecordSection.vue'
import { useAuthGuard } from '@/composables/useAuthGuard'
import { DEFAULT_PAGE_SIZE } from '@/utils/constants'
import { openInAppLink } from '@/utils/navigation'
import {
  deleteNotification,
  fetchMyNotifications,
  markNotificationAsRead,
  notificationUnreadCount,
  type NotificationItem
} from '@/utils/notification'
import { formatProjectDate } from '@/utils/project'

const notifications = ref<NotificationItem[]>([])
const unreadCount = notificationUnreadCount
const loading = ref(false)
const loadingMore = ref(false)
const errorMessage = ref('')
const allReadLock = ref(false)
const page = ref(1)
const hasMore = ref(true)

const PAGE_SIZE = DEFAULT_PAGE_SIZE
const BATCH_PAGE_SIZE = 100

const sectionTitle = computed(() => {
  return unreadCount.value > 0 ? `消息通知（${unreadCount.value} 条未读）` : '消息通知'
})

const appendUniqueNotifications = (existing: NotificationItem[], incoming: NotificationItem[]) => {
  const seen = new Set(existing.map((item) => item.id))
  const next = [...existing]
  incoming.forEach((item) => {
    if (seen.has(item.id)) {
      return
    }
    next.push(item)
    seen.add(item.id)
  })
  return next
}

const replaceNotification = (target: NotificationItem) => {
  notifications.value = notifications.value.map((item) => (item.id === target.id ? target : item))
}

const removeNotification = (target: NotificationItem) => {
  notifications.value = notifications.value.filter((item) => item.id !== target.id)
}

const markOneAsRead = async (item: NotificationItem) => {
  if (item.isRead === 1) {
    return
  }

  const updated = await markNotificationAsRead(item.id)
  replaceNotification(updated)
}

const markAllNotificationsAsRead = async () => {
  if (allReadLock.value || unreadCount.value <= 0) {
    return
  }

  allReadLock.value = true
  try {
    let currentPage = 1
    let total = 0

    do {
      const data = await fetchMyNotifications({
        page: currentPage,
        pageSize: BATCH_PAGE_SIZE
      })

      total = data.total
      const unreadItems = data.items.filter((item) => item.isRead === 0)
      if (unreadItems.length) {
        await Promise.all(unreadItems.map((item) => markNotificationAsRead(item.id)))
      }

      if (currentPage * BATCH_PAGE_SIZE >= total) {
        break
      }

      currentPage += 1
    } while (true)

    await loadNotifications(true)
    uni.showToast({
      title: '已全部标记为已读',
      icon: 'none'
    })
  } catch {
    uni.showToast({
      title: '全部已读失败，请重试',
      icon: 'none'
    })
  } finally {
    allReadLock.value = false
  }
}

const deleteOneNotification = async (item: NotificationItem) => {
  const { confirm } = await uni.showModal({
    title: '删除通知',
    content: '删除后该通知不会再出现在列表中，确认删除吗？'
  })

  if (!confirm) {
    return
  }

  await deleteNotification(item.id)
  removeNotification(item)
  if (item.isRead === 0) {
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }
  uni.showToast({
    title: '已删除',
    icon: 'none'
  })
}

const openNotificationDetail = (item: NotificationItem) => {
  if (!item.redirectUrl) {
    uni.showToast({
      title: '该通知暂无详情链接',
      icon: 'none'
    })
    return
  }

  openInAppLink(item.redirectUrl)
}

const buildCardTag = (item: NotificationItem) => {
  return {
    text: item.isRead === 1 ? '已阅' : '未读',
    when: item.isRead === 1 ? 'read' : 'unread',
    matchers: [
      { when: 'unread', type: 3 as const },
      { when: 'read', type: 2 as const }
    ]
  }
}

const notificationRecordItems = computed<ProjectRecordItem[]>(() => {
  return notifications.value.map((item) => ({
    id: item.id,
    card: {
      title: {
        text: item.title || '通知'
      },
      tag: buildCardTag(item),
      rows: [
        [{ text: `类型：${item.type || '-'}` }, { text: `时间：${formatProjectDate(item.createdAt)}` }],
        [{ text: `内容：${item.content || '-'}` }],
        [{ text: `跳转：${item.redirectUrl || '暂无'}` }]
      ],
      buttonRows: [
        [
          {
            text: '详情',
            type: 1 as const,
            disabled: !item.redirectUrl,
            onTap: async () => {
              openNotificationDetail(item)
            }
          },
          item.isRead === 1
            ? {
                text: '朕已阅',
                type: 0 as const
              }
            : {
                text: '朕已阅',
                type: 2 as const,
                loadingText: '标记中...',
                onTap: async () => {
                  await markOneAsRead(item)
                }
              },
          {
            text: '删除',
            type: 4 as const,
            loadingText: '删除中...',
            onTap: async () => {
              await deleteOneNotification(item)
            }
          }
        ]
      ]
    }
  }))
})

const loadNotifications = async (reset = false) => {
  if (reset) {
    loading.value = true
    loadingMore.value = false
    errorMessage.value = ''
    page.value = 1
    hasMore.value = true
    notifications.value = []
  } else {
    if (!hasMore.value || loading.value || loadingMore.value) {
      return
    }
    loadingMore.value = true
  }

  try {
    const data = await fetchMyNotifications({
      page: page.value,
      pageSize: PAGE_SIZE
    })

    unreadCount.value = data.unreadCount
    notifications.value = reset ? data.items : appendUniqueNotifications(notifications.value, data.items)
    hasMore.value = notifications.value.length < data.total && data.items.length === PAGE_SIZE
    if (data.items.length > 0) {
      page.value += 1
    }
  } catch {
    if (reset) {
      notifications.value = []
      errorMessage.value = '通知加载失败，请下拉重试'
    } else {
      uni.showToast({
        title: '加载更多失败，请重试',
        icon: 'none'
      })
    }
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

useAuthGuard({
  routePath: '/pages/message/message',
  onAuthorized: async () => {
    await loadNotifications(true)
  }
})

onReachBottom(async () => {
  await loadNotifications(false)
})

onPullDownRefresh(async () => {
  await loadNotifications(true)
  uni.stopPullDownRefresh()
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
  padding: 28rpx 0 220rpx;
  box-sizing: border-box;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.header-action-btn {
  margin: 0;
  height: 48rpx;
  line-height: 48rpx;
  padding: 0 18rpx;
  border: none;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #2d7b7c 0%, #1f5f60 100%);
}

.header-action-btn::after {
  border: none;
}

.header-action-btn[disabled] {
  opacity: 0.55;
}

.unread-text {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  color: #92400e;
  background: rgba(251, 191, 36, 0.18);
  border: 1rpx solid rgba(245, 158, 11, 0.3);
}
</style>
