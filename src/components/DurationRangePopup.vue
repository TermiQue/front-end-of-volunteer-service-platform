<template>
  <view v-if="visible" class="duration-range-mask" @tap="closePopup">
    <view class="duration-range-panel" @tap.stop>
      <view class="panel-title">{{ label }}</view>
      <view class="range-title">{{ rangeText }}</view>

      <view class="duration-grid">
        <view
          v-for="option in durationOptions"
          :key="option.key"
          class="duration-cell"
          :class="{
            empty: !option.value,
            selected: isDurationEndpoint(option.value),
            ranged: isDurationInRange(option.value)
          }"
          @tap="toggleDuration(option.value)"
        >
          <text>{{ option.label }}</text>
        </view>
      </view>

      <view class="actions">
        <button class="btn btn-secondary" @tap="clearAndClose">清空</button>
        <button class="btn btn-primary" @tap="confirm">确定</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const DEFAULT_DURATION_MIN = '0.0'

const props = withDefaults(
  defineProps<{
    visible: boolean
    min: string
    max: string
    label?: string
    maxHours?: number
  }>(),
  {
    label: '时长范围',
    maxHours: 24
  }
)

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'update:min', value: string): void
  (e: 'update:max', value: string): void
  (e: 'confirm', value: { min: string; max: string }): void
  (e: 'clear'): void
}>()

const selectedDurations = ref<string[]>([])

const durationOptions = computed(() => {
  const max = Math.max(0, Math.floor(props.maxHours))
  const count = max + 1
  const options = Array.from({ length: count }, (_, index) => {
    const value = index.toFixed(1)
    return {
      value,
      label: String(index),
      key: `duration-${value}`
    }
  })

  return [
    { value: '', label: '', key: 'empty-0' },
    { value: '', label: '', key: 'empty-1' },
    ...options
  ]
})

const rangeBounds = computed(() => {
  if (selectedDurations.value.length === 0) {
    return { min: '', max: '' }
  }

  if (selectedDurations.value.length === 1) {
    return {
      min: DEFAULT_DURATION_MIN,
      max: selectedDurations.value[0]
    }
  }

  const [first, second] = selectedDurations.value
  return Number(first) <= Number(second)
    ? { min: first, max: second }
    : { min: second, max: first }
})

const rangeText = computed(() => {
  if (!rangeBounds.value.min || !rangeBounds.value.max) {
    return '请选择时长'
  }

  return `${rangeBounds.value.min}h - ${rangeBounds.value.max}h`
})

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      selectedDurations.value = normalizeSelectedDurations(props.min, props.max)
    }
  }
)

const normalizeDuration = (value: string) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > props.maxHours) {
    return ''
  }

  return Math.floor(parsed).toFixed(1)
}

const normalizeSelectedDurations = (min: string, max: string) => {
  const normalizedMin = normalizeDuration(min)
  const normalizedMax = normalizeDuration(max)

  if (normalizedMin === DEFAULT_DURATION_MIN && normalizedMax) {
    return [normalizedMax]
  }

  return [normalizedMin, normalizedMax].filter(Boolean).slice(0, 2)
}

const closePopup = () => {
  emit('update:visible', false)
}

const toggleDuration = (value: string) => {
  if (!value) {
    return
  }

  if (selectedDurations.value.includes(value)) {
    selectedDurations.value = selectedDurations.value.filter((item) => item !== value)
    return
  }

  selectedDurations.value = [...selectedDurations.value, value].slice(-2)
}

const isDurationEndpoint = (value: string) =>
  Boolean(value) &&
  (selectedDurations.value.includes(value) || (selectedDurations.value.length === 1 && value === DEFAULT_DURATION_MIN))

const isDurationInRange = (value: string) => {
  if (isDurationEndpoint(value) || !rangeBounds.value.min || !rangeBounds.value.max) {
    return false
  }

  const current = Number(value)
  return current > Number(rangeBounds.value.min) && current < Number(rangeBounds.value.max)
}

const clearAndClose = () => {
  selectedDurations.value = []
  emit('update:min', '')
  emit('update:max', '')
  emit('clear')
  closePopup()
}

const confirm = () => {
  emit('update:min', rangeBounds.value.min)
  emit('update:max', rangeBounds.value.max)
  emit('confirm', rangeBounds.value)
  closePopup()
}
</script>

<style scoped lang="scss">
.duration-range-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 3000;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 24rpx;
  box-sizing: border-box;
}

.duration-range-panel {
  width: 100%;
  max-width: 680rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.72);
  border: 1rpx solid rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  box-shadow: 0 20rpx 48rpx rgba(15, 23, 42, 0.22);
  padding: 24rpx;
  box-sizing: border-box;
}

.panel-title {
  text-align: center;
  font-size: 30rpx;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12rpx;
}

.range-title {
  margin-bottom: 16rpx;
  text-align: center;
  font-size: 24rpx;
  font-weight: 700;
  color: #2b7a78;
}

.duration-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10rpx;
  max-height: 680rpx;
  overflow-y: auto;
  overflow-x: visible;
  padding: 4rpx;
}

.duration-cell {
  position: relative;
  z-index: 1;
  height: 58rpx;
  border-radius: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid #e5e7eb;
  color: #111827;
  font-size: 24rpx;
  text-align: center;
  box-sizing: border-box;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease;
}

.duration-cell text {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  text-align: center;
}

.duration-cell.ranged {
  border-color: rgba(43, 122, 120, 0.28);
  background: rgba(240, 253, 250, 0.58);
  color: #2b7a78;
}

.duration-cell.empty {
  border-color: transparent;
  color: transparent;
  background: transparent;
  box-shadow: none;
}

.duration-cell.selected {
  z-index: 4;
  border: 3rpx solid #2b7a78;
  background: rgba(240, 253, 250, 0.92);
  color: #2b7a78;
  font-weight: 700;
  transform: scale(1.12);
  box-shadow: 0 8rpx 18rpx rgba(43, 122, 120, 0.22);
}

.actions {
  margin-top: 20rpx;
  display: flex;
  gap: 12rpx;
}

.btn {
  margin: 0;
  flex: 1;
  height: 66rpx;
  border: none;
  border-radius: 10rpx;
  font-size: 28rpx;
  line-height: 66rpx;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.btn::after {
  border: none;
}

.btn-primary {
  color: #422006;
  background: linear-gradient(135deg, #facc15 0%, #f59e0b 100%);
}

.btn-secondary {
  color: #374151;
  background: #e5e7eb;
}
</style>
