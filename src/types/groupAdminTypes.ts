import { Group, App } from '../types'
import { dict } from '../i18n'

export interface ManagedGroup extends Group {
  member_count: number
}

export interface GroupMember {
  id: number
  user_id: string
  email: string
  name: string | null
  // 兼任可能なロールフラグ(0/1)。member は全フラグ 0。
  is_group_admin: number
  is_billing_admin: number
  is_developer: number
  valid_from: number
  valid_to: number
}

export interface Assignment {
  id: number
  user_id: string
  service_id: string
  user_email: string
  user_name: string | null
  service_name: string
  facility_id: string
  structure_no: string | null
  building_use: string | null
  role_name: string
  valid_from: number
  valid_to: number
}

export interface AppPermission {
  app_id: string
  app_name: string
  source: 'user' | 'group'
  valid_from: number
  valid_to: number
  user_email: string
}

export interface GroupAdminPageProps {
  t: typeof dict.en
  userEmail: string
  siteName: string
  profileName?: string | null
  profilePicture?: string | null
  managedGroups: ManagedGroup[]
  allUsers: { id: string; email: string; name: string | null }[]
  // グループIDをキーとした各種データ
  membersByGroup: Record<string, GroupMember[]>
  assignmentsByGroup: Record<string, Assignment[]>
  permissionsByGroup: Record<string, AppPermission[]>
  // 割当作成(ゲート③)用
  grantsByGroup: Record<string, { service_id: string; service_name: string }[]>
  facilities: { id: string; structure_no: string | null; building_use: string | null; managing_group_id: string }[]
  rolesByService: Record<string, { id: number; service_id: string; facility_type: string | null; role_name: string }[]>
  // 利用枠(ゲート②)用
  grantsDetailByGroup: Record<string, { id: number; service_id: string; service_name: string; contract_id: string; seat_limit: number | null; valid_from: number; valid_to: number }[]>
  availableContracts: { id: string; service_id: string; customer_group_id: string; seat_limit: number | null; service_name: string; group_name: string | null }[]
  // 決済権者(billing_admin)か。利用枠タブの表示可否を制御する。
  isBillingAdmin: boolean
  // 各グループの直接の子グループ(管理サブツリー内)。子枠の分配先・配分済み一覧に使う。
  childrenByGroup: Record<string, { id: string; name: string }[]>
  // セルフサービス(アプリ申請 / 自グループのサービス作成)用
  servicesByGroup: Record<string, { id: string; name: string; status: string; apps: { id: string; name: string }[] }[]>
  appsByGroup: Record<string, { id: string; name: string; base_url: string; status: string }[]>
  // サービスに組み込める = 自グループの承認済み(active)アプリ
  approvedAppsByGroup: Record<string, { id: string; name: string }[]>
  devStatuses?: Record<string, { status: string; reason: string | null; admin_reason?: string | null }>
  apps: App[]
}
