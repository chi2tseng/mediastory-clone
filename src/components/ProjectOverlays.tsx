import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { RefObject } from 'react'
import type { Project } from '../types'
import { MsIcon } from './MsIcon'
import { asset } from '../lib/utils'

/* ------------------------------------------------------------------ */
/* helpers                                                            */
/* ------------------------------------------------------------------ */

function useOutsideClose(active: boolean, ref: RefObject<HTMLDivElement | null>, onClose: () => void) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    if (!active) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) closeRef.current()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [active, ref])
}

function XCircleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
      className="ms-xcircle"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* emoji picker (real headless-ui menu)                                */
/* ------------------------------------------------------------------ */

const QUICK_EMOJIS = ['😀', '👋', '🐵', '🍇', '🌍️', '🎃', '👓️', '🏧', '🏁']

const EMOJIS = [
  ['😀', '嘿嘿'],
  ['😃', '哈哈'],
  ['😄', '大笑'],
  ['😁', '嘻嘻'],
  ['😆', '斜眼笑'],
  ['😅', '苦笑'],
  ['🤣', '笑得满地打滚'],
  ['😂', '笑哭了'],
  ['🙂', '呵呵'],
  ['🙃', '倒脸'],
  ['🫠', '融化'],
  ['😉', '眨眼'],
  ['😊', '羞涩微笑'],
  ['😇', '微笑天使'],
  ['🥰', '喜笑颜开'],
  ['😍', '花痴'],
  ['🤩', '好崇拜哦'],
  ['😘', '飞吻'],
  ['😗', '亲亲'],
  ['☺️', '微笑'],
  ['😚', '羞涩亲亲'],
  ['😙', '微笑亲亲'],
  ['🥲', '含泪的笑脸'],
  ['😋', '好吃'],
  ['😛', '吐舌'],
  ['😜', '单眼吐舌'],
  ['🤪', '滑稽'],
  ['😝', '眯眼吐舌'],
  ['🤑', '发财'],
  ['🤗', '抱抱'],
  ['🤭', '不说'],
  ['🫢', '睁眼捂嘴'],
  ['🫣', '偷看'],
  ['🤫', '安静的脸'],
  ['🤔', '想一想'],
  ['🫡', '致敬'],
  ['🤐', '闭嘴'],
  ['🤨', '挑眉'],
  ['😐️', '冷漠'],
  ['😑', '无语'],
  ['😶', '沉默'],
  ['🫥', '虚线脸'],
  ['😶‍🌫️', '迷茫'],
  ['😏', '得意'],
  ['😒', '不高兴'],
  ['🙄', '翻白眼'],
  ['😬', '龇牙咧嘴'],
  ['😮‍💨', '呼气'],
  ['🤥', '说谎'],
  ['🫨', '颤抖'],
  ['🙂‍↔️', '左右摇头'],
  ['🙂‍↕️', '上下点头'],
  ['😌', '松了口气'],
  ['😔', '沉思'],
  ['😪', '困'],
  ['🤤', '流口水'],
  ['😴', '睡着了'],
  ['😷', '感冒'],
  ['🤒', '发烧'],
  ['🤕', '受伤'],
  ['🤢', '恶心'],
  ['🤮', '呕吐'],
  ['🤧', '打喷嚏'],
  ['🥵', '脸发烧'],
  ['🥶', '冷脸'],
  ['🥴', '头昏眼花'],
  ['😵', '晕头转向'],
  ['😵‍💫', '晕'],
  ['🤯', '爆炸头'],
  ['🤠', '牛仔帽脸'],
  ['🥳', '聚会笑脸'],
  ['🥸', '伪装的脸'],
  ['😎', '墨镜笑脸'],
  ['🤓', '书呆子脸'],
  ['🧐', '带单片眼镜的脸'],
  ['😕', '困扰'],
  ['🫤', '郁闷'],
  ['😟', '担心'],
  ['🙁', '微微不满'],
  ['☹️', '不满'],
  ['😮', '吃惊'],
  ['😯', '缄默'],
  ['😲', '震惊'],
  ['😳', '脸红'],
  ['🥺', '恳求的脸'],
  ['🥹', '忍住泪水'],
  ['😦', '啊'],
  ['😧', '极度痛苦'],
  ['😨', '害怕'],
  ['😰', '冷汗'],
  ['😥', '失望但如释重负'],
  ['😢', '哭'],
  ['😭', '放声大哭'],
  ['😱', '吓死了'],
  ['😖', '困惑'],
  ['😣', '痛苦'],
  ['😞', '失望'],
  ['😓', '汗'],
  ['😩', '累死了'],
  ['😫', '累'],
  ['🥱', '打呵欠'],
  ['😤', '傲慢'],
  ['😡', '怒火中烧'],
  ['😠', '生气'],
  ['🤬', '嘴上有符号的脸'],
  ['😈', '恶魔微笑'],
  ['👿', '生气的恶魔'],
  ['💀', '头骨'],
  ['☠️', '骷髅'],
  ['💩', '大便'],
  ['🤡', '小丑脸'],
  ['👹', '食人魔'],
  ['👺', '小妖精'],
  ['👻', '鬼'],
  ['👽️', '外星人'],
  ['👾', '外星怪物'],
  ['🤖', '机器人'],
  ['😺', '大笑的猫'],
  ['😸', '微笑的猫'],
  ['😹', '笑出眼泪的猫'],
  ['😻', '花痴的猫'],
  ['😼', '奸笑的猫'],
  ['😽', '亲亲猫'],
  ['🙀', '疲倦的猫'],
  ['😿', '哭泣的猫'],
  ['😾', '生气的猫'],
  ['🙈', '非礼勿视'],
  ['🙉', '非礼勿听'],
  ['🙊', '非礼勿言'],
  ['💌', '情书'],
  ['💘', '心中箭了'],
  ['💝', '系有缎带的心'],
  ['💖', '闪亮的心'],
  ['💗', '搏动的心'],
  ['💓', '心跳'],
  ['💞', '舞动的心'],
  ['💕', '两颗心'],
  ['💟', '心型装饰'],
  ['❣️', '心叹号'],
  ['💔', '心碎'],
  ['❤️‍🔥', '火上之心'],
  ['❤️‍🩹', '修复受伤的心灵'],
  ['❤️', '红心'],
  ['🩷', '粉红色的心'],
  ['🧡', '橙心'],
  ['💛', '黄心'],
  ['💚', '绿心'],
  ['💙', '蓝心'],
  ['🩵', '浅蓝色的心'],
  ['💜', '紫心'],
  ['🤎', '棕心'],
  ['🖤', '黑心'],
  ['🩶', '灰心'],
  ['🤍', '白心'],
  ['💋', '唇印'],
  ['💯', '一百分'],
  ['💢', '怒'],
  ['💥', '爆炸'],
  ['💫', '头晕'],
  ['💦', '汗滴'],
  ['💨', '尾气'],
  ['🕳️', '洞'],
  ['💬', '话语气泡'],
  ['👁️‍🗨️', '眼睛对话框'],
  ['🗨️', '朝左的话语气泡'],
  ['🗯️', '愤怒话语气泡'],
  ['💭', '内心活动气泡'],
  ['💤', '睡着'],
]

