<template>
  <view>
    <background-glow />
    <text class="page-title">打卡管理</text>
    <text class="coming-soon">敬请期待...</text>
  </view>
</template>

<script setup lang="ts">  
</script>

<style scoped lang="scss">      
.page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;

  .page-title {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 20px;
    color: #333;
  }

  .coming-soon {
    font-size: 18px;
    color: #666;
  }
}  
</style>