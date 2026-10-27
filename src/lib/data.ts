import type { CallSheet, ColumnDef, Contact, Project, Shot } from '../types'

export const YELLOW = '#FFD84D'

export const ASPECT_RATIOS = [
  { id: '16:9', label: '16:9 横屏', value: 16 / 9 },
  { id: '2.35:1', label: '2.35:1 宽银幕', value: 2.35 },
  { id: '4:3', label: '4:3 标准', value: 4 / 3 },
  { id: '1:1', label: '1:1 方形', value: 1 },
  { id: '9:16', label: '9:16 竖屏', value: 9 / 16 },
]

export function ratioOf(id: string) {
  return ASPECT_RATIOS.find((r) => r.id === id)?.value ?? 16 / 9
}

export const SHOT_SIZES = [
  '大远景', '远景', '全景', '中全景', '中景', '中近景', '近景', '特写', '大特写',
]

export const CAMERA_ANGLES = ['视平', '高位俯拍', '低位仰拍', '斜拍', '越肩', '鸟瞰']
export const CAMERA_MOVES = ['固定', '横摇', '俯仰', '横移', '升降', '轨道推拉', '变焦推拉', '正跟随', '倒跟随', '环绕', '滑轨横移']
export const CAMERA_RIGS = ['固定', '轨道', '手持', '稳定器', '航拍', '摇臂']
export const LENSES = ['14mm', '18mm', '24mm', '35mm', '50mm', '85mm', '100mm', '135mm']
export const SCENE_ADVICE = ['日', '夜', '晨', '昏', '室内', '室外']

export const COMMON_ROLES = ['导演', '制片', '摄影', '灯光', '美术', '录音', '场记', '场务', '演员', '化妆', '联系人']

const opt = (list: string[]) => list.map((title, id) => ({ id, title }))

export const BASE_COLUMNS: ColumnDef[] = [
  { _id: 'SHOT', title: '镜号', enTitle: 'SHOT', width: 90, minWidth: 90, show: true, isSystem: true, draggable: false, type: 'ORDER' },
  { _id: 'PICTURE', title: '画面', enTitle: 'PICTURE', width: 270, minWidth: 270, show: true, isSystem: true, draggable: true, type: 'IMAGE' },
  { _id: 'SHOTSIZE', title: '景别', enTitle: 'SHOTSIZE', width: 100, minWidth: 100, show: true, isSystem: true, draggable: true, type: 'OPTION', options: opt(SHOT_SIZES) },
  { _id: 'DURATION', title: '时长（秒）', enTitle: 'DURATION', width: 100, minWidth: 100, show: true, isSystem: true, draggable: true, type: 'NUMBER' },
  { _id: 'CONTENT', title: '内容', enTitle: 'CONTENT', width: 12.3, minWidth: 200, show: true, isSystem: true, draggable: true, type: 'TEXT', auto: true },
  { _id: 'REMARK', title: '备注', enTitle: 'REMARK', width: 12.3, minWidth: 200, show: true, isSystem: true, draggable: true, type: 'TEXT', auto: true },
  { _id: 'REFERENCE', title: '参考', enTitle: 'REFERENCE', width: 120, minWidth: 120, show: false, isSystem: false, draggable: true, type: 'TEXT' },
  { _id: 'SCENEADVICE', title: '场景预期', enTitle: 'SCENEADVICE', width: 150, minWidth: 150, show: false, isSystem: true, draggable: true, type: 'OPTION', options: opt(SCENE_ADVICE) },
  { _id: 'VOICE', title: '声音', enTitle: 'VOICE', width: 160, minWidth: 160, show: false, isSystem: true, draggable: true, type: 'TEXT' },
  { _id: 'CAMERAANGLE', title: '摄影机角度', enTitle: 'CAMERAANGLE', width: 115, minWidth: 115, show: false, isSystem: true, draggable: true, type: 'OPTION', options: opt(CAMERA_ANGLES) },
  { _id: 'CAMERAMOVE', title: '运镜', enTitle: 'CAMERAMOVE', width: 100, minWidth: 100, show: false, isSystem: true, draggable: true, type: 'OPTION', options: opt(CAMERA_MOVES) },
  { _id: 'CAMERAEQUIPMENT', title: '摄像机装备', enTitle: 'CAMERAEQUIPMENT', width: 115, minWidth: 115, show: false, isSystem: true, draggable: true, type: 'OPTION', options: opt(CAMERA_RIGS) },
  { _id: 'LENS', title: '镜头焦段', enTitle: 'LENS', width: 100, minWidth: 100, show: false, isSystem: true, draggable: true, type: 'OPTION', options: opt(LENSES) },
]

export function buildColumns(template: 'simple' | 'pro'): ColumnDef[] {
  return BASE_COLUMNS.map((c) => ({
    ...c,
    options: c.options ? c.options.map((o) => ({ ...o })) : undefined,
    show: template === 'pro' ? c.show : !c.isSystem ? false : ['SHOT', 'PICTURE', 'SHOTSIZE', 'DURATION', 'CONTENT', 'REMARK'].includes(c._id),
  }))
}

