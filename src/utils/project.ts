import { STORAGE_KEYS } from './constants'
import { requestJson } from './request'
import { getApiUrl } from './urls'

const LIST_QUERY_CACHE_TTL_MS = 10 * 1000

export type ProjectStatus = 0 | 1 | 2
export type RecordValidity = 0 | 1
export type AppealStatus = 0 | 1 | 2

export type VolunteerProjectRecord = {
  id: number
  projectId: number
  userId: number
  actualCheckInTime: string | number | null
  actualCheckOutTime: string | number | null
  projectIsValid: RecordValidity
  settlementHours: number | null
  note: string | null
  projectName: string
  projectDescription: string
  creatorName: string
  creatorId: number
  responsibleName: string
  responsibleId: number
  projectDesignStartTime: string
  projectDesignEndTime: string
  projectStatus: ProjectStatus
}

export type AdminProjectItem = {
  projectId: number
  projectName: string
  description: string
  designStartTime: string
  designEndTime: string
  designVolunteerHours: number
  status: ProjectStatus
  creatorId: number
  creatorName: string
  responsibleId: number
  responsibleName: string
  // Legacy aliases to keep existing pages stable.
  name: string
  startTime: string
  endTime: string
  durationHours: number
  createdById: number
}

type PagedResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export type VolunteerProjectQuery = {
  projectStatus?: ProjectStatus
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
  projectName: string
  projectDescription: string
  creatorName: string
  creatorId: number
  responsibleName: string
  responsibleId: number
  projectDesignStartTime: string
  projectDesignEndTime: string
  actualCheckInTime: string | number | null
  actualCheckOutTime: string | number | null
  isValid: RecordValidity
  settlementHours: number | null
  note: string | null
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
  type: AppealTargetType
  participantId: number
  projectName: string
  expectedReviewerName: string
  actualReviewerName: string
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
    projectId?: number
    project_id?: number
    userId?: number
    user_id?: number
    projectStatus?: ProjectStatus
    project_status?: ProjectStatus
    project?: {
      projectName?: string
      project_name?: string
      projectDescription?: string
      project_description?: string
      status?: ProjectStatus
      creatorName?: string
      creator_name?: string
      creatorId?: number
      creator_id?: number
      createdById?: number
      created_by_id?: number
      responsibleName?: string
      responsible_name?: string
      responsibleId?: number
      responsible_id?: number
      projectDesignStartTime?: string
      project_design_start_time?: string
      designStartTime?: string
      design_start_time?: string
      projectDesignEndTime?: string
      project_design_end_time?: string
      designEndTime?: string
      design_end_time?: string
    }
    participant?: {
      actualCheckInTime?: string | number | null
      actual_check_in_time?: string | number | null
      checkInAt?: string | number | null
      check_in_at?: string | number | null
      actualCheckOutTime?: string | number | null
      actual_check_out_time?: string | number | null
      checkOutAt?: string | number | null
      check_out_at?: string | number | null
      projectIsValid?: RecordValidity
      project_is_valid?: RecordValidity
      isValid?: RecordValidity
      is_valid?: RecordValidity
      settlementHours?: string | number | null
      settlement_hours?: string | number | null
      note?: string | null
    }
    check_in_at?: string | number | null
    check_out_at?: string | number | null
    is_valid?: RecordValidity
    settlement_hours?: string | number | null
    note?: string | null
    project_name?: string
    project_description?: string
    start_time?: string
    end_time?: string
    created_by_id?: number
    created_by?: number
    responsible_id?: number
  }>
  total: number
  page: number
  pageSize: number
}

