import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../../lib/store'
import type { Project } from '../../types'
import { cn, fileToDataURL } from '../../lib/utils'
import { ratioOf } from '../../lib/data'
import { Icon } from '../../components/Icons'
import { ProjectTitleBlock } from '../../components/ProjectLayout'
import { Drawer, Modal, Toggle } from '../../components/ui'

export default function Board({ project }: { project: Project }) {
  const { addShot, updateShot, setShotValue, toast } = useStore()
  const [showSettings, setShowSettings] = useState(false)
  const [preview, setPreview] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [playIndex, setPlayIndex] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [cols, setCols] = useState(4)
  const [fields, setFields] = useState({ size: true, duration: true, content: true, remark: false })
  const [zoom, setZoom] = useState(1)
  const fileRef = useRef<HTMLInputElement>(null)
  const uploadFor = useRef<string | null>(null)

  const ratio = ratioOf(project.settings.aspectRatio)
  const shot = useMemo(() => project.shots.find((s) => s.id === editingId), [project.shots, editingId])
  const playingShot = project.shots[playIndex]

  useEffect(() => {
    if (!playing) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPlaying(false)
      if (e.key === 'ArrowRight') setPlayIndex((i) => Math.min(project.shots.length - 1, i + 1))
      if (e.key === 'ArrowLeft') setPlayIndex((i) => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playing, project.shots.length])

  const upload = async (files: FileList | null) => {
    if (!files?.length || !uploadFor.current) return
    const url = await fileToDataURL(files[0])
    updateShot(project.id, uploadFor.current, { image: url })
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#F5F6F7]">
      <div className="no-print px-7 pt-6 pb-4">
        <ProjectTitleBlock
          title="预览故事板"
          help="故事板按镜头顺序排布，方便快速过片与客户确认。"
          actions={
            <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
              <button className="btn btn-primary h-[42px]" onClick={() => { addShot(project.id); toast('已新建镜头', 'success') }}>
                <Icon name="plus" size={16} /> 新建镜头
              </button>
              <button className="btn btn-outline h-[42px]" onClick={() => setPreview(true)}>
                <Icon name="print" size={16} /> 预览故事板
              </button>
              <button className="btn btn-outline h-[42px]" onClick={() => { setPlayIndex(0); setPlaying(true) }} disabled={!project.shots.length}>
                <Icon name="play" size={16} /> 放映模式
              </button>
              <button className="btn btn-ghost h-[42px]" onClick={() => setShowSettings(true)}>
                <Icon name="settings" size={16} /> 显示设置
              </button>
              <div className="flex items-center gap-1 rounded-lg border border-[#e6e6ea] bg-white p-0.5">
                {[2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => setCols(n)}
                    className={cn('flex h-8 w-8 items-center justify-center rounded-md', cols === n ? 'bg-[#FFF3C4] text-[#7a4a12]' : 'text-[#9b9ca5]')}
                  >
                    <Icon name="grid" size={15} />
                  </button>
                ))}
              </div>
            </div>
          }
        />
      </div>

      <div className="flex-1 overflow-auto px-7 pb-20">
        {project.shots.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center pb-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#c3c4cb] shadow-sm">
              <Icon name="image" size={26} />
            </div>
            <p className="text-[13.5px] text-[#6c6d76]">还没有镜头，先去「分镜制作」新建一个吧</p>
            <button className="btn btn-primary mt-4" onClick={() => addShot(project.id)}>
              <Icon name="plus" size={16} /> 新建镜头
            </button>
          </div>
        ) : (
          <div
            className="board-grid grid gap-5"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          >
            {project.shots.map((s, i) => (
              <div
                key={s.id}
                className="group overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:shadow-[0_10px_26px_rgba(20,24,40,0.10)]"
              >
                <div className="relative bg-[#f4f5f7]" style={{ aspectRatio: ratio }}>
                  {s.image ? (
                    <img src={s.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <button
                      onClick={() => {
                        uploadFor.current = s.id
                        fileRef.current?.click()
                      }}
                      className="absolute inset-3 flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#dcdee5] text-[12px] text-[#b3b4bc] transition hover:border-[#c8cad1] hover:text-[#8b8d97]"
                    >
                      <Icon name="image" size={21} />
                      上传画面
                    </button>
                  )}
                  <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/35 px-2 py-0.5 text-[10.5px] text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
                    镜头 {i + 1}
                  </div>
                </div>
                <div className="px-3.5 py-3">
                  <p className={cn('line-clamp-2 min-h-[20px] text-[13px] leading-relaxed', !s.values.CONTENT && 'text-[#c3c4cb]')}>
                    {s.values.CONTENT || '无内容'}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {fields.size && s.values.SHOTSIZE && <Tag>{s.values.SHOTSIZE}</Tag>}
                    {fields.duration && s.values.DURATION && <Tag>{s.values.DURATION}s</Tag>}
                    {fields.remark && s.values.REMARK && (
                      <span className="line-clamp-1 max-w-full text-[10.5px] text-[#b3b4bc]">{s.values.REMARK}</span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
                    <span className="text-[11.5px] text-[#9b9ca5]">镜头 {i + 1}</span>
                    <button
                      onClick={() => setEditingId(s.id)}
                      className="rounded-md p-1 text-[#9b9ca5] transition hover:bg-canvas hover:text-ink"
                      title="编辑镜头"
                    >
                      <Icon name="edit" size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files)} />

      <Drawer open={showSettings} title="显示设置" onClose={() => setShowSettings(false)} width={340}>
        <div className="space-y-3">
          {(
            [
              ['size', '显示景别'],
              ['duration', '显示时长'],
              ['content', '显示内容'],
              ['remark', '显示备注'],
            ] as const
          ).map(([k, label]) => (
            <div key={k} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-canvas">
              <span className="text-[13px]">{label}</span>
              <Toggle checked={fields[k]} onChange={(v) => setFields((f) => ({ ...f, [k]: v }))} />
            </div>
          ))}
          <div className="border-t border-line pt-3">
            <div className="mb-2 flex items-center justify-between text-[13px]">
              <span>卡片大小</span>
              <span className="text-[11.5px] text-[#9b9ca5]">{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.7}
              max={1.15}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-[#F5B73D]"
            />
          </div>
        </div>
      </Drawer>

      {/* edit shot */}
      <Modal
        open={!!editingId}
        title="编辑镜头"
        onClose={() => setEditingId(null)}
        width={640}
        footer={
          <button className="btn btn-primary px-8" onClick={() => setEditingId(null)}>
            完成
          </button>
        }
      >
        {shot && (
          <div className="space-y-4">
            <div className="grid grid-cols-[220px_1fr] gap-4">
              <div className="overflow-hidden rounded-lg bg-[#f4f5f7]" style={{ aspectRatio: ratio }}>
                {shot.image ? (
                  <img src={shot.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <button
                    className="flex h-full w-full flex-col items-center justify-center gap-1 text-[11.5px] text-[#b3b4bc]"
                    onClick={() => {
                      uploadFor.current = shot.id
                      fileRef.current?.click()
                    }}
                  >
                    <Icon name="upload" size={18} /> 上传图片
                  </button>
                )}
              </div>
              <div>
                <label className="mb-1 block text-[12px] text-[#6c6d76]">内容</label>
                <textarea
                  className="field h-[92px] resize-none py-2"
                  value={shot.values.CONTENT || ''}
                  onChange={(e) => setShotValue(project.id, shot.id, 'CONTENT', e.target.value)}
                  placeholder="这场镜头发生什么？"
                />
                <div className="mt-2 flex gap-2">
                  <input
                    className="field h-9 text-[12.5px]"
                    placeholder="景别"
                    value={shot.values.SHOTSIZE || ''}
                    onChange={(e) => setShotValue(project.id, shot.id, 'SHOTSIZE', e.target.value)}
                  />
                  <input
                    className="field h-9 w-[92px] text-[12.5px]"
                    placeholder="时长"
                    value={shot.values.DURATION || ''}
                    onChange={(e) => setShotValue(project.id, shot.id, 'DURATION', e.target.value.replace(/[^\d.]/g, ''))}
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[12px] text-[#6c6d76]">备注</label>
              <input
                className="field"
                value={shot.values.REMARK || ''}
                onChange={(e) => setShotValue(project.id, shot.id, 'REMARK', e.target.value)}
                placeholder="灯光、道具、收音等备注"
              />
            </div>
            {shot.image && (
              <button
                className="text-[12px] text-[#e05252] hover:underline"
                onClick={() => updateShot(project.id, shot.id, { image: null })}
              >
                移除图片
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* print preview */}
      <Modal open={preview} title="故事板预览" onClose={() => setPreview(false)} width={1040}>
        <div className="rounded-lg bg-white p-6">
          <div className="mb-4 flex items-baseline justify-between border-b border-line pb-3">
            <h2 className="text-[18px] font-bold">{project.name}</h2>
            <span className="text-[11.5px] text-[#9b9ca5]">
              故事板 · {project.shots.length} 镜 · {project.settings.aspectRatio}
            </span>
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, minmax(0,1fr))' }}>
            {project.shots.map((s, i) => (
              <div key={s.id} className="break-inside-avoid">
                <div className="overflow-hidden rounded border border-line bg-[#fafafb]" style={{ aspectRatio: ratio }}>
                  {s.image ? (
                    <img src={s.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[11px] text-[#c3c4cb]">未添加图片</div>
                  )}
                </div>
                <div className="mt-1.5 flex gap-2 text-[10.5px] text-[#6c6d76]">
                  <span className="font-semibold text-ink">#{i + 1}</span>
                  <span>{s.values.SHOTSIZE}</span>
                  <span>{s.values.DURATION}s</span>
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-[#4a4b53]">{s.values.CONTENT}</p>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* slideshow */}
      {playing && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-[#0d0e12] text-white">
          <div className="flex items-center justify-between px-6 py-4 text-[13px] text-white/70">
            <span>{project.name} · 放映模式</span>
            <div className="flex items-center gap-4">
              <span>
                {playIndex + 1} / {project.shots.length}
              </span>
              <button className="rounded-md p-1.5 hover:bg-white/10" onClick={() => setPlaying(false)}>
                <Icon name="close" size={20} />
              </button>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center gap-8 px-12 pb-12">
            <button
              className="rounded-full p-3 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-20"
              onClick={() => setPlayIndex((i) => Math.max(0, i - 1))}
              disabled={playIndex === 0}
            >
              <Icon name="chevron-left" size={26} />
            </button>
            <div style={{ width: `min(72vw, calc(66vh * ${ratio}))` }}>
              <div className="overflow-hidden rounded-xl bg-white/5" style={{ aspectRatio: ratio }}>
                {playingShot?.image ? (
                  <img src={playingShot.image} alt="" className="h-full w-full object-contain" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[13px] text-white/30">未添加图片</div>
                )}
              </div>
              <p className="mt-5 text-center text-[15px] leading-relaxed text-white/85">{playingShot?.values.CONTENT}</p>
            </div>
            <button
              className="rounded-full p-3 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-20"
              onClick={() => setPlayIndex((i) => Math.min(project.shots.length - 1, i + 1))}
              disabled={playIndex >= project.shots.length - 1}
            >
              <Icon name="chevron-right" size={26} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md bg-[#f4f5f7] px-1.5 py-0.5 text-[10.5px] text-[#7b7c86]">{children}</span>
}
