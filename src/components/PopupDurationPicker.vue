<template>
  <view>
    <view class="trigger" @tap="openPopup">
      <text :class="modelValue ? 'value' : 'placeholder'">{{ displayText }}</text>
    </view>

    <view v-if="visible" class="mask" @tap="closePopup">
      <view class="panel" @tap.stop>
        <view class="panel-title">{{ title }}</view>

        <view class="choice-label">小时</view>
        <view class="hour-grid">
          <view
            v-for="cell in hourCells"
            :key="cell.key"
            class="hour-cell"
            :class="{
              empty: cell.hourIndex === null,
              active: cell.hourIndex !== null && selectedHourIndex === cell.hourIndex
            }"
            @tap="selectHour(cell.hourIndex)"
          >
            <text>{{ cell.label }}</text>
          </view>
        </view>

        <view class="choice-label">增量</view>
        <view class="minute-row">
          <view
            v-for="(minute, index) in minuteOptions"
            :key="`m-${minute}`"
            class="minute-item"
            :class="{
              active: selectedMinuteIndex === index,
              disabled: index === 1 && hourOptions[selectedHourIndex] === '23'
            }"
            @tap="selectMinute(index)"
          >
            {{ minute }}
          </view>
        </view>

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
    maxHours: 23
  }
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const visible = ref(false)
const hourOptions = computed(() => {
  const max = Math.max(0, Math.min(23, Math.floor(props.maxHours)))
  return Array.from({ length: max + 1 }, (_, index) => String(index).padStart(2, '0'))
})
const minuteOptions = ['+0.0h', '+0.5h']
const selectedHourIndex = ref(0)
const selectedMinuteIndex = ref(0)

type HourCell = {
  key: string
  label: string
  hourIndex: number | null
}

const hourCells = computed<HourCell[]>(() => {
  const cells: HourCell[] = []

  for (let index = 0; index < 2; index += 1) {
    cells.push({ key: `empty-${index}`, label: '', hourIndex: null })
  }

  for (let index = 0; index < hourOptions.value.length; index += 1) {
    cells.push({ key: `hour-${index}`, label: hourOptions.value[index], hourIndex: index })
  }

  while (cells.length < 28) {
    const index = cells.length
    cells.push({ key: `tail-${index}`, label: '', hourIndex: null })
  }

  return cells
})

const displayText = computed(() => {
  if (!props.modelValue) {
    return props.placeholder
  }
  return `${props.modelValue}h`
})

function parseDuration(value: string) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 23) {
    return null
  }

  const hour = Math.floor(parsed)
  const minuteIndex = parsed - hour >= 0.5 ? 1 : 0
  const maxHourIndex = Math.max(0, hourOptions.value.length - 1)
  return [Math.min(hour, maxHourIndex), minuteIndex] as [number, number]
}

function openPopup() {
  const parsed = parseDuration(props.modelValue) || [9, 0]
  selectedHourIndex.value = parsed[0]
  selectedMinuteIndex.value = parsed[1]
  visible.value = true
}

function closePopup() {
  visible.value = false
}

function selectHour(hourIndex: number | null) {
  if (hourIndex === null) {
    return
  }
  selectedHourIndex.value = hourIndex
  if (hourOptions.value[hourIndex] === '23' && selectedMinuteIndex.value === 1) {
    selectedMinuteIndex.value = 0
  }
}

function selectMinute(index: number) {
  if (index === 1 && hourOptions.value[selectedHourIndex.value] === '23') {
    return
  }
  selectedMinuteIndex.value = index
}

function confirm() {
  const hour = Number(hourOptions.value[selectedHourIndex.value] || 0)
  const minute = selectedMinuteIndex.value === 1 ? 0.5 : 0
  const total = Math.min(23, hour + minute)
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
  z-index: 3000;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 24rpx;
  box-sizing: border-box;
}

.panel {
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
  margin-bottom: 16rpx;
}

.choice-label {
  font-size: 24rpx;
  color: #6b7280;
  margin-bottom: 8rpx;
}

.hour-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(4, 72rpx);
  gap: 8rpx;
  min-height: calc(72rpx * 4 + 8rpx * 3);
  margin-bottom: 12rpx;
}

.hour-cell,
.minute-item {
  height: 72rpx;
  border-radius: 10rpx;
  border: 1rpx solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  text-align: center;
  color: #111827;
}

.hour-cell.empty {
  border-color: transparent;
  color: transparent;
  background: transparent;
}

.hour-cell.active,
.minute-item.active {
  background: #fef3c7;
  border-color: #d97706;
  color: #92400e;
  font-weight: 700;
}

.minute-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10rpx;
}

.minute-item.disabled {
  color: #9ca3af;
  border-color: #e5e7eb;
  background: transparent;
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