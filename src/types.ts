export type ColumnType = 'ORDER' | 'IMAGE' | 'OPTION' | 'NUMBER' | 'TEXT'

export interface Option {
  id: number
  title: string
}

export interface ColumnDef {
  _id: string
  title: string
  enTitle: string
  width: number
  minWidth: number
  show: boolean
  isSystem: boolean
  draggable: boolean
  type: ColumnType
  options?: Option[]
  /** flexible columns stretch to fill remaining space */
  auto?: boolean
}

export interface Shot {
  id: string
  image: string | null
  values: Record<string, string>
  planId: string | null
}

export interface ShotPlan {
  id: string
  title: string
  date: string
  location: string
  note: string
  shotIds: string[]
}

export interface CrewRow {
  id: string
  role: string
  name: string
  phone: string
}

export interface CallSheet {
  id: string
  title: string
  date: string
  firstShotTime: string
  gatherTime: string
  location: string
  weather: string
  notes: string
  crew: CrewRow[]
  planIds: string[]
  createdAt: string
}

export interface Contact {
  id: string
  name: string
  role: string
  phone: string
  email: string
  company: string
}

export interface Member {
  id: string
  name: string
  role: 'owner' | 'editor' | 'viewer'
  email: string
}

export interface ProjectSettings {
  aspectRatio: string
  customShotNo: boolean
}

export interface Project {
  id: string
  name: string
  icon: string
  template: 'simple' | 'pro'
  createdAt: string
  deletedAt: string | null
  settings: ProjectSettings
  columns: ColumnDef[]
  shots: Shot[]
  plans: ShotPlan[]
  callSheets: CallSheet[]
  members: Member[]
  shareToken: string
}

export interface User {
  name: string
  phone: string
  avatar?: string
}

export interface AppState {
  user: User | null
  projects: Project[]
  contacts: Contact[]
  columnPresets: { id: string; name: string; columns: ColumnDef[] }[]
}
