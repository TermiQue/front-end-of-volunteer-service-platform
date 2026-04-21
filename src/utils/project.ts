import { requestJson } from './request'

const LIST_QUERY_CACHE_TTL_MS = 10 * 1000

export type ProjectStatus = 0 | 1 | 2
export type RecordValidity = 0 | 1
export type AppealStatus = 0 | 1 | 2

export type VolunteerProjectRecord = {
  id: number
  projectId: number
  userId: number
  checkInAt: string | null
  checkOutAt: string | null
  isValid: RecordValidity
  settlementHours: number | null
  note: string | null
  projectName: string
  projectDescription: string
  startTime: string
  endTime: string
  durationHours: number
  projectStatus: ProjectStatus
  createdById: number
  responsibleId: number
  projectCreatedAt: string
  projectUpdatedAt: string
}

export type AdminProjectItem = {
  projectId: number
  name: string
  description: string
  startTime: string
  endTime: string
  durationHours: number
  status: ProjectStatus
  createdById: number
  responsibleId: number
  createdAt: string
  updatedAt: string
}

type PagedResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export type VolunteerProjectQuery = {
  projectStatus?: 1 | 2
  page?: number
  pageSize?: number
}

export type AdminProjectQuery = {
  projectId?: number
  name?: string
  startTimeFrom?: string
  startTimeTo?: string
  endTimeFrom?: string
  endTimeTo?: string
  durationHoursMin?: number
  durationHoursMax?: number
  status?: ProjectStatus
  createdById?: number
  responsibleId?: number
  createdTimeFrom?: string
  createdTimeTo?: string
  page?: number
  pageSize?: number
}

export type CreateProjectPayload = {
  name: string
  description?: string
  startTime: string
  endTime: string
  durationHours: number
  responsibleId: number
}

export type QrMode = 'checkin' | 'checkout'

export type ProjectQrInfo = {
  projectId: number
  codeType: 1 | 2
  token: string
  createdAt: string
}

export type ScanProjectResult = {
  action: 'checked_in' | 'checked_out' | 'already_checked_in' | 'already_checked_out'
  projectId: number
  participant: {
    id?: number
    project_id: number
    user_id: number
    check_in_at: string | null
    check_out_at: string | null
    is_valid: RecordValidity
    settlement_hours: string | number | null
    note: string | null
  }
}

export type CreateAppealPayload = {
  participantId: number
  time: number
  reason: string
}

export type AppealTargetType = 1 | 2

export type AppealTargetItem = {
  type: AppealTargetType
  participantId: number
  hasPendingAppeal: boolean
  project: {
    projectId: number
    name: string
    responsibleId: number
  }
  participant: {
    isValid: RecordValidity
    settlementHours: number | null
    checkInAt: string | null
    checkOutAt: string | null
    note: string | null
  }
}

export type AppealTargetQuery = {
  type?: AppealTargetType
}

export type MyAppealStatusFilter = 'all' | AppealStatus

export type MyAppealQuery = {
  status?: MyAppealStatusFilter
  page?: number
  pageSize?: number
}

export type MyAppealItem = {
  id: number
  participantId: number
  projectId: number
  projectName: string
  time: number
  reason: string
  status: AppealStatus
  applyTime: string
  reviewComment: string
  reviewTime: string
}

export type AdminAppealItem = {
  id: number
  participantId: number
  applicantId: number
  applicantName: string
  applicantStudentId: string
  expectedReviewerId: number
  expectedReviewerName: string
  projectId: number
  projectName: string
  time: number
  reason: string
  status: AppealStatus
  applyTime: string
  reviewComment: string
}

export type AdminAppealQuery = {
  status?: AppealStatus
  participantId?: number
  applicantId?: number
  expectedReviewerId?: number
  page?: number
  pageSize?: number
}

export type AdminVolunteerQuery = {
  name?: string
  studentId?: string
  volunteerHoursMin?: number
  volunteerHoursMax?: number
  projectCountMin?: number
  projectCountMax?: number
  page?: number
  pageSize?: number
}

export type AdminVolunteerListItem = {
  userId: number
  name: string
  studentId: string
  phone: string
  volunteerHours: number
  projectCount: number
  nickname: string
  role: number
  createdAt: string
  updatedAt: string
}

export type AdminVolunteerProjectItem = {
  projectId: number
  projectName: string
  projectDescription: string
  durationHours: number
  projectStatus: ProjectStatus
  isValid: RecordValidity
  settlementHours: number | null
  note: string | null
  checkInAt: string | null
  checkOutAt: string | null
}