export function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`
}

export function makeShot(partial: Partial<Shot> = {}): Shot {
  return { id: uid('shot'), image: null, values: {}, planId: null, ...partial }
}

export function makeProject(name: string, template: 'simple' | 'pro', icon = '🎬'): Project {
  return {
    id: uid('poj'),
    name,
    icon,
    template,
    createdAt: new Date().toISOString(),
    deletedAt: null,
    settings: { aspectRatio: '16:9', customShotNo: false },
    columns: buildColumns(template),
    shots: [],
    plans: [],
    callSheets: [],
    members: [{ id: uid('mem'), name: '我', role: 'owner', email: '' }],
    shareToken: uid('share'),
  }
}

/* ---------- demo seed ---------- */

function sketch(kind: 'wide' | 'room' | 'close' | 'night' | 'product' | 'street') {
  const ink = '#3C4257'
  const gold = '#FFD84D'
  const shapes: Record<string, string> = {
    wide: `<rect x='0' y='150' width='480' height='120' fill='#EEF1F6'/><path d='M0 150h480' stroke='${ink}' stroke-width='2'/>
      <path d='M40 150V90h70v60M300 150V70h90v80' fill='none' stroke='${ink}' stroke-width='3'/>
      <circle cx='95' cy='70' r='15' fill='${gold}'/><path d='M120 115h40M170 100h40M230 120h35' stroke='${ink}' stroke-width='3' stroke-linecap='round'/>`,
    room: `<rect x='30' y='40' width='420' height='230' fill='#F7F8FA' stroke='${ink}' stroke-width='3'/>
      <rect x='60' y='120' width='120' height='150' fill='#E7EBF2' stroke='${ink}' stroke-width='2'/>
      <path d='M250 270v-90h80v90' fill='none' stroke='${ink}' stroke-width='3'/><circle cx='330' cy='100' r='26' fill='${gold}'/>`,
    close: `<circle cx='240' cy='140' r='85' fill='#EEF1F6' stroke='${ink}' stroke-width='3'/>
      <circle cx='210' cy='120' r='7' fill='${ink}'/><circle cx='270' cy='120' r='7' fill='${ink}'/>
      <path d='M215 175q25 20 50 0' fill='none' stroke='${ink}' stroke-width='3' stroke-linecap='round'/>`,
    night: `<rect width='480' height='280' fill='#25304A'/><circle cx='380' cy='60' r='26' fill='${gold}'/>
      <path d='M40 280V170h60v110M120 280V120h80v160M230 280V190h60v90' fill='#1B2338' stroke='#94A3B8' stroke-width='2'/>
      <circle cx='70' cy='200' r='4' fill='${gold}'/><circle cx='150' cy='150' r='4' fill='${gold}'/>`,
    product: `<rect x='120' y='60' width='240' height='170' rx='12' fill='#F7F8FA' stroke='${ink}' stroke-width='3'/>
      <path d='M150 200l60-80 40 50 30-30 50 60z' fill='#E7EBF2' stroke='${ink}' stroke-width='2'/><circle cx='300' cy='110' r='16' fill='${gold}'/>`,
    street: `<path d='M0 220h480' stroke='${ink}' stroke-width='3'/><path d='M60 220 120 90h40l-30 130M300 220l50-130h40l-40 130' fill='none' stroke='${ink}' stroke-width='3'/>
      <rect x='200' y='120' width='70' height='60' fill='#EEF1F6' stroke='${ink}' stroke-width='2'/><circle cx='240' cy='40' r='18' fill='${gold}'/>`,
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 480 280'><rect width='480' height='280' fill='#FBFBFC'/>${shapes[kind]}</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function seedState() {
  const contacts: Contact[] = [
    { id: uid('ct'), name: '林导', role: '导演', phone: '138-0000-1234', email: 'lin@example.com', company: '光年影业' },
    { id: uid('ct'), name: '陈制片', role: '制片', phone: '139-1111-5678', email: 'chen@example.com', company: '光年影业' },
    { id: uid('ct'), name: '王摄影', role: '摄影', phone: '137-2222-9012', email: 'wang@example.com', company: 'Free Lancer' },
  ]

  const project = makeProject('城市之光 · 宣传片', 'pro', '🌆')
  project.id = 'poj-demo-city'
  project.createdAt = new Date(Date.now() - 86400000 * 6).toISOString()
  project.settings.aspectRatio = '2.35:1'

  const shots: Shot[] = [
    makeShot({
      image: sketch('night'),
      values: { SHOTSIZE: '大远景', DURATION: '4', CONTENT: '城市夜景航拍，车流在街道上汇成光河，字幕淡入。', REMARK: '需要航拍许可', SCENEADVICE: '夜', VOICE: '低音弦乐铺底', CAMERAANGLE: '鸟瞰', CAMERAMOVE: '横移', CAMERAEQUIPMENT: '航拍', LENS: '24mm' },
    }),
    makeShot({
      image: sketch('street'),
      values: { SHOTSIZE: '全景', DURATION: '3', CONTENT: '主角穿过街口，霓虹招牌在身后依次亮起。', REMARK: '雨天反光板', SCENEADVICE: '夜', VOICE: '脚步声、环境车流', CAMERAANGLE: '视平', CAMERAMOVE: '正跟随', CAMERAEQUIPMENT: '稳定器', LENS: '35mm' },
    }),
    makeShot({
      image: sketch('room'),
      values: { SHOTSIZE: '中景', DURATION: '5', CONTENT: '工作室内，她把镜头装进相机，抬头望向窗外。', REMARK: '主光 45° 柔光', SCENEADVICE: '日', VOICE: '快门声', CAMERAANGLE: '视平', CAMERAMOVE: '固定', CAMERAEQUIPMENT: '固定', LENS: '50mm' },
    }),
    makeShot({
      image: sketch('close'),
      values: { SHOTSIZE: '特写', DURATION: '2', CONTENT: '眼神变化，决定按下一快门。', REMARK: '浅景深 f/1.8', SCENEADVICE: '日', VOICE: '心跳渐强', CAMERAANGLE: '越肩', CAMERAMOVE: '固定', CAMERAEQUIPMENT: '手持', LENS: '85mm' },
    }),
    makeShot({
      image: sketch('product'),
      values: { SHOTSIZE: '近景', DURATION: '4', CONTENT: '相机屏幕亮起，取景框里是整座城市。', REMARK: '产品特写', SCENEADVICE: '室内', VOICE: '电子提示音', CAMERAANGLE: '高位俯拍', CAMERAMOVE: '轨道推拉', CAMERAEQUIPMENT: '轨道', LENS: '100mm' },
    }),
    makeShot({
      image: sketch('wide'),
      values: { SHOTSIZE: '远景', DURATION: '6', CONTENT: '天色转亮，城市醒来，镜头拉远至片名。', REMARK: '日出黄金时刻', SCENEADVICE: '晨', VOICE: '音乐推向高潮', CAMERAANGLE: '低位仰拍', CAMERAMOVE: '升降', CAMERAEQUIPMENT: '摇臂', LENS: '18mm' },
    }),
  ]
  project.shots = shots

  project.plans = [
    {
      id: uid('plan'),
      title: 'Day 1 · 夜景外景',
      date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      location: '解放路步行街 / 天台',
      note: '19:00 前完成布光，注意航拍限高 120m。',
      shotIds: [shots[0].id, shots[1].id],
    },
    {
      id: uid('plan'),
      title: 'Day 2 · 内景 + 产品',
      date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
      location: '光年影业 3 号棚',
      note: '产品特写需微距镜头与电控轨道。',
      shotIds: [shots[2].id, shots[3].id, shots[4].id],
    },
  ]
  shots[0].planId = project.plans[0].id
  shots[1].planId = project.plans[0].id
  shots[2].planId = project.plans[1].id
  shots[3].planId = project.plans[1].id
  shots[4].planId = project.plans[1].id

  const callSheet: CallSheet = {
    id: uid('cs'),
    title: 'Day 1 · 夜景外景通告',
    date: project.plans[0].date,
    firstShotTime: '19:30',
    gatherTime: '17:30',
    location: '解放路步行街 A 口集合',
    weather: '晴 / 18℃ / 微风',
    notes: '1. 航拍需提前报备；2. 街头拍摄注意行人；3. 夜里降温，备外套。',
    crew: [
      { id: uid('crew'), role: '导演', name: '林导', phone: '138-0000-1234' },
      { id: uid('crew'), role: '制片', name: '陈制片', phone: '139-1111-5678' },
      { id: uid('crew'), role: '摄影', name: '王摄影', phone: '137-2222-9012' },
    ],
    planIds: [project.plans[0].id],
    createdAt: new Date().toISOString(),
  }
  project.callSheets = [callSheet]

  project.members = [
    { id: uid('mem'), name: '我', role: 'owner', email: 'me@example.com' },
    { id: uid('mem'), name: '陈制片', role: 'editor', email: 'chen@example.com' },
  ]

  const draft = makeProject('未命名短片 · 分镜草稿', 'simple', '🎞')
  draft.id = 'poj-demo-draft'
  draft.shots = [
    makeShot({ values: { SHOTSIZE: '中景', DURATION: '3', CONTENT: '开场：主角推开工作室的门。' } }),
  ]
  draft.createdAt = new Date(Date.now() - 86400000 * 2).toISOString()

  return {
    user: null,
    projects: [project, draft],
    contacts,
    columnPresets: [],
  }
}
