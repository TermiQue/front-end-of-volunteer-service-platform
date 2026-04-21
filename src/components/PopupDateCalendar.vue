<template>
  <view>
    <view class="trigger" @tap="openPopup">
      <text :class="modelValue ? 'value' : 'placeholder'">{{ modelValue || placeholder }}</text>
    </view>

    <view v-if="visible" class="mask" @tap="closePopup">
      <view class="panel" @tap.stop>
        <view class="panel-title">{{ title }}</view>

        <view class="calendar-head">
          <view class="nav-group nav-left">
            <view class="month-btn" @tap="changeYear(-1)">«</view>
            <view class="month-btn" @tap="changeMonth(-1)">‹</view>
          </view>
          <view class="month-label">{{ viewYear }}年{{ String(viewMonth + 1).padStart(2, '0') }}月</view>
          <view class="nav-group nav-right">
            <view class="month-btn" @tap="changeMonth(1)">›</view>
            <view class="month-btn" @tap="changeYear(1)">»</view>
          </view>
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

  // Keep calendar panel height stable across month switches by always rendering 6 rows.
  while (cells.length < 42) {
    const index = cells.length
    cells.push({ key: `pad-${index}`, day: null, date: '' })
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

function changeYear(offset: number) {
  const next = new Date(viewYear.value + offset, viewMonth.value, 1)
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
  margin-bottom: 18rpx;
}

.calendar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.nav-group {
  width: 152rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.nav-left {
  justify-content: flex-start;
}

.nav-right {
  justify-content: flex-end;
}

.month-btn {
  width: 72rpx;
  height: 60rpx;
  border-radius: 10rpx;
  background: #fef9c3;
  border: 1rpx solid #fde68a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #a16207;
  font-weight: 700;
}

.month-label {
  flex: 1;
  text-align: center;
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
  grid-template-rows: repeat(6, 72rpx);
  gap: 8rpx;
  min-height: calc(72rpx * 6 + 8rpx * 5);
  max-height: 520rpx;
  overflow: hidden;
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
  border-color: #facc15;
}

.day-cell.selected {
  border-color: #d97706;
  background: #fef3c7;
  color: #92400e;
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
  color: #422006;
  background: linear-gradient(135deg, #facc15 0%, #f59e0b 100%);
}

.btn-secondary {
  color: #374151;
  background: #e5e7eb;
}
</style>