function EmojiMenu({
  onPick,
  onNone,
}: {
  onPick: (emoji: string) => void
  onNone: () => void
}) {
  return (
    <div className="ms-icon-menu" role="menu">
      <div className="ms-icon-none-wrap" role="none">
        <button type="button" className="ms-icon-none" role="menuitem" onClick={onNone}>
          <XCircleIcon />
          <span>无标志</span>
        </button>
      </div>
      <div className="ms-icon-menu-line" role="none" />
      <div className="ms-icon-quick" role="none">
        {QUICK_EMOJIS.map((emoji, i) => (
          <button
            key={`${emoji}-${i}`}
            type="button"
            className={`ms-icon-quick-btn${i === 0 ? ' is-active' : ''}`}
            role="none"
            onClick={() => onPick(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className="ms-icon-menu-line" role="none" />
      <div className="ms-icon-grid" role="none">
        {EMOJIS.map(([emoji, label]) => (
          <button
            key={`${emoji}-${label}`}
            type="button"
            className="ms-icon-grid-btn"
            aria-label={label}
            title={label}
            role="menuitem"
            onClick={() => onPick(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}

function IconSelect({ value, onChange }: { value: string; onChange: (emoji: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useOutsideClose(open, ref, () => setOpen(false))

  return (
    <div className="ms-select-host" ref={ref}>
      <button
        type="button"
        className="ms-icon-select"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="ms-icon-select-value">
          {value ? <span className="ms-icon-emoji-value">{value}</span> : <XCircleIcon />}
          <span>{value ? '已选择' : '无标志'}</span>
        </span>
        <MsIcon name="icons_xiala" size={10} />
      </button>
      {open && (
        <EmojiMenu
          onPick={(emoji) => {
            onChange(emoji)
            setOpen(false)
          }}
          onNone={() => {
            onChange('')
            setOpen(false)
          }}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* template picker                                                     */
/* ------------------------------------------------------------------ */

const TEMPLATES: Array<{
  value: 'pro' | 'simple'
  title: string
  fields: string
}> = [
  {
    value: 'pro',
    title: '专业',
    fields: '镜号 画面 参考 景别 时长（秒） 内容 备注 场景预期 声音 摄像机角度 运镜 摄像机装备 镜头焦段',
  },
  {
    value: 'simple',
    title: '简洁',
    fields: '镜号 画面 景别 时长（秒） 内容 备注',
  },
]

function TemplateSelect({
  value,
  onChange,
}: {
  value: 'simple' | 'pro'
  onChange: (value: 'simple' | 'pro') => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useOutsideClose(open, ref, () => setOpen(false))
  const current = TEMPLATES.find((t) => t.value === value) || TEMPLATES[1]

  return (
    <div className="ms-select-host" ref={ref}>
      <button
        type="button"
        className="ms-template-select"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="ms-template-current">{current.title}</span>
        <MsIcon name="icons_down" size={10} />
      </button>
      {open && (
        <div className="ms-template-menu" role="listbox">
          {TEMPLATES.map((item) => {
            const selected = item.value === value
            return (
              <button
                key={item.value}
                type="button"
                role="option"
                aria-selected={selected}
                className={`ms-template-option${selected ? ' is-selected' : ''}`}
                onClick={() => {
                  onChange(item.value)
                  setOpen(false)
                }}
              >
                <span className="ms-template-check">
                  {selected && <MsIcon name="iconyellow_selected" size={20} />}
                </span>
                <span className="ms-template-option-label">{item.title}</span>
              </button>
            )
          })}
          <button type="button" className="ms-template-option is-disabled" role="option" aria-disabled="true" disabled>
            <span className="ms-template-check" />
            <span className="ms-template-option-label">进入模板库</span>
          </button>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* create project dialog                                              */
/* ------------------------------------------------------------------ */

export function CreateProjectDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (name: string, template: 'simple' | 'pro', icon: string) => void
}) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [template, setTemplate] = useState<'simple' | 'pro'>('simple')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setName('')
    setIcon('')
    setTemplate('simple')
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  const canCreate = !!name.trim()

  return (
    <div className="ms-dialog-layer" role="presentation">
      <div className="ms-dialog-mask" onClick={onClose} />
      <div className="ms-dialog" role="dialog" aria-modal="true" aria-label="创建项目" onClick={(e) => e.stopPropagation()}>
        <div className="ms-dialog-head">
          <div className="ms-dialog-title">创建项目</div>
          <button type="button" className="ms-dialog-close" aria-label="关闭" onClick={onClose}>
            <MsIcon name="icons_pm_close_dialog" size={20} />
          </button>
        </div>
        <div className="ms-dialog-body">
          <div className="ms-dialog-label ms-dialog-label-required">项目名</div>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canCreate) onCreate(name.trim(), template, icon)
            }}
            placeholder="必填，输入项目名"
            type="text"
            className="ms-dialog-input"
          />
          <div className="ms-dialog-fields">
            <div className="ms-dialog-field">
              <div className="ms-dialog-label">项目标志</div>
              <IconSelect value={icon} onChange={setIcon} />
            </div>
            <div className="ms-dialog-field">
              <div className="ms-dialog-label">模板</div>
              <TemplateSelect value={template} onChange={setTemplate} />
            </div>
          </div>
        </div>
        <div className="ms-dialog-foot">
          <button
            type="button"
            className={`ms-button${canCreate ? ' confirm' : ' is-disabled'}`}
            disabled={!canCreate}
            onClick={() => canCreate && onCreate(name.trim(), template, icon)}
          >
            创建
          </button>
          <button type="button" className="ms-button ms-button-cancel" onClick={onClose}>
            取消
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* project more-menu                                                   */
/* ------------------------------------------------------------------ */

export function ProjectMenu({
  position,
  onClose,
  onRename,
  onDuplicate,
  onDelete,
}: {
  position: { left: number; top: number } | null
  onClose: () => void
  onRename: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useOutsideClose(!!position, ref, onClose)
  if (!position) return null

  const item = (label: string, onClick: () => void) => (
    <button
      type="button"
      className="ms-project-menu-item"
      onClick={() => {
        onClick()
        onClose()
      }}
    >
      {label}
    </button>
  )

  return createPortal(
    <div ref={ref} className="ms-project-menu" style={{ left: position.left, top: position.top }} role="menu">
      {item('修改项目名和标志', onRename)}
      <div className="ms-project-menu-line" />
      {item('复制分镜到新项目', onDuplicate)}
      <div className="ms-project-menu-line" />
      {item('移入回收站', onDelete)}
    </div>,
    document.body,
  )
}

/* ------------------------------------------------------------------ */
/* rename / edit project info dialog                                  */
/* ------------------------------------------------------------------ */

export function ProjectInfoDialog({
  project,
  onClose,
  onSave,
}: {
  project: Project | null
  onClose: () => void
  onSave: (id: string, name: string, icon: string) => void
}) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!project) return
    setName(project.name)
    setIcon(project.icon || '')
  }, [project?.id])

  useEffect(() => {
    if (!project) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [project, onClose])

  if (!project) return null

  return (
    <div className="ms-dialog-layer" role="presentation">
      <div className="ms-dialog-mask" onClick={onClose} />
      <div
        className="ms-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="修改项目名称"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ms-dialog-head">
          <div className="ms-dialog-title">修改项目名称</div>
          <button type="button" className="ms-dialog-close" aria-label="关闭" onClick={onClose}>
            <MsIcon name="icons_pm_close_dialog" size={20} />
          </button>
        </div>
        <div className="ms-dialog-body">
          <div className="ms-dialog-label ms-dialog-label-required">项目名</div>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim()) onSave(project.id, name.trim(), icon)
            }}
            placeholder="必填，输入项目名"
            type="text"
            className="ms-dialog-input"
          />
          <div className="ms-dialog-field-full">
            <div className="ms-dialog-label">项目标志</div>
            <IconSelect value={icon} onChange={setIcon} />
          </div>
        </div>
        <div className="ms-dialog-foot">
          <button
            type="button"
            className={`ms-button${name.trim() ? ' ms-button-yellow' : ' is-disabled'}`}
            disabled={!name.trim()}
            onClick={() => name.trim() && onSave(project.id, name.trim(), icon)}
          >
            确认
          </button>
          <button type="button" className="ms-button ms-button-cancel" onClick={onClose}>
            取消
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* notification drawer                                                */
/* ------------------------------------------------------------------ */

const NOTICE_TABS = [
  { key: '公告', icon: 'icona-s_msg_notice' },
  { key: '协作', icon: 'icons_msg_teamwork' },
  { key: '反馈', icon: 'icons_msg_feedback' },
]

export function NoticeDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState('协作')

  useEffect(() => {
    if (!open) return
    setTab('协作')
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="ms-drawer-root ms-drawer-root-notice">
      <div className="ms-drawer-mask" onClick={onClose} />
      <aside className="ms-drawer ms-notice-drawer" role="dialog" aria-modal="true" aria-label="消息通知">
        <div className="ms-drawer-head">
          <div className="ms-drawer-head-title-row">
            <button type="button" className="ms-drawer-close" aria-label="关闭" onClick={onClose}>
              <span className="ms-drawer-back">
                <MsIcon name="icons_drawer_back" size={30} />
              </span>
            </button>
            <div className="ms-drawer-title">消息通知</div>
          </div>
        </div>
        <div className="ms-notice-body">
          <div className="ms-notice-tabs">
            {NOTICE_TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`ms-notice-tab${tab === item.key ? ' is-active' : ''}`}
                onClick={() => setTab(item.key)}
              >
                <MsIcon name={item.icon} size={20} />
                <div className="ms-notice-tab-label">{item.key}</div>
              </button>
            ))}
          </div>
          <div className="ms-notice-main" />
        </div>
      </aside>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* trash drawer                                                       */
/* ------------------------------------------------------------------ */

function deleteDate(value: string | null) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export function TrashDrawer({
  open,
  onClose,
  projects,
  onRestore,
  onPurge,
  onClearAll,
}: {
  open: boolean
  onClose: () => void
  projects: Project[]
  onRestore: (id: string) => void
  onPurge: (id: string) => void
  onClearAll: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="ms-drawer-root ms-drawer-root-trash">
      <div className="ms-drawer-mask" onClick={onClose} />
      <aside className="ms-drawer ms-trash-drawer" role="dialog" aria-modal="true" aria-label="回收站">
        <div className="ms-drawer-head ms-trash-head">
          <div className="ms-drawer-head-title-row">
            <button type="button" className="ms-drawer-close" aria-label="关闭" onClick={onClose}>
              <span className="ms-drawer-back">
                <MsIcon name="icons_drawer_back" size={30} />
              </span>
            </button>
            <div className="ms-drawer-title">回收站</div>
          </div>
          <div className="ms-trash-extra" onClick={() => projects.length && onClearAll()}>
            全部删除
          </div>
        </div>
        <div className="ms-trash-body">
          {!projects.length ? (
            <div className="ms-trash-empty" />
          ) : (
            projects.map((p) => (
              <div key={p.id} className="ms-trash-item">
                <img className="ms-trash-thumb" src={asset('/media/folder-project.png')} alt="" draggable={false} />
                <div className="ms-trash-text">
                  <div className="ms-trash-title">{p.name}</div>
                  <div className="ms-trash-date">删除于 {deleteDate(p.deletedAt)}</div>
                </div>
                <div className="ms-trash-actions">
                  <button
                    type="button"
                    className="ms-trash-circle"
                    title="恢复"
                    aria-label="恢复"
                    onClick={() => onRestore(p.id)}
                  >
                    <MsIcon name="icons_recycle_back" size={20} />
                  </button>
                  <button
                    type="button"
                    className="ms-trash-circle"
                    title="永久删除"
                    aria-label="永久删除"
                    onClick={() => onPurge(p.id)}
                  >
                    <MsIcon name="iconicon_recycle_delete" size={20} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  )
}
