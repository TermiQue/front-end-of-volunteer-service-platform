<template>
  <view class="page">
    <BackgroundGlow />
    <view class="content">
      <view class="search-bar">
        <text class="search-label">姓名搜索</text>
        <input
          class="search-input"
          v-model="searchKeyword"
          type="text"
          placeholder="请输入姓名"
          placeholder-class="search-placeholder"
        />
      </view>

      <view class="filter-bar">
        <view class="filter-group">
          <text class="filter-label">类型</text>
          <view class="filter-segment">
            <view
              class="filter-segment-item"
              :class="filterType === '' ? 'active' : ''"
              @tap="setFilterType('')"
            >
              全部
            </view>
            <view
              v-for="option in typeOptions"
              :key="option"
              class="filter-segment-item"
              :class="filterType === option ? 'active' : ''"
              @tap="setFilterType(option)"
            >
              {{ option }}
            </view>
          </view>
        </view>

        <view class="filter-group">
          <text class="filter-label">板块</text>
          <view class="filter-segment">
            <view
              class="filter-segment-item"
              :class="filterBlock === '' ? 'active' : ''"
              @tap="setFilterBlock('')"
            >
              全部
            </view>
            <view
              v-for="option in blockOptions"
              :key="option"
              class="filter-segment-item"
              :class="filterBlock === option ? 'active' : ''"
              @tap="setFilterBlock(option)"
            >
              {{ option }}
            </view>
          </view>
        </view>

        <view class="filter-group">
          <text class="filter-label">技术</text>
          <view class="filter-segment">
            <view
              class="filter-segment-item"
              :class="filterSkill === '' ? 'active' : ''"
              @tap="setFilterSkill('')"
            >
              全部
            </view>
            <view
              v-for="option in skillOptions"
              :key="option"
              class="filter-segment-item"
              :class="filterSkill === option ? 'active' : ''"
              @tap="setFilterSkill(option)"
            >
              {{ option }}
            </view>
          </view>
        </view>
      </view>

      <view class="table-wrapper">
        <view class="table-header">
          <view class="th th-name">姓名</view>
          <view class="th th-detail">详细信息</view>
        </view>

        <view v-for="item in filteredJuvenileRows" :key="item.id" class="table-row-group">
          <view class="main-row">
            <view class="td td-name">{{ item.name }}</view>
            <view class="detail-column">
              <view class="detail-row">
                <text class="label">类型：</text>
                <text class="value">{{ item.type }}</text>
              </view>
              <view class="detail-row">
                <text class="label">板块：</text>
                <text class="value">{{ item.block }}</text>
              </view>
              <view class="detail-row">
                <text class="label">技术：</text>
                <text class="value">{{ item.skill }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import BackgroundGlow from '@/components/BackgroundGlow.vue'
import { computed, ref } from 'vue'

interface JuvenileRow {
  id: number
  name: string
  type: string
  block: string
  skill: string
}

const juvenileRows = ref<JuvenileRow[]>([
  { id: 1, name: '张浩宇', type: '家庭失护型', block: '心理健康调适', skill: '意象沙游' },
  { id: 2, name: '李明', type: '不良朋辈主导型', block: '法治道德教育', skill: '正念训练营' },
  { id: 3, name: '王泽', type: '心理创伤型', block: '心理健康调适', skill: '心理剧' },
  { id: 4, name: '陈思语', type: '社会脱节型', block: '就业创业帮扶', skill: '镜像叙事' },
  { id: 5, name: '黄欣怡', type: '家庭失护型', block: '客观环境接纳', skill: '心理剧' },
  { id: 6, name: '刘飞', type: '不良朋辈主导型', block: '法治道德教育', skill: '意象沙游' },
  { id: 7, name: '杨梦', type: '心理创伤型', block: '心理健康调适', skill: '意象沙游' },
  { id: 8, name: '吴健', type: '社会脱节型', block: '就业创业帮扶', skill: '正念训练营' },
  { id: 9, name: '周杰', type: '家庭失护型', block: '心理健康调适', skill: 'OH卡牌' },
  { id: 10, name: '何玉', type: '不良朋辈主导型', block: '法治道德教育', skill: '心理剧' },
  { id: 11, name: '孙嘉怡', type: '心理创伤型', block: '客观环境接纳', skill: '正念训练营' },
  { id: 12, name: '马嘉禾', type: '社会脱节型', block: '就业创业帮扶', skill: '心理剧' },
  { id: 13, name: '朱雨桐', type: '家庭失护型', block: '客观环境接纳', skill: '意象沙游' },
  { id: 14, name: '林子航', type: '不良朋辈主导型', block: '法治道德教育', skill: '镜像叙事' },
  { id: 15, name: '徐可欣', type: '心理创伤型', block: '心理健康调适', skill: '心理剧' },
  { id: 16, name: '薛定谔', type: '社会脱节型', block: '就业创业帮扶', skill: '意象沙游' },
  { id: 17, name: '赵一宁', type: '家庭失护型', block: '法治道德教育', skill: '正念训练营' },
  { id: 18, name: '黄嘉宁', type: '不良朋辈主导型', block: '心理健康调适', skill: '意象沙游' },
  { id: 19, name: '周子墨', type: '心理创伤型', block: '客观环境接纳', skill: 'OH卡牌' },
  { id: 20, name: '吴思远', type: '社会脱节型', block: '就业创业帮扶', skill: '心理剧' },
])

const searchKeyword = ref('')
const filterType = ref('')
const filterBlock = ref('')
const filterSkill = ref('')

// 生成每个维度的所有选项
const typeOptions = computed(() => {
  const options = new Set<string>()
  juvenileRows.value.forEach((item) => options.add(item.type))
  return Array.from(options).sort()
})

const blockOptions = computed(() => {
  const options = new Set<string>()
  juvenileRows.value.forEach((item) => options.add(item.block))
  return Array.from(options).sort()
})

const skillOptions = computed(() => {
  const options = new Set<string>()
  juvenileRows.value.forEach((item) => options.add(item.skill))
  return Array.from(options).sort()
})

// 过滤逻辑：同时应用所有过滤条件
const filteredJuvenileRows = computed(() => {
  const keyword = searchKeyword.value.trim()
  return juvenileRows.value.filter((item) => {
    // 姓名筛选
    const matchesName = !keyword || item.name.includes(keyword)
    
    // 类型筛选
    const matchesType = !filterType.value || item.type === filterType.value
    
    // 板块筛选
    const matchesBlock = !filterBlock.value || item.block === filterBlock.value
    
    // 技术筛选
    const matchesSkill = !filterSkill.value || item.skill === filterSkill.value

    return matchesName && matchesType && matchesBlock && matchesSkill
  })
})

const setFilterType = (value: string) => {
  filterType.value = value
}

const setFilterBlock = (value: string) => {
  filterBlock.value = value
}

const setFilterSkill = (value: string) => {
  filterSkill.value = value
}
</script>

<style scoped lang="scss">
.page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(245, 224, 157, 0.55), transparent 34%),
    radial-gradient(circle at bottom right, rgba(92, 119, 255, 0.12), transparent 32%),
    linear-gradient(180deg, #f7f6ef 0%, #f4f1e6 100%);
}

