import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '../../lib/store'
import { useRoute } from '../../lib/router'
import type { ColumnDef, Option, Project, Shot } from '../../types'
import { asset, cn, fileToDataURL, sumDuration } from '../../lib/utils'
import { ASPECT_RATIOS, BASE_COLUMNS, buildColumns, ratioOf } from '../../lib/data'
import { Icon } from '../../components/Icons'
import { MsIcon } from '../../components/MsIcon'
import { Confirm, Drawer, Dropdown, Modal, SectionLabel, Toggle } from '../../components/ui'

const TABLE_WIDTH = 1367
const HEADER_PLUS_WIDTH = 86
const ROW_INNER_HEIGHT = 171

export default function Make({ project }: { project: Project }) {
  const {
    addShot,
    updateShot,
    setShotValue,
    deleteShots,
    duplicateShot,
    moveShot,
    updateProject,
    saveColumnPreset,
    applyColumnPreset,
    state,
    toast,
  } = useStore()
  const route = useRoute()

  const [settingsOpen, setSettingsOpen] = useState(route.query.get('settings') === '1')
  const [columnsOpen, setColumnsOpen] = useState(false)
  const [batch, setBatch] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const [uploadFor, setUploadFor] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [presetName, setPresetName] = useState('')

  const columns = project.columns
  const visible = useMemo(() => columns.filter((c) => c.show), [columns])
  const bodyColumns = useMemo(() => visible.filter((c) => c._id !== 'SHOT'), [visible])
  const ratio = ratioOf(project.settings.aspectRatio)
  const total = sumDuration(project.shots)

  useEffect(() => {
    setSelected((s) => s.filter((id) => project.shots.some((sh) => sh.id === id)))
  }, [project.shots])

  useEffect(() => {
    if (!batch) setSelected([])
  }, [batch])

  const onPickImage = async (files: FileList | null) => {
    if (!files?.length || !uploadFor) return
    try {
      const url = await fileToDataURL(files[0])
      updateShot(project.id, uploadFor, { image: url })
    } catch {
      toast('图片读取失败')
    }
    setUploadFor(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const addNew = (index?: number) => {
    addShot(project.id, index)
    toast('已新建镜头', 'success')
  }

  const addMany = (count: number) => {
    for (let i = 0; i < count; i++) addShot(project.id)
    toast(`已新建 ${count} 个镜头`, 'success')
  }

  const removeShots = (ids: string[]) => {
    deleteShots(project.id, ids)
    setSelected([])
    setConfirmDelete(null)
    toast(`已删除 ${ids.length} 个镜头`)
  }

  const toggleColumn = (id: string) =>
    updateProject(project.id, (p) => ({
      ...p,
      columns: p.columns.map((c) => (c._id === id ? { ...c, show: !c.show } : c)),
    }))

  const moveColumn = (from: number, to: number) =>
    updateProject(project.id, (p) => {
      const cols = [...p.columns]
      const [item] = cols.splice(from, 1)
      cols.splice(to, 0, item)
      return { ...p, columns: cols }
    })

  const widthFor = (c: ColumnDef) => {
    if (c._id === 'SHOT') return 90
    if (c._id === 'PICTURE') return 300
    if (c._id === 'SHOTSIZE' || c._id === 'DURATION') return 100
    if (c._id === 'CONTENT' || c._id === 'REMARK') return 300
    return c.width
  }

  const allWidths = useMemo(
    () => [90, ...visible.map(widthFor), HEADER_PLUS_WIDTH],
    [visible],
  )
  const tableWidth = Math.max(TABLE_WIDTH, allWidths.reduce((a, b) => a + b, 0))

  return (
    <div className="ms-make">
      <div className="ms-sb-header">
        <div className="ms-sb-title-group">
          <h1 className="ms-sb-title">制作分镜</h1>
          <button
            type="button"
            className="ms-sb-help"
            title="逐行整理每个镜头的画面、景别、时长与备注。拖动左侧手柄可调整顺序。"
          >
            <MsIcon name="icons_questionmark" size={14} />
          </button>

          <div className="ms-create">
            <button type="button" className="ms-create-main" onClick={() => addNew()}>
              <MsIcon name="icons_create" size={10} />
              <span>新建</span>
            </button>
            <span className="ms-create-divider" />
            <Dropdown
              width={190}
              align="left"
              className="ms-create-dd"
              trigger={
                <button type="button" className="ms-create-arrow" aria-label="新建选项">
                  <MsIcon name="icons_pm_xiala" size={12} />
                </button>
              }
            >
              <MakeMenuItem icon="icons_shot_creat_1" label="创建 1 个分镜" onClick={() => addNew()} />
              <MakeMenuItem icon="icons_shot_creat_5" label="创建 5 个分镜" onClick={() => addMany(5)} />
              <MakeMenuItem icon="icons_shot_creat_10" label="创建 10 个分镜" onClick={() => addMany(10)} />
              <div className="ms-make-menu-line" />
              <MakeMenuItem icon="icons_scene_creat" label="创建场景" onClick={() => toast('创建场景功能即将开放')} />
            </Dropdown>
          </div>
        </div>

        <div className="ms-sb-right">
          <button
            type="button"
            className={cn('ms-sb-btn ms-sb-batch', batch && 'is-active')}
            onClick={() => setBatch((b) => !b)}
          >
            <MsIcon name="icons_batch_edit" size={26} />
            <span>批量模式</span>
          </button>

          <Dropdown
            width={158}
            align="left"
            className="ms-sb-select-dd"
            trigger={
              <button type="button" className="ms-sb-btn ms-sb-select">
                <MsIcon name="icons_shot_select" size={26} />
                <span>选择</span>
                <MsIcon name="icons_down_mini" size={8} className="ms-sb-chev" />
              </button>
            }
          >
            <MakeMenuItem
              label="全选"
              onClick={() => {
                setBatch(true)
                setSelected(project.shots.map((s) => s.id))
              }}
            />
            <MakeMenuItem label="取消选择" onClick={() => setSelected([])} />
            <div className="ms-make-menu-line" />
            <MakeMenuItem
              label={`删除选中${selected.length ? ` (${selected.length})` : ''}`}
              danger
              disabled={!selected.length}
              onClick={() => setConfirmDelete(selected)}
            />
          </Dropdown>

          <button type="button" className="ms-sb-btn ms-sb-settings" onClick={() => setSettingsOpen(true)}>
            <MsIcon name="icons_shot_setting" size={26} />
            <span>分镜设置</span>
            <MsIcon name="icons_down_mini" size={8} className="ms-sb-chev" />
          </button>

          <button type="button" className="ms-sb-btn ms-sb-columns" onClick={() => setColumnsOpen(true)}>
            <MsIcon name="icons_setting" size={26} />
            <span>列设置</span>
          </button>
        </div>
      </div>

      <div className="ms-table-box">
        <div className="ms-table-inner" style={{ width: tableWidth }}>
          <div className="ms-table-head">
            <div className="ms-th ms-th-sort" style={{ width: 90 }}>
              <span>排序</span>
            </div>
            {visible.map((c) => (
              <div key={c._id} className={cn('ms-th', c._id === 'SHOT' && 'ms-th-shot')} style={{ width: widthFor(c) }}>
                <span>{c.title}</span>
              </div>
            ))}
            <button type="button" className="ms-th-plus" style={{ width: HEADER_PLUS_WIDTH }} onClick={() => addNew()}>
              <MsIcon name="icons_add" size={14} />
            </button>
          </div>

          <div className="ms-table-body">
            {project.shots.map((shot, i) => {
              const isSel = selected.includes(shot.id)
              return (
                <div
                  key={shot.id}
                  className={cn('ms-row', isSel && 'is-selected', overIndex === i && 'is-over')}
                  style={{ width: tableWidth }}
                  onDragOver={(e) => {
                    if (dragIndex === null) return
                    e.preventDefault()
                    setOverIndex(i)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (dragIndex !== null) moveShot(project.id, dragIndex, i)
                    setDragIndex(null)
                    setOverIndex(null)
                  }}
                >
                  <div className="ms-row-left ms-rule-right">
                    <div className="ms-handle-cell ms-rule-right">
                      {batch ? (
                        <button
                          type="button"
                          className={cn('ms-select-box', isSel && 'is-checked')}
                          onClick={() =>
                            setSelected((s) => (isSel ? s.filter((x) => x !== shot.id) : [...s, shot.id]))
                          }
                          aria-label={isSel ? '取消选择' : '选择镜头'}
                        >
                          {isSel && <MsIcon name="icons_selected" size={12} />}
                        </button>
                      ) : (
                        <Dropdown
                          width={160}
                          align="left"
                          portal
                          trigger={
                            <button
                              type="button"
                              draggable
                              onDragStart={() => setDragIndex(i)}
                              onDragEnd={() => {
                                setDragIndex(null)
                                setOverIndex(null)
                              }}
                              className="ms-handle"
                              title="拖拽排序，点击更多操作"
                            >
                              <MsIcon name="icons_drag" size={13.98} />
                            </button>
                          }
                        >
                          <MakeMenuItem label="在上方插入" onClick={() => addShot(project.id, i - 1)} />
                          <MakeMenuItem label="在下方插入" onClick={() => addNew(i)} />
                          <MakeMenuItem label="复制镜头" onClick={() => duplicateShot(project.id, shot.id)} />
                          <div className="ms-make-menu-line" />
                          <MakeMenuItem label="删除镜头" danger onClick={() => setConfirmDelete([shot.id])} />
                        </Dropdown>
                      )}
                    </div>

                    <div className="ms-cell-number">
                      {project.settings.customShotNo ? (
                        <EditableText
                          value={shot.values.SHOT || ''}
                          placeholder={String(i + 1)}
                          onChange={(v) => setShotValue(project.id, shot.id, 'SHOT', v)}
                        />
                      ) : (
                        <span className="ms-cell-value">{i + 1}</span>
                      )}
                    </div>
                  </div>

                  {bodyColumns.map((col) => (
                    <ShotCell
                      key={col._id}
                      col={col}
                      shot={shot}
                      width={widthFor(col)}
                      ratio={ratio}
                      onValue={(v) => setShotValue(project.id, shot.id, col._id, v)}
                      onUpload={() => {
                        setUploadFor(shot.id)
                        setTimeout(() => fileRef.current?.click(), 0)
                      }}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="ms-total-view">
        <div className="ms-total-label">
          <span className="t">镜头总数</span>
          <span className="c">{project.shots.length}</span>
        </div>
        <div className="ms-total-label">
          <span className="t">总时长</span>
          <span className="c">{total.toFixed(0)}秒</span>
        </div>
        {batch && selected.length > 0 && (
          <div className="ms-total-label is-selected">
            <span className="t">已选</span>
            <span className="c">{selected.length}</span>
            <button type="button" className="ms-total-delete" onClick={() => setConfirmDelete(selected)}>
              删除
            </button>
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPickImage(e.target.files)} />

      {/* settings modal */}
      <Modal
        open={settingsOpen}
        title="分镜设置"
        onClose={() => setSettingsOpen(false)}
        width={520}
        footer={
          <button className="btn btn-primary px-8" onClick={() => setSettingsOpen(false)}>
            完成
          </button>
        }
      >
        <div className="space-y-5">
          <div>
            <SectionLabel>项目名称</SectionLabel>
            <input
              className="field"
              value={project.name}
              onChange={(e) => updateProject(project.id, (p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div>
            <SectionLabel>画幅比例</SectionLabel>
            <div className="grid grid-cols-3 gap-2">
              {ASPECT_RATIOS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => updateProject(project.id, (p) => ({ ...p, settings: { ...p.settings, aspectRatio: r.id } }))}
                  className={cn(
                    'rounded-lg border px-3 py-2.5 text-left transition',
                    project.settings.aspectRatio === r.id
                      ? 'border-[#f3c53f] bg-[#FFF9E3]'
                      : 'border-[#e6e6ea] hover:border-[#d5d6dd]',
                  )}
                >
                  <div className="text-[13px] font-medium">{r.id}</div>
                  <div className="text-[11px] text-[#9b9ca5]">{r.label.split(' ')[1]}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-[#fafafb] px-4 py-3">
            <div>
              <div className="text-[13px] font-medium">自定义镜号</div>
              <div className="text-[11.5px] text-[#9b9ca5]">开启后镜号可手动输入（如 12A、闪回-1）</div>
            </div>
            <Toggle
              checked={project.settings.customShotNo}
              onChange={(v) => updateProject(project.id, (p) => ({ ...p, settings: { ...p.settings, customShotNo: v } }))}
            />
          </div>
          <div>
            <SectionLabel>表格模板</SectionLabel>
            <div className="flex gap-2">
              {(['simple', 'pro'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    updateProject(project.id, (p) => ({ ...p, template: t, columns: buildColumns(t) }))
                    toast(`已切换为${t === 'simple' ? '简洁' : '专业'}模板`, 'success')
                  }}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2.5 text-left text-[13px] transition',
                    project.template === t ? 'border-[#f3c53f] bg-[#FFF9E3]' : 'border-[#e6e6ea]',
                  )}
                >
                  {t === 'simple' ? '简洁 · 6 列' : '专业 · 14 列'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* columns drawer */}
      <Drawer
        open={columnsOpen}
        title="列设置"
        onClose={() => setColumnsOpen(false)}
        width={360}
        footer={
          <div className="flex items-center gap-2">
            <input
              className="field h-9 flex-1 text-[12.5px]"
              placeholder="模板名称，例：广告分镜"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
            />
            <button
              className="btn btn-primary h-9 px-3 text-[12.5px]"
              onClick={() => {
                if (!presetName.trim()) return toast('请输入模板名称')
                saveColumnPreset(presetName.trim(), project.columns)
                setPresetName('')
                toast('已存储为列模板', 'success')
              }}
            >
              存储模板
            </button>
          </div>
        }
      >
        <p className="mb-3 text-[11.5px] leading-relaxed text-[#9b9ca5]">勾选需要显示的列，拖动左侧把手调整顺序。</p>
        <div className="space-y-1">
          {project.columns.map((c, i) => (
            <div key={c._id} className="flex items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-canvas">
              <button
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/col', String(i))}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const from = Number(e.dataTransfer.getData('text/col'))
                  if (!Number.isNaN(from)) moveColumn(from, i)
                }}
                className="cursor-grab text-[#c3c4cb] hover:text-[#8b8d97]"
              >
                <Icon name="drag" size={15} />
              </button>
              <button
                onClick={() => toggleColumn(c._id)}
                className={cn(
                  'flex h-[18px] w-[18px] items-center justify-center rounded border transition',
                  c.show ? 'border-[#F5B73D] bg-[#FFD84D] text-[#7a4a12]' : 'border-[#d5d6dd] bg-white',
                )}
              >
                {c.show && <Icon name="check" size={12} />}
              </button>
              <span className="flex-1 text-[13px]">{c.title}</span>
              {c._id === 'SHOT' && <span className="text-[10.5px] text-[#b3b4bc]">固定</span>}
            </div>
          ))}
        </div>

        {state.columnPresets.length > 0 && (
          <div className="mt-5">
            <SectionLabel>已存列模板</SectionLabel>
            <div className="space-y-1">
              {state.columnPresets.map((p) => (
                <button
                  key={p.id}
                  className="flex w-full items-center justify-between rounded-lg border border-line px-3 py-2 text-[12.5px] hover:bg-canvas"
                  onClick={() => {
                    applyColumnPreset(project.id, p.id)
                    toast('已应用列模板', 'success')
                  }}
                >
                  {p.name}
                  <Icon name="arrow-right" size={14} />
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#e4e5ea] py-2 text-[12px] text-[#9b9ca5] hover:border-[#f3c53f]"
          onClick={() => {
            updateProject(project.id, (p) => ({ ...p, columns: BASE_COLUMNS.map((c) => ({ ...c })) }))
            toast('已恢复默认列')
          }}
        >
          <Icon name="restore" size={14} /> 恢复默认列
        </button>
      </Drawer>

      <Confirm
        open={!!confirmDelete}
        title="删除镜头"
        desc={`确认删除 ${confirmDelete?.length || 0} 个镜头？相关拍摄计划中的引用也会一并移除。`}
        danger
        confirmText="删除"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && removeShots(confirmDelete)}
      />
    </div>
  )
}

/* ------------------------------- toolbar menu ------------------------------- */

function MakeMenuItem({
  icon,
  label,
  onClick,
  danger,
  disabled,
}: {
  icon?: string
  label: string
  onClick?: () => void
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      className={cn('ms-make-menu-item', danger && 'is-danger')}
      disabled={disabled}
      onClick={onClick}
    >
      {icon && <MsIcon name={icon} size={20} />}
      <span>{label}</span>
    </button>
  )
}

/* ------------------------------- cells ------------------------------- */

function ShotCell({
  col,
  shot,
  width,
  ratio,
  onValue,
  onUpload,
}: {
  col: ColumnDef
  shot: Shot
  width: number
  ratio: number
  onValue: (v: string) => void
  onUpload: () => void
}) {
  if (col.type === 'IMAGE') {
    return <ImageCell width={width} ratio={ratio} image={shot.image} onUpload={onUpload} />
  }

  if (col.type === 'OPTION') {
    return (
      <OptionCell
        width={width}
        value={shot.values[col._id] || ''}
        options={col.options || []}
        onValue={onValue}
      />
    )
  }

  if (col.type === 'NUMBER') {
    return (
      <div className="ms-cell ms-cell-text ms-rule-right" style={{ width }}>
        <NumberCell value={shot.values[col._id] || ''} onChange={onValue} />
      </div>
    )
  }

  return (
    <div className="ms-cell ms-cell-text ms-rule-right" style={{ width }}>
      <EditableText value={shot.values[col._id] || ''} onChange={onValue} />
    </div>
  )
}

function ImageCell({
  width,
  ratio,
  image,
  onUpload,
}: {
  width: number
  ratio: number
  image: string | null
  onUpload: () => void
}) {
  const maxW = 268.444
  const maxH = ROW_INNER_HEIGHT - 20
  let cardW = maxW
  let cardH = cardW / ratio
  if (cardH > maxH) {
    cardH = maxH
    cardW = cardH * ratio
  }

  return (
    <div className="ms-cell ms-cell-image ms-rule-right" style={{ width }}>
      <button
        type="button"
        className={cn('ms-image-card', !image && 'is-empty')}
        style={{
          width: cardW,
          height: cardH,
          backgroundImage: image ? undefined : `url(${asset('/media/shot_no_img.png')})`,
        }}
        onClick={onUpload}
        title={image ? '替换图片' : '点击上传图片'}
      >
        {image && <img src={image} alt="" />}
        {image && <span className="ms-image-hover">替换</span>}
      </button>
    </div>
  )
}

function EditableText({
  value,
  onChange,
  placeholder = '输入内容',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [editing, setEditing] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!editing) return
    const el = ref.current
    if (!el) return
    el.focus()
    el.selectionStart = el.selectionEnd = el.value.length
    el.style.height = 'auto'
    el.style.height = `${Math.min(151, Math.max(18.858, el.scrollHeight))}px`
  }, [editing])

  const resize = () => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(151, Math.max(18.858, el.scrollHeight))}px`
  }

  if (!editing) {
    return (
      <button type="button" className="ms-cell-fill" onClick={() => setEditing(true)}>
        {value ? (
          <span className="ms-cell-value">{value}</span>
        ) : (
          <span className="ms-cell-placeholder">{placeholder}</span>
        )}
      </button>
    )
  }

  return (
    <div className="ms-cell-edit-wrap">
      <textarea
        ref={ref}
        rows={1}
        className="ms-cell-textarea"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          resize()
        }}
        onBlur={() => setEditing(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setEditing(false)
        }}
      />
    </div>
  )
}

function NumberCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) return
    ref.current?.focus()
    ref.current?.select()
  }, [editing])

  if (!editing) {
    return (
      <button type="button" className="ms-cell-fill" onClick={() => setEditing(true)}>
        {value ? (
          <span className="ms-cell-value">{value}</span>
        ) : (
          <span className="ms-cell-placeholder">输入内容</span>
        )}
      </button>
    )
  }

  return (
    <div className="ms-cell-edit-wrap">
      <input
        ref={ref}
        className="ms-cell-input"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ''))}
        onBlur={() => setEditing(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'Escape') setEditing(false)
        }}
      />
    </div>
  )
}

function OptionCell({
  width,
  value,
  options,
  onValue,
}: {
  width: number
  value: string
  options: Option[]
  onValue: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ left: 0, top: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  const openMenu = () => {
    const r = btnRef.current?.getBoundingClientRect()
    if (!r) return
    const w = 150
    const left = Math.min(window.innerWidth - w - 8, Math.max(8, r.left + r.width / 2 - w / 2))
    const top = Math.min(window.innerHeight - 260, r.top + r.height / 2 - 10)
    setPos({ left, top })
    setOpen(true)
  }

  return (
    <div className="ms-cell ms-cell-option ms-rule-right" style={{ width }}>
      <button ref={btnRef} type="button" className="ms-cell-fill" onClick={openMenu}>
        {value ? (
          <span className="ms-cell-value">{value}</span>
        ) : (
          <span className="ms-cell-placeholder">输入内容</span>
        )}
      </button>
      {open &&
        createPortal(
          <>
            <div className="ms-pop-backdrop" onClick={() => setOpen(false)} />
            <div className="ms-cell-pop" style={{ left: pos.left, top: pos.top }}>
              <button
                type="button"
                className="ms-cell-pop-item is-placeholder"
                onClick={() => {
                  onValue('')
                  setOpen(false)
                }}
              >
                清空
              </button>
              {options.map((o) => (
                <button
                  type="button"
                  key={o.id}
                  className="ms-cell-pop-item"
                  onClick={() => {
                    onValue(o.title)
                    setOpen(false)
                  }}
                >
                  <span>{o.title}</span>
                  {value === o.title && <MsIcon name="icons_selected" size={14} />}
                </button>
              ))}
            </div>
          </>,
          document.body,
        )}
    </div>
  )
}
