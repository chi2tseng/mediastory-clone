import { useEffect, useRef, useState } from 'react'
import { useStore } from '../lib/store'
import { navigate, useRoute } from '../lib/router'
import { asset, cn } from '../lib/utils'
import { Logo } from '../components/Icons'
import { HelpDot } from '../components/ui'
import { MsIcon } from '../components/MsIcon'
import { NoticeDrawer } from '../components/ProjectOverlays'
import ShareModal from '../components/ShareModal'
import type { Project } from '../types'

const TABS = [
  { key: 'make', label: '分镜制作' },
  { key: 'board', label: '故事板' },
  { key: 'plans', label: '拍摄计划' },
  { key: 'callsheet', label: '拍摄通告' },
]

export default function ProjectLayout({ project, children }: { project: Project; children: React.ReactNode }) {
  const { renameProject } = useStore()
  const route = useRoute()
  const current = route.parts[2] || 'make'
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(project.name)
  const [noticeOpen, setNoticeOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(current === 'collab')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (current === 'collab') setShareOpen(true)
  }, [current])

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  const closeShare = () => {
    setShareOpen(false)
    if (current === 'collab') navigate(`/project/${project.id}/make`)
  }

  const openExport = () => {
    const url = `${window.location.origin}${window.location.pathname}#/exportNewV2/storyboard/${project.id}`
    window.open(url, '_blank', 'noopener')
  }

  const commit = () => {
    setEditing(false)
    if (draft.trim() && draft.trim() !== project.name) renameProject(project.id, draft.trim())
    else setDraft(project.name)
  }

  return (
    <div className="ms-proj-page">
      <header className="ms-proj-header">
        <div className="ms-proj-header-inner">
          <div className="ms-proj-left">
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="ms-proj-back"
              title="返回项目列表"
              aria-label="返回项目列表"
            >
              <MsIcon name="icons_back" size={20} />
            </button>

            {editing ? (
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commit()
                  if (e.key === 'Escape') {
                    setDraft(project.name)
                    setEditing(false)
                  }
                }}
                className="ms-proj-name-input"
              />
            ) : (
              <button
                type="button"
                onDoubleClick={() => {
                  setDraft(project.name)
                  setEditing(true)
                }}
                className="ms-proj-name"
                title="双击重命名项目"
              >
                {project.name}
              </button>
            )}
          </div>

          <nav className="ms-proj-tabs" aria-label="项目页面">
            {TABS.map((t, i) => {
              const active = current === t.key
              return (
                <button
                  type="button"
                  key={t.key}
                  onClick={() => navigate(`/project/${project.id}/${t.key}`)}
                  className={cn(
                    'ms-proj-tab',
                    active ? 'is-active' : 'is-inactive',
                    active && i === 0 && 'is-first',
                  )}
                  style={active ? { zIndex: 4 } : undefined}
                >
                  <span className="ms-proj-tab-title">{t.label}</span>
                  <span className={cn('ms-proj-tab-line', !active && 'is-empty')} />
                </button>
              )
            })}
          </nav>

          <div className="ms-proj-right">
            <div className="ms-proj-avatar-wrap" title="在线协作者">
              <span className="ms-proj-avatar">
                <img src={asset('/media/avatar-default.png')} alt="" />
              </span>
            </div>
            <button
              type="button"
              className="ms-proj-icon-btn ms-proj-notice"
              title="通知"
              aria-label="通知"
              onClick={() => setNoticeOpen(true)}
            >
              <MsIcon name="icons_notice" size={24} />
            </button>
            <button type="button" className="ms-proj-icon-btn ms-proj-more" title="更多" aria-label="更多">
              <MsIcon name="icons_more" size={14} />
            </button>
            <button
              type="button"
              className="ms-proj-pill"
              onClick={() => setShareOpen(true)}
            >
              <MsIcon name="iconteamework_share" size={24} />
              <span>协作</span>
            </button>
            <button
              type="button"
              className="ms-proj-pill"
              onClick={openExport}
            >
              <MsIcon name="iconteamework_export" size={24} />
              <span>导出</span>
            </button>
          </div>
        </div>
      </header>

      <div className="ms-proj-body">{children}</div>

      <div className="ms-feedback" aria-label="反馈与订单">
        <div className="ms-feedback-inner">
          <button type="button" className="ms-feedback-circle" title="反馈与订单">
            <MsIcon name="icons_help" size={24} />
          </button>
          <div className="ms-feedback-label">反馈与订单</div>
        </div>
      </div>

      <nav className="no-print ms-mobile-tabs">
        {TABS.map((t) => {
          const active = current === t.key
          return (
            <button
              type="button"
              key={t.key}
              onClick={() => navigate(`/project/${project.id}/${t.key}`)}
              className={cn(active ? 'is-active' : '')}
            >
              {active && <span className="ms-mobile-tab-line" />}
              {t.label}
            </button>
          )
        })}
      </nav>

      <NoticeDrawer open={noticeOpen} onClose={() => setNoticeOpen(false)} />
      <ShareModal project={project} open={shareOpen} onClose={closeShare} />
    </div>
  )
}

export function ProjectTitleBlock({
  title,
  help,
  actions,
}: {
  title: string
  help?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="no-print flex flex-wrap items-center gap-3">
      <h1 className="shrink-0 text-[22px] font-bold tracking-tight">{title}</h1>
      {help && <HelpDot text={help} />}
      <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-2">{actions}</div>
    </div>
  )
}

export function BrandFooter() {
  return (
    <div className="pointer-events-none fixed right-4 bottom-3 flex items-center gap-2 text-[10.5px] text-[#c3c4cb]">
      <Logo size={14} />
      闪电分镜 · 教学克隆版
    </div>
  )
}
