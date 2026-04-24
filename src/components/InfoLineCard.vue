<template>
  <view class="history-item">
    <view class="history-head">
      <text class="history-name" :class="card.title.className || ''">{{ card.title.text }}</text>
      <text v-if="card.tag?.text" class="duration-badge" :class="resolveTagClass(card.tag)">
        {{ card.tag.text }}
      </text>
    </view>

    <view v-for="(row, rowIndex) in card.rows" :key="rowIndex" class="history-meta" :class="{ 'history-meta-triple': row.length >= 3 }">
      <text
        v-for="(column, columnIndex) in row"
        :key="columnIndex"
        class="history-meta-third"
        :class="column.className || ''"
        :style="{ width: `${100 / Math.max(row.length, 1)}%` }"
      >
        {{ column.text }}
      </text>
    </view>

    <view v-for="(buttonRow, buttonRowIndex) in card.buttonRows || []" :key="`button-row-${buttonRowIndex}`" class="history-actions">
      <template v-for="(button, buttonIndex) in buttonRow" :key="`button-${buttonRowIndex}-${buttonIndex}`">
        <view
          v-if="(button.type ?? 1) === 0"
          class="history-action action-placeholder"
          :class="button.className || ''"
          :style="{ width: `${100 / Math.max(buttonRow.length, 1)}%` }"
          aria-hidden="true"
        />
        <button
          v-else
          class="history-action"
          :class="[resolveButtonClass(button), button.className || '', isButtonDisabled(button, buttonRowIndex, buttonIndex) ? 'is-disabled' : '']"
          :style="{ width: `${100 / Math.max(buttonRow.length, 1)}%` }"
          :disabled="isButtonDisabled(button, buttonRowIndex, buttonIndex)"
          @tap="onButtonTap(button, buttonRowIndex, buttonIndex)"
        >
          <text>{{ resolveButtonText(button, buttonRowIndex, buttonIndex) }}</text>
        </button>
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

type TagStyleType = 1 | 2 | 3
type ButtonStyleType = 0 | 1 | 2 | 3 | 4

type CardTitle = {
  text: string
  className?: string
}

type CardTagCase = {
  when: string
  type: TagStyleType
}

type CardTag = {
  text: string
  type?: TagStyleType
  when?: string
  matchers?: CardTagCase[]
  current?: string
  cases?: CardTagCase[]
}

type CardColumn = {
  text: string
  className?: string
}

type CardButton = {
  text?: string
  type?: ButtonStyleType
  className?: string
  disabled?: boolean
  loading?: boolean
  loadingText?: string
  onTap?: (payload: { button: CardButton; rowIndex: number; buttonIndex: number }) => void | Promise<void>
}

type CardData = {
  title: CardTitle
  tag?: CardTag
  rows: CardColumn[][]
  buttonRows?: CardButton[][]
}

defineProps<{
  card: CardData
}>()

const emit = defineEmits<{
  (e: 'button-tap', payload: { button: CardButton; rowIndex: number; buttonIndex: number }): void
}>()

const TAG_CLASS_MAP: Record<TagStyleType, string> = {
  1: 'duration-neutral',
  2: 'duration-valid',
  3: 'duration-invalid'
}

const BUTTON_CLASS_MAP: Record<ButtonStyleType, string> = {
  0: 'action-placeholder',
  1: 'action-blue',
  2: 'action-green',
  3: 'action-orange',
  4: 'action-red'
}

const resolveTagClass = (tag: CardTag) => {
  const activeWhen = tag.when || tag.current || 'default'
  const matchers = tag.matchers?.length ? tag.matchers : tag.cases

  if (matchers?.length) {
    const matched = matchers.find((item) => item.when === activeWhen) || matchers.find((item) => item.when === 'default')
    if (matched) {
      return TAG_CLASS_MAP[matched.type]
    }
  }

  return TAG_CLASS_MAP[tag.type || 1]
}

