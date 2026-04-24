<template>
  <view class="filter-input-card" :class="{ active: hasValue }">
    <text class="filter-label">{{ label }}</text>
    <input
      class="filter-input"
      :value="modelValue"
      type="text"
      :placeholder="placeholder"
      placeholder-class="filter-placeholder"
      @input="handleInput"
    />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: string
  label: string
  placeholder: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}>()

const hasValue = computed(() => props.modelValue.trim().length > 0)

const handleInput = (event: Event) => {
  const value = (event as Event & { detail?: { value?: string } }).detail?.value || ''
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<style scoped lang="scss">
.filter-input-card {
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

.filter-input-card.active {
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

.filter-input {
  flex: 1;
  min-width: 0;
  min-height: 42rpx;
  width: auto;
  box-sizing: border-box;
  padding: 0 8rpx;
  font-size: 22rpx;
  color: #111827;
  font-weight: 500;
}

.filter-placeholder {
  color: #9ca3af;
}
</style>