type AdminProjectsResponse = {
  items: Array<{
    projectId?: number
    project_id?: number
    projectName?: string
    project_name?: string
    name?: string
    description?: string
    projectDescription?: string
    designStartTime?: string
    design_start_time?: string
    startTime?: string
    start_time?: string
    designEndTime?: string
    design_end_time?: string
    endTime?: string
    end_time?: string
    designVolunteerHours?: string | number
    design_volunteer_hours?: string
    durationHours?: string | number
    duration_hours?: string
    status: ProjectStatus
    creatorId?: number
    creator_id?: number
    createdById?: number
    created_by_id?: number
    created_by?: number
    creatorName?: string
    creator_name?: string
    responsibleId?: number
    responsible_id?: number
    responsibleName?: string
    responsible_name?: string
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
    projectId?: number
    project_id: number
    projectName?: string
    project_name?: string
    name?: string
    description?: string
    projectDescription?: string
    designStartTime?: string
    design_start_time?: string
    startTime?: string
    start_time?: string
    designEndTime?: string
    design_end_time?: string
    endTime?: string
    end_time?: string
    designVolunteerHours?: string | number
    design_volunteer_hours?: string
    durationHours?: string | number
    duration_hours?: string
    status: ProjectStatus
    creatorId?: number
    creator_id?: number
    createdById?: number
    created_by_id?: number
    created_by?: number
    creatorName?: string
    creator_name?: string
    responsibleId?: number
    responsible_id?: number
    responsibleName?: string
    responsible_name?: string
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
    project?: {
      projectName?: string
      project_name?: string
      projectDescription?: string
      project_description?: string
      creatorName?: string
      creator_name?: string
      creatorId?: number
      creator_id?: number
      projectId?: number
      project_id?: number
      name?: string
      responsibleName?: string
      responsible_name?: string
      responsibleId?: number
      responsible_id?: number
      projectDesignStartTime?: string
      project_design_start_time?: string
      designStartTime?: string
      design_start_time?: string
      projectDesignEndTime?: string
      project_design_end_time?: string
      designEndTime?: string
      design_end_time?: string
    }
    participant?: {
      actualCheckInTime?: string | number | null
      actual_check_in_time?: string | number | null
      isValid?: RecordValidity
      is_valid?: RecordValidity
      settlementHours?: string | number | null
      settlement_hours?: string | number | null
      actualCheckOutTime?: string | number | null
      actual_check_out_time?: string | number | null
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
  projectId: item.projectId ?? item.project_id ?? 0,
  userId: item.userId ?? item.user_id ?? 0,
  actualCheckInTime:
    item.participant?.actualCheckInTime ??
    item.participant?.actual_check_in_time ??
    item.participant?.checkInAt ??
    item.participant?.check_in_at ??
    item.check_in_at ??
    null,
  actualCheckOutTime:
    item.participant?.actualCheckOutTime ??
    item.participant?.actual_check_out_time ??
    item.participant?.checkOutAt ??
    item.participant?.check_out_at ??
    item.check_out_at ??
    null,
  projectIsValid: toRecordValidity(
    item.participant?.projectIsValid ??
      item.participant?.project_is_valid ??
      item.participant?.isValid ??
      item.participant?.is_valid ??
      item.is_valid
  ),
  settlementHours: toMaybeNumber(item.participant?.settlementHours ?? item.participant?.settlement_hours ?? item.settlement_hours),
  note: item.participant?.note || item.note || null,
  projectName: item.project?.projectName || item.project?.project_name || item.project_name || '-',
  projectDescription:
    item.project?.projectDescription || item.project?.project_description || item.project_description || '-',
  creatorName: item.project?.creatorName || item.project?.creator_name || '-',
  creatorId:
    item.project?.creatorId ??
    item.project?.creator_id ??
    item.project?.createdById ??
    item.project?.created_by_id ??
    item.created_by_id ??
    item.created_by ??
    0,
  responsibleName: item.project?.responsibleName || item.project?.responsible_name || '-',
  responsibleId: item.project?.responsibleId ?? item.project?.responsible_id ?? item.responsible_id ?? 0,
  projectDesignStartTime:
    item.project?.projectDesignStartTime ||
    item.project?.project_design_start_time ||
    item.project?.designStartTime ||
    item.project?.design_start_time ||
    item.start_time ||
    '',
  projectDesignEndTime:
    item.project?.projectDesignEndTime ||
    item.project?.project_design_end_time ||
    item.project?.designEndTime ||
    item.project?.design_end_time ||
    item.end_time ||
    '',
  projectStatus: item.projectStatus ?? item.project_status ?? item.project?.status ?? 0
})

const toAdminProject = (item: AdminProjectsResponse['items'][number]): AdminProjectItem => ({
  projectId: item.projectId ?? item.project_id ?? 0,
  projectName: item.projectName || item.project_name || item.name || '-',
  description: item.description || item.projectDescription || '-',
  designStartTime: item.designStartTime || item.design_start_time || item.startTime || item.start_time || '',
  designEndTime: item.designEndTime || item.design_end_time || item.endTime || item.end_time || '',
  designVolunteerHours: toNumber(item.designVolunteerHours ?? item.design_volunteer_hours ?? item.durationHours ?? item.duration_hours ?? 0),
  status: item.status,
  creatorId: item.creatorId ?? item.creator_id ?? item.createdById ?? item.created_by_id ?? item.created_by ?? 0,
  creatorName: item.creatorName || item.creator_name || '-',
  responsibleId: item.responsibleId ?? item.responsible_id ?? 0,
  responsibleName: item.responsibleName || item.responsible_name || '-',
  name: item.projectName || item.project_name || item.name || '-',
  startTime: item.designStartTime || item.design_start_time || item.startTime || item.start_time || '',
  endTime: item.designEndTime || item.design_end_time || item.endTime || item.end_time || '',
  durationHours: toNumber(item.designVolunteerHours ?? item.design_volunteer_hours ?? item.durationHours ?? item.duration_hours ?? 0),
  createdById: item.creatorId ?? item.creator_id ?? item.createdById ?? item.created_by_id ?? item.created_by ?? 0
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
  projectName: item.project?.projectName || item.project?.project_name || item.project?.name || '-',
  projectDescription: item.project?.projectDescription || item.project?.project_description || '-',
  creatorName: item.project?.creatorName || item.project?.creator_name || '-',
  creatorId: item.project?.creatorId ?? item.project?.creator_id ?? 0,
  responsibleName: item.project?.responsibleName || item.project?.responsible_name || '-',
  responsibleId: item.project?.responsibleId ?? item.project?.responsible_id ?? 0,
  projectDesignStartTime:
    item.project?.projectDesignStartTime ||
    item.project?.project_design_start_time ||
    item.project?.designStartTime ||
    item.project?.design_start_time ||
    '',
  projectDesignEndTime:
    item.project?.projectDesignEndTime ||
    item.project?.project_design_end_time ||
    item.project?.designEndTime ||
    item.project?.design_end_time ||
    '',
  actualCheckInTime:
    item.participant?.actualCheckInTime ??
    item.participant?.actual_check_in_time ??
    item.participant?.checkInAt ??
    item.participant?.check_in_at ??
    null,
  actualCheckOutTime:
    item.participant?.actualCheckOutTime ??
    item.participant?.actual_check_out_time ??
    item.participant?.checkOutAt ??
    item.participant?.check_out_at ??
    null,
  isValid: (item.participant?.isValid ?? item.participant?.is_valid ?? 0) === 1 ? 1 : 0,
  settlementHours: toMaybeNumber(item.participant?.settlementHours ?? item.participant?.settlement_hours ?? null),
  note: item.participant?.note || null
})

const toMyAppealItem = (item: AdminAppealRaw, index: number): MyAppealItem => {
  const participant = pickNested(item, 'participant')
  const project = pickNested(item, 'project')
  const expectedReviewer = pickNested(item, 'expected_reviewer') || pickNested(item, 'expectedReviewer')
  const actualReviewer = pickNested(item, 'actual_reviewer') || pickNested(item, 'actualReviewer')

  return {
    id: toIdValue(item.id) || index + 1,
    type: (toIdValue(item.type) === 1 ? 1 : 2) as AppealTargetType,
    participantId:
      toIdValue(item.participant_id) ||
      toIdValue(item.participantId) ||
      toIdValue(participant?.id) ||
      toIdValue(participant?.participant_id),
    projectName:
      toStringValue(item.project_name) || toStringValue(item.projectName) || toStringValue(project?.name) || '-',
    expectedReviewerName:
      toStringValue(item.expected_reviewer_name) ||
      toStringValue(item.expectedReviewerName) ||
      toStringValue(expectedReviewer?.name) ||
      toStringValue(expectedReviewer?.nickname) ||
      '-',
    actualReviewerName:
      toStringValue(item.actual_reviewer_name) ||
      toStringValue(item.actualReviewerName) ||
      toStringValue(actualReviewer?.name) ||
      toStringValue(actualReviewer?.nickname) ||
      '-',
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

export const updateAdminVolunteerRole = async (userId: number, role: 0 | 2) => {
  const action = role === 2 ? 'promote' : 'demote'

  return requestJson({
    url: `/admin/admins/${userId}/${action}`,
    method: 'POST',
  })
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

export const exportAdminProjectParticipants = async (projectId: number) => {
  const accessToken = uni.getStorageSync(STORAGE_KEYS.ACCESS_TOKEN) || ''
  if (!accessToken) {
    throw new Error('missing access token')
  }

  const downloadUrl = getApiUrl(`/admin/projects/${projectId}/participants/export`)

  return new Promise<string>((resolve, reject) => {
    uni.downloadFile({
      url: downloadUrl,
      header: {
        Authorization: `Bearer ${accessToken}`
      },
      success: (res) => {
        if (res.statusCode < 200 || res.statusCode >= 300 || !res.tempFilePath) {
          reject(new Error(`export failed: ${res.statusCode}`))
          return
        }

        uni.saveFile({
          tempFilePath: res.tempFilePath,
          success: (saveRes) => resolve(saveRes.savedFilePath || res.tempFilePath),
          fail: () => resolve(res.tempFilePath)
        })
      },
      fail: (error) => reject(error)
    })
  })
}