const resolveButtonClass = (button: CardButton) => {
  return BUTTON_CLASS_MAP[button.type ?? 1]
}

const pendingButtonKeys = ref<Set<string>>(new Set())

const getButtonKey = (rowIndex: number, buttonIndex: number) => `${rowIndex}-${buttonIndex}`

const isPending = (rowIndex: number, buttonIndex: number) => {
  return pendingButtonKeys.value.has(getButtonKey(rowIndex, buttonIndex))
}

const setPending = (rowIndex: number, buttonIndex: number, value: boolean) => {
  const key = getButtonKey(rowIndex, buttonIndex)
  const next = new Set(pendingButtonKeys.value)
  if (value) {
    next.add(key)
  } else {
    next.delete(key)
  }
  pendingButtonKeys.value = next
}

const isButtonDisabled = (button: CardButton, rowIndex: number, buttonIndex: number) => {
  return Boolean(button.disabled || button.loading || isPending(rowIndex, buttonIndex))
}

const resolveButtonText = (button: CardButton, rowIndex: number, buttonIndex: number) => {
  if (button.loading || isPending(rowIndex, buttonIndex)) {
    return button.loadingText || '处理中...'
  }
  return button.text || ''
}

const onButtonTap = async (button: CardButton, rowIndex: number, buttonIndex: number) => {
  if ((button.type ?? 1) === 0) {
    return
  }

  if (isButtonDisabled(button, rowIndex, buttonIndex)) {
    return
  }

  const payload = { button, rowIndex, buttonIndex }
  setPending(rowIndex, buttonIndex, true)
  try {
    await Promise.resolve(button.onTap?.(payload))
    emit('button-tap', payload)
  } finally {
    setPending(rowIndex, buttonIndex, false)
  }
}
</script>

<style scoped lang="scss">
.history-item {
  position: relative;
  z-index: 2;
  padding: 14rpx 0;
  border-bottom: 1rpx dashed #e6e8ec;
}

.history-item:last-child {
  border-bottom: none;
}

.history-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6rpx;
  gap: 36rpx;
}

.history-name {
  flex: 1;
  font-size: 28rpx;
  color: #1f2d3d;
  font-weight: 600;
  letter-spacing: 2rpx;
}

.duration-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 92rpx;
  height: 44rpx;
  box-sizing: border-box;
  font-size: 22rpx;
  line-height: 1;
  padding: 0 12rpx;
  border-radius: 999rpx;
  text-align: center;
  flex-shrink: 0;
}

.duration-neutral {
  color: #475569;
  background: #e2e8f0;
}

.duration-valid {
  color: #065f46;
  background: #d1fae5;
}

.duration-invalid {
  color: #b42318;
  background: #fee4e2;
}

.history-meta {
  font-size: 21rpx;
  color: #667085;
  display: flex;
  gap: 0;
  margin-top: 4rpx;
}

.history-meta-triple {
  gap: 0;
}

.history-meta-third {
  text-align: left;
  box-sizing: border-box;
}

.history-actions {
  display: flex;
  gap: 10rpx;
  margin-top: 12rpx;
}

.history-action {
  margin: 0;
  height: 52rpx;
  padding: 0 12rpx;
  border: none;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  font-weight: 600;
  box-sizing: border-box;
}

.history-action::after {
  border: none;
}

.history-action.is-disabled {
  opacity: 0.6;
}

.action-blue {
  color: #1e3a8a;
  background: #dbeafe;
  border: 1rpx solid #93c5fd;
}

.action-green {
  color: #065f46;
  background: #d1fae5;
  border: 1rpx solid #6ee7b7;
}

.action-orange {
  color: #9a3412;
  background: #ffedd5;
  border: 1rpx solid #fdba74;
}

.action-red {
  color: #991b1b;
  background: #fee2e2;
  border: 1rpx solid #fca5a5;
}

.action-placeholder {
  color: transparent;
  background: transparent;
  border: 1rpx solid transparent;
}
</style>