.content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  padding: 40rpx 30rpx calc(200rpx + env(safe-area-inset-bottom));
}

.search-bar {
  margin-bottom: 20rpx;
  padding: 22rpx 24rpx;
  background: rgba(255, 255, 255, 0.84);
  border: 1rpx solid rgba(255, 255, 255, 0.72);
  border-radius: 22rpx;
  box-shadow: 0 14rpx 34rpx rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.search-label {
  flex-shrink: 0;
  font-size: 28rpx;
  font-weight: 700;
  color: #2b7a78;
}

.search-input {
  flex: 1;
  height: 72rpx;
  padding: 0 20rpx;
  border-radius: 16rpx;
  background: rgba(248, 250, 252, 0.96);
  font-size: 26rpx;
  color: #111827;
  box-sizing: border-box;
}

.search-placeholder {
  color: #9ca3af;
}

.filter-bar {
  margin-bottom: 20rpx;
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.84);
  border: 1rpx solid rgba(255, 255, 255, 0.72);
  border-radius: 22rpx;
  box-shadow: 0 14rpx 34rpx rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.filter-label {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #333;
}

.filter-segment {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
}

.filter-segment-item {
  flex: 0 0 auto;
  min-width: 80rpx;
  height: 60rpx;
  border-radius: 12rpx;
  background: rgba(248, 250, 252, 0.96);
  border: 1rpx solid #d7dde3;
  color: #4b5563;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 500;
  padding: 0 16rpx;
}

.filter-segment-item.active {
  color: #ffffff;
  border-color: transparent;
  background: linear-gradient(135deg, #6366f1 0%, #5f60e7 100%);
}

.table-wrapper {
  background: rgba(255, 255, 255, 0.7);
  border-radius: 16rpx;
  overflow: hidden;
  border: 2rpx solid rgba(200, 200, 200, 0.2);
  backdrop-filter: blur(10px);
}

.table-header {
  display: flex;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(121, 200, 157, 0.08) 100%);
  border-bottom: 2rpx solid rgba(200, 200, 200, 0.2);
  font-weight: 600;
}

.th {
  padding: 24rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  text-align: center;
}

.th-name {
  flex: 0 0 20%;
  border-right: 1rpx solid rgba(200, 200, 200, 0.15);
}

.th-detail {
  flex: 1;
  text-align: center;
}

.table-row-group {
  display: flex;
  border-bottom: 1rpx solid rgba(200, 200, 200, 0.15);

  &:last-child {
    border-bottom: none;
  }

  &:nth-child(odd) {
    background: rgba(249, 250, 251, 0.5);
  }

  &:hover {
    background: rgba(99, 102, 241, 0.05);
  }
}

.main-row {
  display: flex;
  flex: 1;
}

.td-name {
  flex: 0 0 20%;
  padding: 24rpx;
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1rpx solid rgba(200, 200, 200, 0.15);
  min-height: 144rpx;
}

.detail-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.detail-row {
  flex: 1;
  padding: 20rpx 24rpx;
  font-size: 26rpx;
  display: flex;
  align-items: center;
  border-bottom: 1rpx solid rgba(200, 200, 200, 0.1);

  &:last-child {
    border-bottom: none;
  }

  .label {
    color: #999;
    margin-right: 12rpx;
    flex: 0 0 auto;
    font-size: 24rpx;
  }

  .value {
    color: #555;
    flex: 1;
  }
}
</style>
