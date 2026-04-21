<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'

import { hydrateAuthState } from '@/utils/auth'

onLaunch(() => {
  hydrateAuthState()
})

onShow(() => {
  hydrateAuthState()
})

onHide(() => {
  console.log('App Hide')
})
</script>
<style lang="scss">
page {
  background: #f4f1e6;
}
</style>
