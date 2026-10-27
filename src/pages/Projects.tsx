import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../lib/store'
import { navigate } from '../lib/router'
import { asset } from '../lib/utils'
import { MsIcon } from '../components/MsIcon'
import SideRail from '../components/SideRail'
import { Confirm, EmptyState } from '../components/ui'
import {
  CreateProjectDialog,
  NoticeDrawer,
  ProjectInfoDialog,
  ProjectMenu,
  TrashDrawer,
} from '../components/ProjectOverlays'

type SortKey = 'custom' | 'created' | 'modified'
type SortDir = 'asc' | 'desc'

function projectDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export default function Projects() {
  const {
    state,
    createProject,
    updateProject,
    softDeleteProject,
    restoreProject,
    purgeProject,
    duplicateProject,
    toast,
  } = useStore()
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<SortKey>('custom')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)
  const [creating, setCreating] = useState(false)
  const [noticeOpen, setNoticeOpen] = useState(false)
  const [trashOpen, setTrashOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [menuFor, setMenuFor] = useState<{ id: string; left: number; top: number } | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [purging, setPurging] = useState<string | null>(null)
  const [clearingTrash, setClearingTrash] = useState(false)

  const active = useMemo(() => state.projects.filter((p) => !p.deletedAt), [state.projects])
  const trashed = state.projects.filter((p) => p.deletedAt)
  const editingProject = editing ? active.find((p) => p.id === editing) || null : null
  const menuProject = menuFor ? active.find((p) => p.id === menuFor.id) || null : null

  useEffect(() => {
    if (!sortOpen) return
    const onDown = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSortOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [sortOpen])

  const list = useMemo(() => {
    let items = active.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()))
    if (sort !== 'custom') {
      items = [...items].sort((a, b) => {
        const av = +new Date(a.createdAt)
        const bv = +new Date(b.createdAt)
        return sortDir === 'asc' ? av - bv : bv - av
      })
    }
    return items
  }, [active, q, sort, sortDir])

  const submitCreate = (name: string, template: 'simple' | 'pro', icon: string) => {
    const p = createProject(name, template, icon)
    setCreating(false)
    toast('项目已创建', 'success')
    navigate(`/project/${p.id}/make`)
  }

  const saveProjectInfo = (id: string, name: string, icon: string) => {
    updateProject(id, (p) => ({ ...p, name, icon }))
    setEditing(null)
    toast('项目信息已更新', 'success')
  }

  const sortLabel = sort === 'custom' ? '自定义' : sort === 'created' ? '创建时间' : '修改时间'

  return (
    <div className="ms-app">
      <SideRail />

      <main className="ms-main" onScroll={() => {
        setMenuFor(null)
        setSortOpen(false)
      }}>
        <header className="ms-main-header">
          <div className="ms-main-heading">
            <h1 className="ms-main-title">我的项目</h1>
          </div>

          <div className="ms-main-actions">
            <div className="ms-search">
              <MsIcon name="icons_search_mini" size={24} style={{ color: '#24252C' }} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="搜索项目名…"
                className="ms-search-input"
              />
              <button
                className={`ms-search-clear${q ? ' is-visible' : ''}`}
                onClick={() => setQ('')}
                type="button"
                aria-label="清空搜索"
              >
                <MsIcon name="icons_search_clear" size={12} />
              </button>
            </div>

            <button type="button" className="ms-template-pill" onClick={() => navigate('/templates')}>
              <MsIcon name="icons_template_entrance" size={24} />
              <span>模板</span>
            </button>

            <button
              type="button"
              className="ms-notice-btn"
              onClick={() => setNoticeOpen(true)}
              aria-label="通知"
            >
              <MsIcon name="icons_notice" size={24} />
            </button>

            <button
              type="button"
              className="ms-upgrade-btn"
              style={{ backgroundImage: `url(${asset('/media/vip-bg.gif')})` }}
              onClick={() => toast('升级专业版（教学复刻版已解锁全部功能）')}
              aria-label="升级专业版"
            >
              <img src={asset('/media/vip-before.png')} alt="" draggable={false} />
            </button>
          </div>
        </header>

        <div className="ms-sort-row">
          <span className="ms-sort-label">排序</span>
          <div className="ms-sort-wrap" ref={sortRef}>
            <button
              type="button"
              className="ms-sort-value"
              aria-haspopup="menu"
              aria-expanded={sortOpen}
              onClick={() => setSortOpen((v) => !v)}
            >
              {sortLabel}
            </button>
            {sortOpen && (
              <div className="ms-sort-pop" role="menu">
                <div
                  className="ms-sort-item"
                  role="menuitem"
                  onClick={() => setSort('created')}
                >
                  <div className="ms-sort-hbox">
                    <MsIcon
                      name="icons_selected30"
                      size={30}
                      className={sort === 'created' ? '' : 'is-invisible'}
                    />
                    <span className="ms-sort-text">创建时间</span>
                  </div>
                </div>
                <div
                  className="ms-sort-item"
                  role="menuitem"
                  onClick={() => setSort('modified')}
                >
                  <div className="ms-sort-hbox">
                    <MsIcon
                      name="icons_selected30"
                      size={30}
                      className={sort === 'modified' ? '' : 'is-invisible'}
                    />
                    <span className="ms-sort-text">修改时间</span>
                  </div>
                </div>
                <div className="ms-sort-line" role="separator" />
                <div
                  className="ms-sort-item"
                  role="menuitem"
                  onClick={() => setSortDir('asc')}
                >
                  <div className="ms-sort-hbox">
                    <MsIcon
                      name="icons_selected30"
                      size={30}
                      className={sortDir === 'asc' ? '' : 'is-invisible'}
                    />
                    <span className="ms-sort-text">从早到晚</span>
                  </div>
                </div>
                <div
                  className="ms-sort-item"
                  role="menuitem"
                  onClick={() => setSortDir('desc')}
                >
                  <div className="ms-sort-hbox">
                    <MsIcon
                      name="icons_selected30"
                      size={30}
                      className={sortDir === 'desc' ? '' : 'is-invisible'}
                    />
                    <span className="ms-sort-text">从晚到早</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="ms-project-grid">
          <div className="ms-project-cell">
            <button type="button" className="ms-create-tile" onClick={() => setCreating(true)}>
              <img className="ms-folder-image" src={asset('/media/folder-create.png')} alt="创建新项目" draggable={false} />
              <div className="ms-create-label">创建新项目 / 组</div>
            </button>
          </div>

          {list.map((p) => (
            <div className="ms-project-cell" key={p.id}>
              <div className="ms-project-slot">
                <div
                  className="ms-project-tile"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/project/${p.id}/make`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') navigate(`/project/${p.id}/make`)
                  }}
                >
                  <div className="ms-project-folder">
                    <img className="ms-folder-image" src={asset('/media/folder-project.png')} alt="" draggable={false} />
                  </div>
                  <div className="ms-project-name">{p.name}</div>
                  <div className="ms-project-footer">
                    <div className="ms-project-date">创建 <span>{projectDate(p.createdAt)}</span></div>
                    <div className="ms-project-more" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="ms-project-more-btn"
                        aria-label="更多操作"
                        aria-haspopup="menu"
                        onClick={(e) => {
                          e.stopPropagation()
                          const r = e.currentTarget.getBoundingClientRect()
                          setMenuFor((current) =>
                            current && current.id === p.id
                              ? null
                              : { id: p.id, left: Math.floor(r.left), top: Math.round(r.bottom + 3.16) },
                          )
                        }}
                      >
                        <MsIcon name="icons_more" size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!list.length && (
          <div className="ms-projects-empty">
            <EmptyState
              icon="search"
              title={q ? '没有匹配的项目' : '还没有项目'}
              desc={q ? '换个关键词试试' : '点击左上角「创建新项目 / 组」开始你的第一份分镜'}
              action={
                !q && (
                  <button className="btn btn-primary" onClick={() => setCreating(true)}>
                    创建项目
                  </button>
                )
              }
            />
          </div>
        )}
      </main>

      {/* floating trash + feedback */}
      <button type="button" className="ms-float ms-float-trash" onClick={() => setTrashOpen(true)}>
        <span className="ms-float-circle">
          <MsIcon name="icons_trash" size={24} />
        </span>
        <span className="ms-float-label">回收站</span>
      </button>

      <button type="button" className="ms-float ms-float-feedback" onClick={() => toast('反馈与订单为演示占位')}>
        <span className="ms-float-circle">
          <MsIcon name="icons_help" size={24} />
        </span>
        <span className="ms-float-label">反馈与订单</span>
      </button>

      <CreateProjectDialog open={creating} onClose={() => setCreating(false)} onCreate={submitCreate} />

      <ProjectInfoDialog project={editingProject} onClose={() => setEditing(null)} onSave={saveProjectInfo} />

      <ProjectMenu
        position={menuFor}
        onClose={() => setMenuFor(null)}
        onRename={() => {
          if (menuProject) setEditing(menuProject.id)
        }}
        onDuplicate={() => {
          if (!menuProject) return
          duplicateProject(menuProject.id)
          toast('已复制项目', 'success')
        }}
        onDelete={() => {
          if (menuProject) setDeleting(menuProject.id)
        }}
      />

      <NoticeDrawer open={noticeOpen} onClose={() => setNoticeOpen(false)} />

      <TrashDrawer
        open={trashOpen}
        onClose={() => setTrashOpen(false)}
        projects={trashed}
        onRestore={(id) => {
          restoreProject(id)
          toast('已恢复', 'success')
        }}
        onPurge={(id) => setPurging(id)}
        onClearAll={() => setClearingTrash(true)}
      />

      <Confirm
        open={!!deleting}
        title="移入回收站"
        desc="项目会保留在回收站中，你可以随时恢复。"
        confirmText="移入回收站"
        danger
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) softDeleteProject(deleting)
          setDeleting(null)
        }}
      />

      <Confirm
        open={!!purging}
        title="永久删除项目"
        desc="删除后无法恢复，项目内的分镜、计划与拍摄通告都会一并清除。"
        confirmText="永久删除"
        danger
        onCancel={() => setPurging(null)}
        onConfirm={() => {
          if (purging) {
            purgeProject(purging)
            toast('已永久删除')
          }
          setPurging(null)
        }}
      />

      <Confirm
        open={clearingTrash}
        title="清空回收站"
        desc="回收站中的所有项目都会被永久删除，且无法恢复。"
        confirmText="全部删除"
        danger
        onCancel={() => setClearingTrash(false)}
        onConfirm={() => {
          trashed.forEach((p) => purgeProject(p.id))
          setClearingTrash(false)
          toast('回收站已清空')
        }}
      />
    </div>
  )
}
