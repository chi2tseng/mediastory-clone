import { useMemo, useState } from 'react'
import { useStore } from '../../lib/store'
import type { Project, Shot, ShotPlan } from '../../types'
import { asset, cn } from '../../lib/utils'
import { MsIcon } from '../../components/MsIcon'

type PlanDraft = { title: string; date: string; location: string; note: string }

const EMPTY_DRAFT: PlanDraft = {
  title: '',
  date: new Date().toISOString().slice(0, 10),
  location: '',
  note: '',
}

export default function Plans({ project }: { project: Project }) {
  const { addPlan, updatePlan, deletePlan, assignShots, toast } = useStore()
  const [showTip, setShowTip] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showThumbs, setShowThumbs] = useState(true)
  const [showInfo, setShowInfo] = useState(true)
  const [selected, setSelected] = useState<string[]>([])
  const [dragOver, setDragOver] = useState<string | 'unplanned' | null>(null)
  const [creating, setCreating] = useState(false)
  const [editingPlan, setEditingPlan] = useState<ShotPlan | null>(null)
  const [draft, setDraft] = useState<PlanDraft>(EMPTY_DRAFT)
  const [removing, setRemoving] = useState<ShotPlan | null>(null)
  const [menuFor, setMenuFor] = useState<string | null>(null)

  const unplanned = useMemo(() => project.shots.filter((s) => !s.planId), [project.shots])
  const shotsFor = (planId: string) => project.shots.filter((s) => s.planId === planId)

  const openCreate = () => {
    setEditingPlan(null)
    setDraft({ ...EMPTY_DRAFT, title: `拍摄计划 ${project.plans.length + 1}` })
    setCreating(true)
  }

  const openEdit = (plan: ShotPlan) => {
    setEditingPlan(plan)
    setDraft({ title: plan.title, date: plan.date, location: plan.location, note: plan.note })
    setCreating(true)
    setMenuFor(null)
  }

  const saveDraft = () => {
    if (!draft.title.trim()) return toast('请输入计划名称')
    if (editingPlan) {
      updatePlan(project.id, editingPlan.id, { ...draft, title: draft.title.trim() })
      toast('计划已更新', 'success')
    } else {
      addPlan(project.id, { ...draft, title: draft.title.trim() })
      toast('计划已创建', 'success')
    }
    setCreating(false)
  }

  const toggleSelect = (id: string) => {
    setSelected((arr) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]))
  }

  const dropTo = (planId: string | null) => {
    const raw = window.__msDragShot
    const ids = raw ? [raw] : selected
    if (!ids.length) return
    assignShots(project.id, planId, ids)
    setSelected([])
    setDragOver(null)
    window.__msDragShot = null
    toast(planId ? '镜头已放入计划' : '镜头已移出计划', 'success')
  }

  return (
    <div className="ms-plans-page">
      <div className="ms-plans-head">
        <div className="ms-plans-headleft">
          <div className="ms-plans-titlewrap">
            <h1 className="ms-plans-title">制定拍摄计划</h1>
            <span className="ms-plans-help" title="把分镜按场次或拍摄日分组，方便现场执行。">
              <MsIcon name="icons_questionmark" size={14} />
            </span>
          </div>

          <div className="ms-plans-newbtn-wrap">
            <button type="button" className="ms-plans-newbtn" onClick={openCreate}>
              <MsIcon name="icons_create" size={14} />
              <span>新建拍摄计划</span>
            </button>
            {showTip && (
              <div className="ms-plans-tip" role="status">
                <span className="ms-plans-tip-arrow" />
                <p>新建一个计划，把未规划的镜头拖到计划里</p>
                <button type="button" className="ms-plans-tip-close" aria-label="关闭提示" onClick={() => setShowTip(false)}>
                  <img src={asset('/media/plans-close.png')} alt="" width={20} height={20} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="ms-plans-headright">
          <div className="ms-plans-settings-wrap">
            <button
              type="button"
              className="ms-plans-settings"
              onClick={() => setSettingsOpen((v) => !v)}
              aria-expanded={settingsOpen}
            >
              <MsIcon name="icons_viewsetting" size={26} />
              <span>显示设置</span>
            </button>
            {settingsOpen && (
              <div className="ms-plans-settings-panel">
                <div className="ms-plans-settings-title">显示设置</div>
                <label>
                  <span>显示镜头画面</span>
                  <input type="checkbox" checked={showThumbs} onChange={(e) => setShowThumbs(e.target.checked)} />
                </label>
                <label>
                  <span>显示镜头信息</span>
                  <input type="checkbox" checked={showInfo} onChange={(e) => setShowInfo(e.target.checked)} />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="ms-plans-body">
        <PlanCard
          title="未规划镜头"
          count={unplanned.length}
          shots={unplanned}
          startIndex={0}
          selected={selected}
          onSelect={toggleSelect}
          showThumbs={showThumbs}
          showInfo={showInfo}
          highlight={dragOver === 'unplanned'}
          onDragOver={() => setDragOver('unplanned')}
          onDragLeave={() => setDragOver(null)}
          onDrop={() => dropTo(null)}
          dropLabel="拖到这里移出计划"
        />

        {project.plans.map((plan) => (
          <PlanCard
            key={plan.id}
            title={plan.title}
            subtitle={[plan.date, plan.location].filter(Boolean).join(' · ')}
            count={shotsFor(plan.id).length}
            shots={shotsFor(plan.id)}
            startIndex={0}
            selected={selected}
            onSelect={toggleSelect}
            showThumbs={showThumbs}
            showInfo={showInfo}
            highlight={dragOver === plan.id}
            onDragOver={() => setDragOver(plan.id)}
            onDragLeave={() => setDragOver(null)}
            onDrop={() => dropTo(plan.id)}
            dropLabel="拖到这里加入计划"
            menu={
              <div className="ms-plan-menu-wrap">
                <button
                  type="button"
                  className="ms-plan-menu-btn"
                  aria-label="计划操作"
                  onClick={() => setMenuFor((v) => (v === plan.id ? null : plan.id))}
                >
                  <MsIcon name="icons_more" size={14} />
                </button>
                {menuFor === plan.id && (
                  <div className="ms-plan-menu">
                    <button type="button" onClick={() => openEdit(plan)}>
                      编辑计划
                    </button>
                    <button type="button" className="is-danger" onClick={() => { setRemoving(plan); setMenuFor(null) }}>
                      删除计划
                    </button>
                  </div>
                )}
              </div>
            }
          />
        ))}
      </div>

      {selected.length > 0 && (
        <div className="ms-plans-selection">
          <span>已选择 {selected.length} 个镜头</span>
          <button type="button" onClick={() => dropTo(null)}>
            移出计划
          </button>
          <button type="button" className="is-ghost" onClick={() => setSelected([])}>
            取消选择
          </button>
        </div>
      )}

      {creating && (
        <div className="ms-plan-modal-mask" onMouseDown={() => setCreating(false)}>
          <div className="ms-plan-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="ms-plan-modal-head">
              <h2>{editingPlan ? '编辑拍摄计划' : '新建拍摄计划'}</h2>
              <button type="button" className="ms-plan-modal-close" onClick={() => setCreating(false)} aria-label="关闭">
                <MsIcon name="icons_close_dialog" size={20} />
              </button>
            </div>
            <div className="ms-plan-modal-body">
              <label>
                <span>计划名称</span>
                <input
                  autoFocus
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="例如：第一天 · 城市空镜"
                />
              </label>
              <div className="ms-plan-modal-row">
                <label>
                  <span>拍摄日期</span>
                  <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
                </label>
                <label>
                  <span>拍摄地点</span>
                  <input
                    value={draft.location}
                    onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                    placeholder="选填"
                  />
                </label>
              </div>
              <label>
                <span>备注</span>
                <textarea
                  value={draft.note}
                  onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                  placeholder="选填"
                  rows={3}
                />
              </label>
            </div>
            <div className="ms-plan-modal-foot">
              <button type="button" className="is-ghost" onClick={() => setCreating(false)}>
                取消
              </button>
              <button type="button" className="is-primary" onClick={saveDraft}>
                {editingPlan ? '保存' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}

      {removing && (
        <div className="ms-plan-modal-mask" onMouseDown={() => setRemoving(null)}>
          <div className="ms-plan-confirm" onMouseDown={(e) => e.stopPropagation()}>
            <h2>删除拍摄计划</h2>
            <p>
              确定删除「{removing.title}」吗？计划中的镜头会回到未规划镜头。
            </p>
            <div className="ms-plan-modal-foot">
              <button type="button" className="is-ghost" onClick={() => setRemoving(null)}>
                取消
              </button>
              <button
                type="button"
                className="is-danger"
                onClick={() => {
                  deletePlan(project.id, removing.id)
                  setRemoving(null)
                  toast('计划已删除', 'success')
                }}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PlanCard({
  title,
  subtitle,
  count,
  shots,
  startIndex,
  selected,
  onSelect,
  showThumbs,
  showInfo,
  highlight,
  onDragOver,
  onDragLeave,
  onDrop,
  dropLabel,
  menu,
}: {
  title: string
  subtitle?: string
  count: number
  shots: Shot[]
  startIndex: number
  selected: string[]
  onSelect: (id: string) => void
  showThumbs: boolean
  showInfo: boolean
  highlight: boolean
  onDragOver: () => void
  onDragLeave: () => void
  onDrop: () => void
  dropLabel: string
  menu?: React.ReactNode
}) {
  return (
    <section
      className={cn('ms-plan-card', highlight && 'is-dragover')}
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver()
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault()
        onDrop()
      }}
    >
      <div className="ms-plan-cardhead">
        <div className="ms-plan-cardtitle">
          <span>{title}</span>
          <span className="ms-plan-count">{count}</span>
        </div>
        {menu}
      </div>
      {subtitle && <div className="ms-plan-subtitle">{subtitle}</div>}

      <div className="ms-plan-listcontainer">
        <div className="ms-plan-list">
          {shots.map((shot, i) => (
            <PlanShot
              key={shot.id}
              shot={shot}
              index={startIndex + i}
              selected={selected.includes(shot.id)}
              onSelect={() => onSelect(shot.id)}
              showThumbs={showThumbs}
              showInfo={showInfo}
            />
          ))}
          {!shots.length && <div className="ms-plan-empty">{dropLabel}</div>}
        </div>
      </div>
    </section>
  )
}

function PlanShot({
  shot,
  index,
  selected,
  onSelect,
  showThumbs,
  showInfo,
}: {
  shot: Shot
  index: number
  selected: boolean
  onSelect: () => void
  showThumbs: boolean
  showInfo: boolean
}) {
  const no = String(shot.values.SHOT || '').trim() || `镜头${index + 1}`
  const content = shot.values.CONTENT || ''
  const remark = shot.values.REMARK || ''
  const scene = shot.values.SCENE || shot.values.SHOTSIZE || ''

  return (
    <div
      className={cn('ms-plan-shot', selected && 'is-selected')}
      draggable
      onDragStart={(e) => {
        window.__msDragShot = shot.id
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', shot.id)
      }}
      onDragEnd={() => {
        window.__msDragShot = null
      }}
    >
      <div className="ms-plan-radio-col">
        <button
          type="button"
          className={cn('ms-plan-radio', selected && 'is-on')}
          aria-label={selected ? '取消选择镜头' : '选择镜头'}
          aria-pressed={selected}
          onClick={onSelect}
        >
          {selected && <span />}
        </button>
      </div>

      {showThumbs && (
        <div className="ms-plan-image-wrap">
          <div className="ms-plan-image" style={{ background: '#F4F6F7' }}>
            {shot.image ? (
              <img src={shot.image} alt="" draggable={false} />
            ) : (
              <span className="ms-plan-image-empty">未添加图片</span>
            )}
          </div>
        </div>
      )}

      {showInfo && (
        <div className="ms-plan-content">
          <div>
            <div className="ms-plan-shotno">{no}</div>
            {content && <div className="ms-plan-shotcontent">{content}</div>}
          </div>
          <div className="ms-plan-shotscene">
            {scene}
            {remark && <span> · {remark}</span>}
          </div>
        </div>
      )}
    </div>
  )
}

declare global {
  interface Window {
    __msDragShot?: string | null
  }
}
