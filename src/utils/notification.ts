import { ref } from 'vue'

import { requestJson } from './request'

export type NotificationReadStatus = 0 | 1

export type NotificationItem = {
  id: number
  type: string
  title: string
  content: string
  senderId: number | null
  receiverId: number
  extraData: Record<string, unknown> | null
  redirectUrl: string
  isRead: NotificationReadStatus
  isDeleted: 0 | 1
  createdAt: string
  readAt: string | null
}

export type NotificationQuery = {
  page?: number
  pageSize?: number
}

export const notificationUnreadCount = ref(0)

type NotificationRaw = Record<string, unknown>

type NotificationsResponse = {
  items: NotificationRaw[]
  total: number
  unreadCount: number
  page: number
  pageSize: number
}

const toIdValue = (value: unknown) => {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

const toStringValue = (value: unknown, fallback = '') => {
  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number') {
    return String(value)
  }

  return fallback
}

const toObjectValue = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return null
}

const compactObject = <T extends Record<string, unknown>>(value: T) => {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== '')
  ) as Partial<T>
}

const toNotificationItem = (item: NotificationRaw, index: number): NotificationItem => ({
  id: toIdValue(item.id) || index + 1,
  type: toStringValue(item.type, '-'),
  title: toStringValue(item.title, '通知'),
  content: toStringValue(item.content, ''),
  senderId:
    item.sender_id === null || item.senderId === null
      ? null
      : toIdValue(item.sender_id ?? item.senderId) || null,
  receiverId: toIdValue(item.receiver_id ?? item.receiverId),
  extraData: toObjectValue(item.extra_data ?? item.extraData),
  redirectUrl: toStringValue(item.redirect_url ?? item.redirectUrl),
  isRead: (toIdValue(item.is_read ?? item.isRead) === 1 ? 1 : 0) as NotificationReadStatus,
  isDeleted: (toIdValue(item.is_deleted ?? item.isDeleted) === 1 ? 1 : 0) as 0 | 1,
  createdAt: toStringValue(item.created_at ?? item.createdAt),
  readAt: toStringValue(item.read_at ?? item.readAt) || null
})

export const fetchMyNotifications = async (params: NotificationQuery = {}) => {
  const data = await requestJson<NotificationsResponse>({
    url: '/auth/notifications',
    method: 'GET',
    data: compactObject(params)
  })

  notificationUnreadCount.value = data.unreadCount

  return {
    items: data.items.map((item, index) => toNotificationItem(item, index)),
    total: data.total,
    unreadCount: data.unreadCount,
    page: data.page,
    pageSize: data.pageSize
  }
}

export const markNotificationAsRead = async (notificationId: number) => {
  const data = await requestJson<{ notification: NotificationRaw }>({
    url: `/auth/notifications/${notificationId}/read`,
    method: 'POST'
  })

  notificationUnreadCount.value = Math.max(0, notificationUnreadCount.value - 1)
  return toNotificationItem(data.notification, 0)
}

export const deleteNotification = async (notificationId: number) => {
  return requestJson({
    url: `/auth/notifications/${notificationId}`,
    method: 'DELETE'
  })
}

export const refreshNotificationUnreadCount = async () => {
  const data = await fetchMyNotifications({
    page: 1,
    pageSize: 1
  })

  return data.unreadCount
}
