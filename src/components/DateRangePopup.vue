<template>
  <view v-if="visible" class="date-range-mask" @tap="closePopup">
    <view class="date-range-panel" @tap.stop>
      <view class="panel-title">{{ label }}</view>
      <view class="range-title">{{ rangeText }}</view>

      <view class="calendar-head">
        <view class="nav-group nav-left">
          <view class="month-btn" @tap="changeYear(-1)">«</view>
          <view class="month-btn" @tap="changeMonth(-1)">‹</view>
        </view>
        <view class="month-label">{{ monthLabel }}</view>
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
            selected: isDateEndpoint(cell.date),
            ranged: isDateInRange(cell.date),
            today: !!cell.date && cell.date === today
          }"
          @tap="toggleDay(cell.date)"
        >
          <text>{{ cell.day || '' }}</text>
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

const DEFAULT_RANGE_START = '2024-01-01'

const props = withDefaults(
  defineProps<{
    visible: boolean
    start: string
    end: string
    label?: string
  }>(),
  {
    label: '日期范围'
  }
)

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'update:start', value: string): void
  (e: 'update:end', value: string): void
  (e: 'confirm', value: { start: string; end: string }): void
  (e: 'clear'): void
}>()

type DayCell = {
  key: string
  day: number | null
  date: string
}

const weekLabels = ['日', '一', '二', '三', '四', '五', '六']
const today = formatDate(new Date())
const selectedDates = ref<string[]>([])
const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth())

const monthLabel = computed(() => `${viewYear.value}年${String(viewMonth.value + 1).padStart(2, '0')}月`)
const dayCells = computed(() => buildDayCells(viewYear.value, viewMonth.value))
const rangeBounds = computed(() => {
  if (selectedDates.value.length === 0) {
    return { start: '', end: '' }
  }

  if (selectedDates.value.length === 1) {
    return {
      start: DEFAULT_RANGE_START,
      end: selectedDates.value[0]
    }
  }

  const [first, second] = selectedDates.value
  return first <= second
    ? { start: first, end: second }
    : { start: second, end: first }
})

const rangeText = computed(() => {
  if (!rangeBounds.value.start || !rangeBounds.value.end) {
    return '请选择日期'
  }

  return `${rangeBounds.value.start} - ${rangeBounds.value.end}`
})

watch(
  () => props.visible,
  (visible) => {
    if (!visible) {
      return
    }

    selectedDates.value = normalizeSelectedDates(props.start, props.end)
    const baseDate = parseDate(selectedDates.value[0] || props.end || props.start) || new Date()
    viewYear.value = baseDate.getFullYear()
    viewMonth.value = baseDate.getMonth()
  }
)

function normalizeSelectedDates(start: string, end: string) {
  if (start === DEFAULT_RANGE_START && end) {
    return [end]
  }

  return [start, end].filter((date) => Boolean(parseDate(date))).slice(0, 2)
}

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

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? null : date
}

function buildDayCells(year: number, month: number) {
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: DayCell[] = []

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push({ key: `empty-${index}`, day: null, date: '' })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = formatDate(new Date(year, month, day))
    cells.push({ key: date, day, date })
  }

  while (cells.length % 7 !== 0) {
    cells.push({ key: `tail-${cells.length}`, day: null, date: '' })
  }

  while (cells.length < 42) {
    cells.push({ key: `pad-${cells.length}`, day: null, date: '' })
  }

  return cells
}

const closePopup = () => {
  emit('update:visible', false)
}

const changeMonth = (offset: number) => {
  const next = new Date(viewYear.value, viewMonth.value + offset, 1)
  viewYear.value = next.getFullYear()
  viewMonth.value = next.getMonth()
}

const changeYear = (offset: number) => {
  viewYear.value += offset
}

const toggleDay = (date: string) => {
  if (!date) {
    return
  }

  if (selectedDates.value.includes(date)) {
    selectedDates.value = selectedDates.value.filter((item) => item !== date)
    return
  }

  selectedDates.value = [...selectedDates.value, date].slice(-2)
}

const isDateEndpoint = (date: string) => {
  if (!date) {
    return false
  }

  return selectedDates.value.includes(date) || (selectedDates.value.length === 1 && date === DEFAULT_RANGE_START)
}

const isDateInRange = (date: string) => {
  if (!date || isDateEndpoint(date) || !rangeBounds.value.start || !rangeBounds.value.end) {
    return false
  }

  return date > rangeBounds.value.start && date < rangeBounds.value.end
}

const clearAndClose = () => {
  selectedDates.value = []
  emit('update:start', '')
  emit('update:end', '')
  emit('clear')
  closePopup()
}

const confirm = () => {
  emit('update:start', rangeBounds.value.start)
  emit('update:end', rangeBounds.value.end)
  emit('confirm', rangeBounds.value)
  closePopup()
}
</script>

<style scoped lang="scss">
.date-range-mask {
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

.date-range-panel {
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
  font-size: 28rpx;
  line-height: 60rpx;
  text-align: center;
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
  overflow: visible;
}

.day-cell {
  position: relative;
  z-index: 1;
  height: 72rpx;
  border-radius: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid #e5e7eb;
  color: #111827;
  font-size: 28rpx;
  text-align: center;
  box-sizing: border-box;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease;
}

.day-cell text {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  text-align: center;
}

.day-cell.empty {
  border-color: transparent;
  color: transparent;
}

.day-cell.today {
  border-color: #facc15;
}

.day-cell.ranged {
  border-color: rgba(43, 122, 120, 0.28);
  background: rgba(240, 253, 250, 0.58);
  color: #2b7a78;
}

.day-cell.selected {
  z-index: 4;
  border: 3rpx solid #2b7a78;
  background: rgba(240, 253, 250, 0.92);
  color: #2b7a78;
  font-weight: 700;
  transform: scale(1.18);
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
