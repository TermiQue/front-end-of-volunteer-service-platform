import { computed } from 'vue'

import { currentAvatar, currentNickname, currentProfile } from '@/utils/auth'

type UseUserInfoOptions = {
  fallbackName: string
}

export const useUserInfo = (options: UseUserInfoOptions) => {
  return computed(() => ({
    avatar: currentAvatar.value || '/default_avatar.svg',
    name: currentProfile.value?.name || currentNickname.value || options.fallbackName,
    studentId: currentProfile.value?.student_id || '未完善',
    duration: currentProfile.value?.volunteer_hours || '0.00小时',
    project: String(currentProfile.value?.project_count || 0) + '项'
  }))
}
