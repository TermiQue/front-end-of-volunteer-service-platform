<template>
  <view>
    <view class="trigger" @tap="openPopup">
      <text :class="selectedLabel ? 'value' : 'placeholder'">{{ selectedLabel || placeholder }}</text>
    </view>

    <view v-if="visible" class="mask" @tap="closePopup">
      <view class="panel" @tap.stop>
        <view class="panel-title">{{ title }}</view>

        <view v-if="options.length" class="choice-grid">
          <view class="choice-label">负责人</view>

          <view
            v-for="option in options"
            :key="String(option.value)"
            class="choice-item"
            :class="{ active: tempValue === option.value }"
            @tap="selectOption(option.value)"
          >
            <text class="choice-text">{{ option.label }}</text>
          </view>
        </view>

        <view v-else class="empty-state">{{ emptyText }}</view>

        <view class="actions">
          <button class="btn btn-secondary" @tap="closePopup">取消</button>
          <button class="btn btn-primary" :disabled="!options.length" @tap="confirm">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

type PickerOption = {
  label: string
  value: number | string
}

const props = withDefaults(
  defineProps<{
    modelValue: number | string | null
    options: PickerOption[]
    title?: string
    placeholder?: string
    emptyText?: string
  }>(),
  {
    title: '选择负责人',
    placeholder: '请选择负责人',
    emptyText: '暂无可选负责人'
  }
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: number | string | null): void
}>()

const visible = ref(false)
const tempValue = ref<number | string | null>(null)

const selectedLabel = computed(() => {
  const selected = props.options.find((option) => option.value === props.modelValue)
  return selected?.label || ''
})

function openPopup() {
  if (!props.options.length) {
    tempValue.value = null
  } else if (props.modelValue !== null && props.options.some((option) => option.value === props.modelValue)) {
    tempValue.value = props.modelValue
  } else {
    tempValue.value = props.options[0].value
  }

  visible.value = true
}

function closePopup() {
  visible.value = false
}

function selectOption(value: number | string) {
  tempValue.value = value
}

function confirm() {
  emit('update:modelValue', tempValue.value)
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

.choice-grid {
  display: flex;
  flex-direction: column;
  max-height: 560rpx;
  overflow-y: auto;
}

.choice-grid::after {
  content: '';
  display: block;
}

.choice-item {
  height: 72rpx;
  border-radius: 10rpx;
  border: 1rpx solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20rpx;
  box-sizing: border-box;
  font-size: 28rpx;
  text-align: center;
  color: #111827;
  margin-bottom: 10rpx;
}

.choice-item.active {
  background: #fef3c7;
  border-color: #d97706;
  color: #92400e;
  font-weight: 700;
}

.choice-text {
  font-size: 28rpx;
  text-align: center;
  color: inherit;
  word-break: break-all;
  line-height: 1.3;
}

.empty-state {
  min-height: 160rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #6b7280;
  font-size: 24rpx;
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
