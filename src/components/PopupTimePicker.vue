<template>
  <view>
    <view class="trigger" @tap="openPopup">
      <text :class="modelValue ? 'value' : 'placeholder'">{{ modelValue || placeholder }}</text>
    </view>

    <view v-if="visible" class="mask" @tap="closePopup">
      <view class="panel" @tap.stop>
        <view class="panel-title">{{ title }}</view>

        <view class="choice-label">小时</view>
        <scroll-view class="choice-scroll" scroll-y>
          <view class="choice-grid">
            <view
              v-for="(hour, index) in hourOptions"
              :key="`h-${hour}`"
              class="choice-item"
              :class="selectedHourIndex === index ? 'active' : ''"
              @tap="selectedHourIndex = index"
            >
              {{ hour }}
            </view>
          </view>
        </scroll-view>

        <view class="choice-label">分钟</view>
        <view class="minute-row">
          <view
            v-for="(minute, index) in minuteOptions"
            :key="`m-${minute}`"
            class="minute-item"
            :class="selectedMinuteIndex === index ? 'active' : ''"
            @tap="selectedMinuteIndex = index"
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
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    title?: string
    placeholder?: string
  }>(),
  {
    title: '选择时间',
    placeholder: '请选择时间'
  }
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const visible = ref(false)
const hourOptions = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'))
const minuteOptions = ['00', '30']
const selectedHourIndex = ref(0)
const selectedMinuteIndex = ref(0)

function parseTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match) {
    return null
  }

  const hour = Number(match[1])
  const minute = Number(match[2])

  if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour < 0 || hour > 23) {
    return null
  }

  const minuteIndex = minute >= 30 ? 1 : 0
  return [hour, minuteIndex] as [number, number]
}

function floorNowToHalfHour() {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  return [hour, minute >= 30 ? 1 : 0] as [number, number]
}

function openPopup() {
  const parsed = parseTime(props.modelValue) || floorNowToHalfHour()
  selectedHourIndex.value = parsed[0]
  selectedMinuteIndex.value = parsed[1]
  visible.value = true
}

function closePopup() {
  visible.value = false
}

function confirm() {
  const hour = hourOptions[selectedHourIndex.value] || '00'
  const minute = minuteOptions[selectedMinuteIndex.value] || '00'
  emit('update:modelValue', `${hour}:${minute}`)
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

.choice-scroll {
  width: 100%;
  max-height: 280rpx;
  margin-bottom: 12rpx;
}

.choice-label {
  font-size: 24rpx;
  color: #6b7280;
  margin-bottom: 8rpx;
}

.choice-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8rpx;
}

.choice-item {
  height: 64rpx;
  border-radius: 10rpx;
  border: 1rpx solid #fde68a;
  background: rgba(255, 255, 255, 0.86);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #92400e;
}

.choice-item.active,
.minute-item.active {
  background: #fef3c7;
  border-color: #f59e0b;
  color: #78350f;
  font-weight: 700;
}

.minute-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10rpx;
}

.minute-item {
  height: 72rpx;
  border-radius: 12rpx;
  border: 1rpx solid #fde68a;
  background: rgba(255, 255, 255, 0.86);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  color: #92400e;
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