export type AdminVolunteerDetail = {
  volunteer: AdminVolunteerListItem
  projects: AdminVolunteerProjectItem[]
}

export type AdminUserItem = {
  userId: number
  name: string
  studentId: string
  role: number
  status: number
}

type VolunteerProjectsResponse = {
  items: Array<{
    id: number
    project_id: number
    user_id: number
    check_in_at: string | null
    check_out_at: string | null
    is_valid: RecordValidity
    settlement_hours: string | number | null
    note: string | null
    project_name: string
    project_description: string
    start_time: string
    end_time: string
    duration_hours: string
    project_status: ProjectStatus
    created_by_id?: number
    created_by?: number
    responsible_id?: number
    project_created_at: string
    project_updated_at: string
  }>
  total: number
  page: number
  pageSize: number
}

type AdminProjectsResponse = {
  items: Array<{
    project_id: number
    name: string
    description: string
    start_time: string
    end_time: string
    duration_hours: string
    status: ProjectStatus
    created_by_id?: number
    created_by?: number
    responsible_id?: number
    created_at: string
    updated_at: string
  }>
  total: number
  page: number
  pageSize: number
}

type ProjectStatusResponse = {
  project: {
    project_id: number
    status: ProjectStatus
  }
}

type CreateProjectResponse = {
  project: {
    project_id: number
    name: string
    description: string
    start_time: string
    end_time: string
    duration_hours: string
    status: ProjectStatus
    created_by_id?: number
    created_by?: number
    responsible_id?: number
    created_at: string
    updated_at: string
  }
}

type QrResponse = {
  qr: {
    projectId: number
    codeType: 1 | 2
    token: string
    createdAt: string
  }
}

type AdminAppealRaw = Record<string, unknown>

type AdminAppealsResponse = {
  items: AdminAppealRaw[]
  total: number
  page: number
  pageSize: number
}

type ReviewAppealPayload = {
  reviewComment?: string
}

type AdminVolunteersResponse = {
  items: Array<{
    user_id: number
    name: string
    student_id: string
    phone: string
    volunteer_hours: string
    project_count: number
    nickname: string
    avatar_url: string
    role: number
    created_at: string
    updated_at: string
  }>
  total: number
  page: number
  pageSize: number
}

type AdminVolunteerDetailResponse = {
  volunteer: {
    user_id: number
    name: string
    student_id: string
    phone: string
    volunteer_hours: string
    project_count: number
    nickname: string
    avatar_url: string
    role: number
    created_at: string
    updated_at: string
  }
  projects: Array<{
    project_id: number
    project_name: string
    project_description: string
    duration_hours: string
    project_status: ProjectStatus
    is_valid: RecordValidity
    settlement_hours: string | number | null
    note: string | null
    check_in_at: string | null
    check_out_at: string | null
  }>
}

type AdminUsersResponse = {
  items: Array<{
    user_id: number
    name: string
    student_id: string
    role: number
    status: number
  }>
}

type AppealTargetsResponse = {
  items: Array<{
    type: number
    participantId?: number
    participant_id?: number
    hasPendingAppeal?: boolean
    has_pending_appeal?: boolean
    project?: {
      projectId?: number
      project_id?: number
      name?: string
      responsibleId?: number
      responsible_id?: number
    }
    participant?: {
      isValid?: RecordValidity
      is_valid?: RecordValidity
      settlementHours?: string | number | null
      settlement_hours?: string | number | null
      checkInAt?: string | null
      check_in_at?: string | null
      checkOutAt?: string | null
      check_out_at?: string | null
      note?: string | null
    }
  }>
}

type MyAppealsResponse = {
  items: AdminAppealRaw[]
  total: number
  page: number
  pageSize: number
}

const toNumber = (value: string | number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const toMaybeNumber = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const compactObject = <T extends Record<string, unknown>>(value: T) => {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== '')
  ) as Partial<T>
}

const toStringValue = (value: unknown, fallback = '') => {
  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number') {
    return String(value)
  }

  return fallback
}

