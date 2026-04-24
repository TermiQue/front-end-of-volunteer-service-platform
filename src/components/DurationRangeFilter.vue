<template>
  <view class="duration-range-filter" :class="{ active: hasValue }" @tap="emit('open')">
    <text class="filter-label">{{ label }}</text>
    <text class="range-value" :class="{ placeholder: !hasValue }">{{ displayValue }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    min: string
    max: string
    label?: string
    placeholder?: string
  }>(),
  {
    label: '时长范围',
    placeholder: '请选择时长范围'
  }
)

const emit = defineEmits<{
  (e: 'open'): void
}>()

const hasValue = computed(() => Boolean(props.min || props.max))

const formatDurationText = (value: string) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return value
  }

  return Number.isInteger(parsed) ? String(parsed) : String(parsed)
}

const displayValue = computed(() => {
  if (props.min && props.max) {
    return `${formatDurationText(props.min)}-${formatDurationText(props.max)}小时`
  }

  if (props.min) {
    return `${formatDurationText(props.min)}小时起`
  }

  if (props.max) {
    return `${formatDurationText(props.max)}小时内`
  }

  return props.placeholder
})
</script>

<style scoped lang="scss">
.duration-range-filter {
  width: 100%;
  min-width: 100%;
  height: 62rpx;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: rgba(255, 255, 255, 0.82);
  border: 1rpx solid rgba(255, 255, 255, 0.86);
  border-radius: 14rpx;
  padding: 0 12rpx;
  box-sizing: border-box;
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.96),
    0 6rpx 16rpx rgba(15, 23, 42, 0.06);
}

.duration-range-filter.active {
  border-color: #2b7a78;
  background: rgba(240, 253, 250, 0.92);
  box-shadow:
    inset 0 0 0 2rpx #2b7a78,
    inset 0 1rpx 0 rgba(255, 255, 255, 0.96),
    0 6rpx 16rpx rgba(15, 23, 42, 0.06);
}

.filter-label {
  flex-shrink: 0;
  width: 150rpx;
  font-size: 20rpx;
  color: #6b7280;
  font-weight: 600;
}

.range-value {
  flex: 1;
  min-width: 0;
  font-size: 22rpx;
  color: #111827;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-sizing: border-box;
}

.placeholder {
  color: #9ca3af;
}
</style>
