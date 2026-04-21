<template>
  <view>
    <view class="trigger" @tap="openPopup">
      <text :class="modelValue ? 'value' : 'placeholder'">{{ modelValue || placeholder }}</text>
    </view>

    <view v-if="visible" class="mask" @tap="closePopup">
      <view class="panel" @tap.stop>
        <view class="panel-title">{{ title }}</view>

        <view class="calendar-head">
          <view class="month-btn" @tap="changeMonth(-1)">上一月</view>
          <view class="month-label">{{ viewYear }}年{{ String(viewMonth + 1).padStart(2, '0') }}月</view>
          <view class="month-btn" @tap="changeMonth(1)">下一月</view>
        </view>

        <view class="week-row">
          <text v-for="week in weekLabels" :key="week" class="week-cell">{{ week }}</text>
        </view>

        <view class="day-grid">
          <view
            v-for="cell in dayCells"
            :key="cell.key"
            class="day-cell"
            :class="{
              empty: !cell.date,
              selected: !!cell.date && cell.date === selectedDate,
              today: !!cell.date && cell.date === today
            }"
            @tap="selectDay(cell.date)"
          >
            <text>{{ cell.day || '' }}</text>
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
  }>(),
  {
    title: '选择日期',
    placeholder: '请选择日期'
  }
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const weekLabels = ['日', '一', '二', '三', '四', '五', '六']

const visible = ref(false)
const today = formatDate(new Date())
const selectedDate = ref(today)
const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth())

type DayCell = {
  key: string
  day: number | null
  date: string
}

const dayCells = computed<DayCell[]>(() => {
  const firstDay = new Date(viewYear.value, viewMonth.value, 1)
  const firstWeekday = firstDay.getDay()
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()

  const cells: DayCell[] = []

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push({ key: `empty-${i}`, day: null, date: '' })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = formatDate(new Date(viewYear.value, viewMonth.value, day))
    cells.push({ key: date, day, date })
  }

  while (cells.length % 7 !== 0) {
    const index = cells.length
    cells.push({ key: `tail-${index}`, day: null, date: '' })
  }

  return cells
})

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null
  }

  const date = new Date(year, month, day)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

function openPopup() {
  const baseDate = parseDate(props.modelValue) || new Date()
  selectedDate.value = formatDate(baseDate)
  viewYear.value = baseDate.getFullYear()
  viewMonth.value = baseDate.getMonth()
  visible.value = true
}

function closePopup() {
  visible.value = false
}

function changeMonth(offset: number) {
  const next = new Date(viewYear.value, viewMonth.value + offset, 1)
  viewYear.value = next.getFullYear()
  viewMonth.value = next.getMonth()
}

function selectDay(date: string) {
  if (!date) {
    return
  }
  selectedDate.value = date
}

function confirm() {
  emit('update:modelValue', selectedDate.value)
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
  margin-bottom: 18rpx;
}

.calendar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.month-btn {
  font-size: 24rpx;
  color: #2b7a78;
  padding: 10rpx 12rpx;
}

.month-label {
  font-size: 28rpx;
  color: #111827;
  font-weight: 600;
}

.week-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 8rpx;
}

.week-cell {
  text-align: center;
  color: #6b7280;
  font-size: 22rpx;
}

.day-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8rpx;
}

.day-cell {
  height: 72rpx;
  border-radius: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid #e5e7eb;
  color: #111827;
  font-size: 24rpx;
}

.day-cell.empty {
  border-color: transparent;
  color: transparent;
}

.day-cell.today {
  border-color: #93c5fd;
}

.day-cell.selected {
  border-color: #2b7a78;
  background: rgba(43, 122, 120, 0.1);
  color: #0f766e;
  font-weight: 700;
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
  color: #ffffff;
  background: linear-gradient(135deg, #2d7b7c 0%, #3ea88f 100%);
}

.btn-secondary {
  color: #374151;
  background: #e5e7eb;
}
</style>