const toIdValue = (value: unknown) => {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

const toRecordValidity = (value: unknown): RecordValidity => {
  return toIdValue(value) === 1 ? 1 : 0
}

const pickNested = (source: AdminAppealRaw, key: string) => {
  const value = source[key]
  return value && typeof value === 'object' ? (value as AdminAppealRaw) : null
}

const toVolunteerRecord = (item: VolunteerProjectsResponse['items'][number]): VolunteerProjectRecord => ({
  id: item.id,
  projectId: item.project_id,
  userId: item.user_id,
  checkInAt: item.check_in_at,
  checkOutAt: item.check_out_at,
  isValid: toRecordValidity(item.is_valid),
  settlementHours: toMaybeNumber(item.settlement_hours),
  note: item.note || null,
  projectName: item.project_name,
  projectDescription: item.project_description,
  startTime: item.start_time,
  endTime: item.end_time,
  durationHours: toNumber(item.duration_hours),
  projectStatus: item.project_status,
  createdById: item.created_by_id ?? item.created_by ?? 0,
  responsibleId: item.responsible_id ?? 0,
  projectCreatedAt: item.project_created_at,
  projectUpdatedAt: item.project_updated_at
})

const toAdminProject = (item: AdminProjectsResponse['items'][number]): AdminProjectItem => ({
  projectId: item.project_id,
  name: item.name,
  description: item.description,
  startTime: item.start_time,
  endTime: item.end_time,
  durationHours: toNumber(item.duration_hours),
  status: item.status,
  createdById: item.created_by_id ?? item.created_by ?? 0,
  responsibleId: item.responsible_id ?? 0,
  createdAt: item.created_at,
  updatedAt: item.updated_at
})

const toAdminVolunteerListItem = (item: AdminVolunteersResponse['items'][number]): AdminVolunteerListItem => ({
  userId: item.user_id,
  name: item.name,
  studentId: item.student_id,
  phone: item.phone,
  volunteerHours: toNumber(item.volunteer_hours),
  projectCount: item.project_count,
  nickname: item.nickname,
  role: item.role,
  createdAt: item.created_at,
  updatedAt: item.updated_at
})

const toAdminVolunteerProjectItem = (
  item: AdminVolunteerDetailResponse['projects'][number]
): AdminVolunteerProjectItem => ({
  projectId: item.project_id,
  projectName: item.project_name,
  projectDescription: item.project_description,
  durationHours: toNumber(item.duration_hours),
  projectStatus: item.project_status,
  isValid: toRecordValidity(item.is_valid),
  settlementHours: toMaybeNumber(item.settlement_hours),
  note: item.note || null,
  checkInAt: item.check_in_at,
  checkOutAt: item.check_out_at
})

const toAdminAppealItem = (item: AdminAppealRaw, index: number): AdminAppealItem => {
  const participant = pickNested(item, 'participant')
  const applicant = pickNested(item, 'applicant')
  const expectedReviewer = pickNested(item, 'expected_reviewer') || pickNested(item, 'expectedReviewer')
  const project = pickNested(item, 'project')

  return {
    id: toIdValue(item.id) || index + 1,
    participantId:
      toIdValue(item.participant_id) ||
      toIdValue(item.participantId) ||
      toIdValue(participant?.id) ||
      toIdValue(participant?.participant_id),
    applicantId:
      toIdValue(item.applicant_id) ||
      toIdValue(item.applicantId) ||
      toIdValue(applicant?.user_id) ||
      toIdValue(applicant?.userId),
    applicantName:
      toStringValue(item.applicant_name) ||
      toStringValue(item.applicantName) ||
      toStringValue(applicant?.name) ||
      toStringValue(applicant?.nickname) ||
      '未知申请人',
    applicantStudentId:
      toStringValue(item.applicant_student_id) ||
      toStringValue(item.applicantStudentId) ||
      toStringValue(applicant?.student_id) ||
      '-',
    expectedReviewerId:
      toIdValue(item.expected_reviewer_id) ||
      toIdValue(item.expectedReviewerId) ||
      toIdValue(expectedReviewer?.user_id) ||
      toIdValue(expectedReviewer?.userId),
    expectedReviewerName:
      toStringValue(item.expected_reviewer_name) ||
      toStringValue(item.expectedReviewerName) ||
      toStringValue(expectedReviewer?.name) ||
      toStringValue(expectedReviewer?.nickname) ||
      '-',
    projectId:
      toIdValue(item.project_id) || toIdValue(item.projectId) || toIdValue(project?.project_id) || toIdValue(project?.id),
    projectName:
      toStringValue(item.project_name) || toStringValue(item.projectName) || toStringValue(project?.name) || '-',
    time: toMaybeNumber(item.time as string | number | null | undefined) || 0,
    reason: toStringValue(item.reason) || '-',
    status: (toIdValue(item.status) as AppealStatus) || 0,
    applyTime: toStringValue(item.apply_time) || toStringValue(item.applyTime) || '',
    reviewComment:
      toStringValue(item.review_comment) ||
      toStringValue(item.reviewComment) ||
      toStringValue(item.review_opinion) ||
      '-'
  }
}

const toAdminUserItem = (item: AdminUsersResponse['items'][number]): AdminUserItem => ({
  userId: item.user_id,
  name: item.name,
  studentId: item.student_id,
  role: item.role,
  status: item.status
})

const toAppealTargetItem = (item: AppealTargetsResponse['items'][number]): AppealTargetItem => ({
  type: item.type === 1 ? 1 : 2,
  participantId: item.participantId ?? item.participant_id ?? 0,
  hasPendingAppeal: Boolean(item.hasPendingAppeal ?? item.has_pending_appeal),
  project: {
    projectId: item.project?.projectId ?? item.project?.project_id ?? 0,
    name: item.project?.name || '-',
    responsibleId: item.project?.responsibleId ?? item.project?.responsible_id ?? 0
  },
  participant: {
    isValid: (item.participant?.isValid ?? item.participant?.is_valid ?? 0) === 1 ? 1 : 0,
    settlementHours: toMaybeNumber(item.participant?.settlementHours ?? item.participant?.settlement_hours ?? null),
    checkInAt: item.participant?.checkInAt ?? item.participant?.check_in_at ?? null,
    checkOutAt: item.participant?.checkOutAt ?? item.participant?.check_out_at ?? null,
    note: item.participant?.note || null
  }
})

const toMyAppealItem = (item: AdminAppealRaw, index: number): MyAppealItem => {
  const participant = pickNested(item, 'participant')
  const project = pickNested(item, 'project')

  return {
    id: toIdValue(item.id) || index + 1,
    participantId:
      toIdValue(item.participant_id) ||
      toIdValue(item.participantId) ||
      toIdValue(participant?.id) ||
      toIdValue(participant?.participant_id),
    projectId:
      toIdValue(item.project_id) || toIdValue(item.projectId) || toIdValue(project?.project_id) || toIdValue(project?.id),
    projectName:
      toStringValue(item.project_name) || toStringValue(item.projectName) || toStringValue(project?.name) || '-',
    time: toMaybeNumber(item.time as string | number | null | undefined) || 0,
    reason: toStringValue(item.reason) || '-',
    status: (toIdValue(item.status) as AppealStatus) || 0,
    applyTime: toStringValue(item.apply_time) || toStringValue(item.applyTime) || '',
    reviewComment:
      toStringValue(item.review_comment) ||
      toStringValue(item.reviewComment) ||
      toStringValue(item.review_opinion) ||
      '-',
    reviewTime: toStringValue(item.review_time) || toStringValue(item.reviewTime) || ''
  }
}

export const projectStatusTextMap: Record<ProjectStatus, string> = {
  0: '草稿',
  1: '进行中',
  2: '已结束'
}

export const recordValidityTextMap: Record<RecordValidity, string> = {
  0: '无效',
  1: '有效'
}

export const appealStatusTextMap: Record<AppealStatus, string> = {
  0: '待审核',
  1: '已通过',
  2: '已拒绝'
}

export const formatProjectDate = (iso: string) => {
  if (!iso) {
    return '-'
  }

  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

export const fetchVolunteerProjects = async (params: VolunteerProjectQuery) => {
  const data = await requestJson<VolunteerProjectsResponse>({
    url: '/auth/projects',
    method: 'GET',
    data: compactObject(params),
    cache: {
      enabled: true,
      ttlMs: LIST_QUERY_CACHE_TTL_MS
    }
  })

  return {
    items: data.items.map(toVolunteerRecord),
    total: data.total,
    page: data.page,
    pageSize: data.pageSize
  } satisfies PagedResult<VolunteerProjectRecord>
}

export const fetchAdminProjects = async (params: AdminProjectQuery) => {
  const data = await requestJson<AdminProjectsResponse>({
    url: '/admin/projects',
    method: 'GET',
    data: compactObject(params),
    cache: {
      enabled: true,
      ttlMs: LIST_QUERY_CACHE_TTL_MS
    }
  })

  return {
    items: data.items.map(toAdminProject),
    total: data.total,
    page: data.page,
    pageSize: data.pageSize
  } satisfies PagedResult<AdminProjectItem>
}

export const createAdminProject = async (payload: CreateProjectPayload) => {
  const data = await requestJson<CreateProjectResponse>({
    url: '/admin/projects',
    method: 'POST',
    data: payload
  })

  return toAdminProject(data.project)
}

export const updateAdminProjectResponsible = async (projectId: number, responsibleId: number) => {
  return requestJson({
    url: `/admin/projects/${projectId}/responsible`,
    method: 'POST',
    data: { responsibleId }
  })
}

export const startAdminProject = async (projectId: number) => {
  const data = await requestJson<ProjectStatusResponse>({
    url: `/admin/projects/${projectId}/start`,
    method: 'POST'
  })

  return data.project
}

export const endAdminProject = async (projectId: number) => {
  const data = await requestJson<ProjectStatusResponse>({
    url: `/admin/projects/${projectId}/end`,
    method: 'POST'
  })

  return data.project
}

export const fetchProjectQr = async (projectId: number, mode: QrMode) => {
  const endpoint = mode === 'checkin' ? 'checkin' : 'checkout'
  const data = await requestJson<QrResponse>({
    url: `/admin/projects/${projectId}/qr/${endpoint}`,
    method: 'GET',
    cache: {
      enabled: true,
      ttlMs: 5 * 1000
    }
  })

  return data.qr
}

export const scanProjectQrToken = async (token: string) => {
  return requestJson<ScanProjectResult>({
    url: '/projects/scan',
    method: 'POST',
    data: {
      token
    }
  })
}

export const createAppeal = async (payload: CreateAppealPayload) => {
  return requestJson({
    url: '/appeals',
    method: 'POST',
    data: compactObject(payload)
  })
}

export const fetchAppealTargets = async (params: AppealTargetQuery = {}) => {
  const data = await requestJson<AppealTargetsResponse>({
    url: '/appeals/targets',
    method: 'GET',
    data: compactObject(params),
    cache: {
      enabled: true,
      ttlMs: LIST_QUERY_CACHE_TTL_MS
    }
  })

  return {
    items: data.items.map(toAppealTargetItem)
  }
}

export const fetchMyAppeals = async (params: MyAppealQuery = {}) => {
  const data = await requestJson<MyAppealsResponse>({
    url: '/appeals/my',
    method: 'GET',
    data: compactObject(params),
    cache: {
      enabled: true,
      ttlMs: LIST_QUERY_CACHE_TTL_MS
    }
  })

  return {
    items: data.items.map((item, index) => toMyAppealItem(item, index)),
    total: data.total,
    page: data.page,
    pageSize: data.pageSize
  } satisfies PagedResult<MyAppealItem>
}

export const fetchAdminAppeals = async (params: AdminAppealQuery) => {
  const data = await requestJson<AdminAppealsResponse>({
    url: '/admin/appeals',
    method: 'GET',
    data: compactObject(params),
    cache: {
      enabled: true,
      ttlMs: LIST_QUERY_CACHE_TTL_MS
    }
  })

  return {
    items: data.items.map((item, index) => toAdminAppealItem(item, index)),
    total: data.total,
    page: data.page,
    pageSize: data.pageSize
  } satisfies PagedResult<AdminAppealItem>
}

export const approveAdminAppeal = async (appealId: number, reviewComment: string) => {
  const payload: ReviewAppealPayload = {
    reviewComment: reviewComment.trim()
  }

  return requestJson({
    url: `/admin/appeals/${appealId}/approve`,
    method: 'POST',
    data: payload
  })
}

export const rejectAdminAppeal = async (appealId: number, reviewComment: string) => {
  return requestJson({
    url: `/admin/appeals/${appealId}/reject`,
    method: 'POST',
    data: {
      reviewComment: reviewComment.trim()
    }
  })
}

export const fetchAdminVolunteers = async (params: AdminVolunteerQuery) => {
  const data = await requestJson<AdminVolunteersResponse>({
    url: '/admin/volunteers',
    method: 'GET',
    data: compactObject(params),
    cache: {
      enabled: true,
      ttlMs: LIST_QUERY_CACHE_TTL_MS
    }
  })

  return {
    items: data.items.map(toAdminVolunteerListItem),
    total: data.total,
    page: data.page,
    pageSize: data.pageSize
  } satisfies PagedResult<AdminVolunteerListItem>
}

export const fetchAdminVolunteerDetail = async (userId: number): Promise<AdminVolunteerDetail> => {
  const data = await requestJson<AdminVolunteerDetailResponse>({
    url: `/admin/volunteers/${userId}`,
    method: 'GET'
  })

  return {
    volunteer: toAdminVolunteerListItem(data.volunteer),
    projects: data.projects.map(toAdminVolunteerProjectItem)
  }
}

export const fetchAdminUsers = async () => {
  const data = await requestJson<AdminUsersResponse>({
    url: '/admin/admins',
    method: 'GET',
    cache: {
      enabled: true,
      ttlMs: LIST_QUERY_CACHE_TTL_MS
    }
  })

  return data.items.map(toAdminUserItem)
}
