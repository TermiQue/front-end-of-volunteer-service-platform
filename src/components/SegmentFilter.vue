<template>
  <view class="segment-filter">
    <view
      v-for="option in options"
      :key="option.value"
      class="segment-option"
      :class="{ active: modelValue === option.value }"
      @tap="selectOption(option.value)"
    >
      {{ option.label }}
    </view>
  </view>
</template>

<script setup lang="ts">
type SegmentOption = {
  label: string
  value: string
}

defineProps<{
  modelValue: string
  options: SegmentOption[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}>()

const selectOption = (value: string) => {
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<style scoped lang="scss">
.segment-filter {
  display: flex;
  gap: 12rpx;
  margin-bottom: 14rpx;
}

.segment-option {
  flex: 1;
  height: 62rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.86);
  color: #4b5563;
  font-size: 20rpx;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.82);
  box-sizing: border-box;
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.96),
    0 6rpx 16rpx rgba(15, 23, 42, 0.06);
}

.segment-option.active {
  color: #2b7a78;
  border-color: #2b7a78;
  background: rgba(240, 253, 250, 0.92);
  box-shadow:
    inset 0 0 0 2rpx #2b7a78,
    inset 0 1rpx 0 rgba(255, 255, 255, 0.96),
    0 6rpx 16rpx rgba(15, 23, 42, 0.06);
}
</style>
