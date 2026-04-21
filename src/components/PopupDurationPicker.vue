<template>
  <view>
    <view class="trigger" @tap="openPopup">
      <text :class="modelValue ? 'value' : 'placeholder'">{{ displayText }}</text>
    </view>

    <view v-if="visible" class="mask" @tap="closePopup">
      <view class="panel" @tap.stop>
        <view class="panel-title">{{ title }}</view>

        <picker-view class="picker-view" :value="pickerValue" @change="onPickerChange" indicator-style="height: 88rpx;">
          <picker-view-column>
            <view v-for="hour in hourOptions" :key="`h-${hour}`" class="picker-item">{{ hour }}</view>
          </picker-view-column>
          <picker-view-column>
            <view v-for="minute in minuteOptions" :key="`m-${minute}`" class="picker-item">{{ minute }}</view>
          </picker-view-column>
        </picker-view>

        <view class="actions">
          <button class="btn btn-secondary" @tap="closePopup">取消</button>
          <button class="btn btn-primary" @tap="confirm">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    title?: string
    placeholder?: string
    maxHours?: number
  }>(),
  {
    title: '选择时长',
    placeholder: '请选择时长',
    maxHours: 24
  }
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const visible = ref(false)
const hourOptions = computed(() => {
  const max = Math.max(0, Math.min(24, Math.floor(props.maxHours)))
  return Array.from({ length: max + 1 }, (_, index) => String(index).padStart(2, '0'))
})
const minuteOptions = ['0.0h', '0.5h']
const pickerValue = ref<[number, number]>([0, 0])

const displayText = computed(() => {
  if (!props.modelValue) {
    return props.placeholder
  }
  return `${props.modelValue}h`
})

function parseDuration(value: string) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 24) {
    return null
  }

  const hour = Math.floor(parsed)
  const minuteIndex = parsed - hour >= 0.5 ? 1 : 0
  const maxHourIndex = Math.max(0, hourOptions.value.length - 1)
  return [Math.min(hour, maxHourIndex), minuteIndex] as [number, number]
}

function openPopup() {
  pickerValue.value = parseDuration(props.modelValue) || [0, 0]
  visible.value = true
}

function closePopup() {
  visible.value = false
}

function onPickerChange(event: { detail: { value: number[] } }) {
  const hourIndex = Number(event.detail.value?.[0] ?? 0)
  const minuteIndex = Number(event.detail.value?.[1] ?? 0)
  pickerValue.value = [hourIndex, minuteIndex]
}

function confirm() {
  const hour = Number(hourOptions.value[pickerValue.value[0]] || 0)
  const minute = pickerValue.value[1] === 1 ? 0.5 : 0
  const total = hour + minute
  emit('update:modelValue', total.toFixed(1))
  closePopup()
}
</script>

<style scoped lang="scss">
.trigger {
  width: 100%;
  min-height: 68rpx;
  border-radius: 10rpx;
  background: #ffffff;
  border: 1rpx solid #d1d5db;
  padding: 0 12rpx;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.value {
  font-size: 24rpx;
  color: #111827;
  font-weight: 500;
}

.placeholder {
  font-size: 24rpx;
  color: #9ca3af;
}

.mask {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: flex-end;
}

.panel {
  width: 100%;
  border-radius: 24rpx 24rpx 0 0;
  background: #ffffff;
  padding: 24rpx;
  box-sizing: border-box;
}

.panel-title {
  text-align: center;
  font-size: 30rpx;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 16rpx;
}

.picker-view {
  width: 100%;
  height: 340rpx;
}

.picker-item {
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  font-size: 28rpx;
  color: #111827;
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
  font-size: 24rpx;
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
