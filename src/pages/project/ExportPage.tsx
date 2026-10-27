import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../../lib/store'
import { navigate } from '../../lib/router'
import type { Project, Shot, ShotPlan } from '../../types'
import { asset, downloadText, fmtDate, toCSV } from '../../lib/utils'
import { ratioOf } from '../../lib/data'
import { MsIcon } from '../../components/MsIcon'

type ContentType = 'shots' | 'board' | 'plans' | 'callsheet'
type Orientation = 'landscape' | 'portrait'
type SizeOption = '大' | '中' | '小'

const CONTENT_OPTIONS: { value: ContentType; label: string }[] = [
  { value: 'shots', label: '分镜' },
  { value: 'board', label: '故事板' },
  { value: 'plans', label: '拍摄计划' },
  { value: 'callsheet', label: '拍摄通告' },
]

const TEXT_OPTIONS: SizeOption[] = ['大', '中', '小']
const COLUMN_OPTIONS = ['2', '4', '6', '8', '10']

export default function ExportPage({ project }: { project: Project }) {
  const { toast } = useStore()
  const [content, setContent] = useState<ContentType>('shots')
  const [format, setFormat] = useState('pdf文件')
  const [orientation, setOrientation] = useState<Orientation>('landscape')
  const [textSize, setTextSize] = useState<SizeOption>('中')
  const [imgSize, setImgSize] = useState<SizeOption>('小')
  const [maxCols, setMaxCols] = useState('8')
  const [navColor, setNavColor] = useState('#000000')
  const [logoOn, setLogoOn] = useState(true)
  const [loading, setLoading] = useState(true)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    timer.current = window.setTimeout(() => setLoading(false), 850)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [])

  const regenerate = () => {
    setLoading(true)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setLoading(false), 900)
  }

  const back = () => {
    if (window.opener) {
      window.close()
      return
    }
    navigate(`/project/${project.id}/make`)
  }

  const exportFile = () => {
    if (format === 'csv文件') {
      const rows: (string | number)[][] = [
        ['镜号', '画面', '景别', '时长（秒）', '内容', '备注'],
        ...project.shots.map((s, i) => [
          s.values.SHOT || String(i + 1),
          s.image ? '已上传' : '',
          s.values.SHOTSIZE || '',
          s.values.DURATION || '',
          s.values.CONTENT || '',
          s.values.REMARK || '',
        ]),
      ]
      downloadText(`${project.name}-分镜.csv`, toCSV(rows), 'text/csv;charset=utf-8')
      toast('CSV 文件已导出', 'success')
      return
    }
    toast('已打开打印窗口，请选择「另存为 PDF」')
    window.setTimeout(() => window.print(), 280)
  }

  return (
    <div className="ms-export-root">
      <aside className="ms-export-sidebar" aria-label="导出设置">
        <div className="ms-export-header">
          <button type="button" className="ms-export-back" onClick={back} aria-label="返回项目">
            <MsIcon name="icons_back" size={20} />
          </button>
          <div className="ms-export-headtitle">导出预览</div>
        </div>

        <div className="ms-export-sidebody">
          <section className="ms-export-section ms-export-type-section">
            <div className="ms-export-sectiontitle">内容选择</div>
            <div className="ms-export-typechoose">
              {CONTENT_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  className={`ms-export-typeitem ${content === opt.value ? 'is-selected' : ''}`}
                  onClick={() => setContent(opt.value)}
                >
                  <span className={`ms-export-radio ${content === opt.value ? 'is-selected' : ''}`} />
                  <span className="ms-export-typelabel">{opt.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="ms-export-section ms-export-format-section">
            <div className="ms-export-sectiontitle">导出设置</div>
            <div className="ms-export-formatrow">
              <ExportSelect
                value={format}
                options={['pdf文件', 'csv文件']}
                onChange={setFormat}
                width={260}
              />
              <div className="ms-export-caption">格式选择</div>
            </div>
          </section>

          <section className="ms-export-section ms-export-page-section">
            <div className="ms-export-sectiontitle">页面设置</div>

            <div className="ms-export-settingrow">
              <SettingSelect
                label="纸张方向"
                value={orientation === 'landscape' ? '横' : '竖'}
                options={['横', '竖']}
                onChange={(v) => setOrientation(v === '竖' ? 'portrait' : 'landscape')}
              />
              <SettingSelect
                label="文字大小"
                value={textSize}
                options={TEXT_OPTIONS}
                onChange={(v) => setTextSize(v as SizeOption)}
              />
              <SettingSelect
                label="图片大小"
                value={imgSize}
                options={TEXT_OPTIONS}
                onChange={(v) => setImgSize(v as SizeOption)}
              />
              <SettingSelect
                label="最大列数"
                value={maxCols}
                options={COLUMN_OPTIONS}
                onChange={setMaxCols}
              />
            </div>

            <div className="ms-export-settingrow is-second">
              <div className="ms-export-settingview is-color">
                <ColorControl value={navColor} onChange={setNavColor} />
                <div className="ms-export-caption">导航颜色</div>
              </div>
              <div className="ms-export-settingview is-logo">
                <LogoSelect value={logoOn} onChange={setLogoOn} />
                <div className="ms-export-caption">LOGO选择</div>
              </div>
            </div>
          </section>

          <button type="button" className="ms-export-previewbtn" onClick={regenerate}>
            生成预览
          </button>
        </div>

        <div className="ms-export-footer">
          <button type="button" className="ms-export-cta" onClick={exportFile}>
            <img src={asset('/media/export-icon.png')} alt="" width={20} height={20} />
            <span>导出</span>
          </button>
        </div>
      </aside>

      <main className="ms-export-main">
        <div className="ms-export-stage">
          <div className="ms-export-tipswrap">
            <div className="ms-export-tips">
              <span className="ms-export-tipmain">当前为预览模式，仅可以查看前20条内容，预览完成后请点击</span><span>左下角导出按钮</span>
            </div>
          </div>

          <div className={`ms-pdf-page ${orientation === 'portrait' ? 'is-portrait' : ''}`}>
            <PdfPreview
              project={project}
              content={content}
              orientation={orientation}
              textSize={textSize}
              imgSize={imgSize}
              maxCols={maxCols}
              navColor={navColor}
              logoOn={logoOn}
            />
          </div>
        </div>
      </main>

      {loading && (
        <div className="ms-export-loading" role="status" aria-live="polite">
          <div className="ms-export-loading-card">
            <img src={asset('/media/export-loading.gif')} alt="" width={80} height={80} />
            <div>正在生成预览</div>
          </div>
        </div>
      )}

      <div className="ms-export-feedback">反馈与订单</div>
    </div>
  )
}

function ExportSelect({
  value,
  options,
  onChange,
  width,
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
  width?: number
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div className="ms-export-selectwrap" ref={ref} style={width ? { width } : undefined}>
      <button type="button" className="ms-export-select" onClick={() => setOpen((v) => !v)}>
        <span>{value}</span>
        <MsIcon name="icons_down_mini" size={8} />
      </button>
      {open && (
        <div className="ms-export-selectmenu">
          {options.map((o) => (
            <button
              type="button"
              key={o}
              className={o === value ? 'is-active' : ''}
              onClick={() => {
                onChange(o)
                setOpen(false)
              }}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SettingSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <div className="ms-export-settingview">
      <ExportSelect value={value} options={options} onChange={onChange} width={60} />
      <div className="ms-export-caption">{label}</div>
    </div>
  )
}

function ColorControl({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const presets = ['#000000', '#24252C', '#FFDA71', '#E05252', '#3F7AE0', '#41A36B']

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div className="ms-export-colorview" ref={ref}>
      <div className="ms-export-colorbox">
        <label className="ms-export-swatch" style={{ background: value }}>
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label="导航颜色" />
        </label>
        <button type="button" className="ms-export-colorarrow" onClick={() => setOpen((v) => !v)} aria-label="颜色预设">
          <MsIcon name="icons_down_mini" size={8} />
        </button>
        {open && (
          <div className="ms-export-colormenu">
            {presets.map((p) => (
              <button
                type="button"
                key={p}
                className={p.toLowerCase() === value.toLowerCase() ? 'is-active' : ''}
                style={{ background: p }}
                title={p}
                onClick={() => {
                  onChange(p)
                  setOpen(false)
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function LogoSelect({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div className="ms-export-logoview" ref={ref}>
      <button type="button" className="ms-export-logobtn" onClick={() => setOpen((v) => !v)}>
        {value ? (
          <>
            <img className="ms-export-logoimg" src={asset('/media/logo_print_2.png')} alt="MEDIA STORY" />
            <MsIcon name="icons_down_mini" size={8} />
            <img className="ms-export-vip" src={asset('/media/vip-lock.png')} alt="专业版" />
          </>
        ) : (
          <span className="ms-export-nologo">不显示 LOGO</span>
        )}
      </button>
      {open && (
        <div className="ms-export-selectmenu is-logo">
          <button
            type="button"
            className={value ? 'is-active' : ''}
            onClick={() => {
              onChange(true)
              setOpen(false)
            }}
          >
            MEDIA STORY
          </button>
          <button
            type="button"
            className={!value ? 'is-active' : ''}
            onClick={() => {
              onChange(false)
              setOpen(false)
            }}
          >
            不显示 LOGO
          </button>
        </div>
      )}
    </div>
  )
}

function PdfPreview({
  project,
  content,
  orientation,
  textSize,
  imgSize,
  maxCols,
  navColor,
  logoOn,
}: {
  project: Project
  content: ContentType
  orientation: Orientation
  textSize: SizeOption
  imgSize: SizeOption
  maxCols: string
  navColor: string
  logoOn: boolean
}) {
  const ratio = useMemo(() => {
    const v = ratioOf(project.settings.aspectRatio)
    return Number.isInteger(v) ? `${v}:1` : project.settings.aspectRatio
  }, [project.settings.aspectRatio])

  const scale = textSize === '大' ? 1.14 : textSize === '小' ? 0.86 : 1
  const imageH = imgSize === '大' ? 62 : imgSize === '中' ? 46 : 32

  return (
    <>
      <div className="ms-pdf-head">
        <div className="ms-pdf-title">{project.name}</div>
        {logoOn && (
          <img className="ms-pdf-toplogo" src={asset('/media/logo_print_2.png')} alt="MEDIA STORY" />
        )}
        <div className="ms-pdf-meta">
          {`画幅比  ${ratio}    |    总镜头数 ${project.shots.length}个`}
        </div>
      </div>

      {content === 'shots' && (
        <StoryboardTable
          project={project}
          colCount={Number(maxCols)}
          navColor={navColor}
          scale={scale}
          imageH={imageH}
          orientation={orientation}
        />
      )}

      {content === 'board' && <BoardPreview project={project} navColor={navColor} />}

      {content === 'plans' && <PlansPreview project={project} navColor={navColor} scale={scale} />}

      {content === 'callsheet' && <CallsheetPreview project={project} navColor={navColor} />}

      <div className="ms-pdf-footer">
        {logoOn && <img className="ms-pdf-footerlogo" src={asset('/media/logo_print_2.png')} alt="MEDIA STORY" />}
        <div className="ms-pdf-footermeta">
          {project.name} · {CONTENT_OPTIONS.find((c) => c.value === content)?.label} · {project.shots.length}
        </div>
      </div>
    </>
  )
}

function StoryboardTable({
  project,
  navColor,
  scale,
  imageH,
  orientation,
}: {
  project: Project
  colCount: number
  navColor: string
  scale: number
  imageH: number
  orientation: Orientation
}) {
  const shots = project.shots.slice(0, 20)
  const rows = shots.length ? shots : [null]
  const hasImage = shots.some((s) => s?.image)
  const rowH = hasImage ? Math.max(22, imageH + 8) : 21.8

  return (
    <div className={`ms-pdf-tablewrap ${orientation === 'portrait' ? 'is-portrait' : ''}`}>
      <table className="ms-pdf-table" style={{ fontSize: `${11.4 * scale}px` }}>
        <colgroup>
          <col style={{ width: '8.2332%' }} />
          <col style={{ width: '15.4495%' }} />
          <col style={{ width: '9.2642%' }} />
          <col style={{ width: '9.2642%' }} />
          <col style={{ width: '28.8497%' }} />
          <col style={{ width: '28.8497%' }} />
        </colgroup>
        <thead>
          <tr style={{ background: navColor }}>
            <th><span className="ms-pdf-thtext">镜号</span></th>
            <th><span className="ms-pdf-thtext">画面</span></th>
            <th><span className="ms-pdf-thtext">景别</span></th>
            <th><span className="ms-pdf-thtext">时长（秒）</span></th>
            <th><span className="ms-pdf-thtext">内容</span></th>
            <th><span className="ms-pdf-thtext">备注</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s, i) => (
            <tr key={s?.id || 'empty'} style={{ height: rowH }}>
              <td className="is-center"><span className="ms-pdf-celltext">{s ? s.values.SHOT || String(i + 1) : '1'}</span></td>
              <td className="is-picture">
                {s?.image ? <img src={s.image} alt="" style={{ height: imageH }} /> : null}
              </td>
              <td className="is-center">{s?.values.SHOTSIZE || ''}</td>
              <td className="is-center">{s?.values.DURATION || ''}</td>
              <td>{s?.values.CONTENT || ''}</td>
              <td>{s?.values.REMARK || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BoardPreview({ project, navColor }: { project: Project; navColor: string }) {
  const shots = project.shots.slice(0, 8)
  return (
    <div className="ms-pdf-board">
      {shots.length === 0 && <div className="ms-pdf-empty">暂无分镜</div>}
      {shots.map((s, i) => (
        <div className="ms-pdf-boardcard" key={s.id}>
          <div className="ms-pdf-boardimg">
            {s.image ? (
              <img src={s.image} alt="" />
            ) : (
              <span>未添加图片</span>
            )}
          </div>
          <div className="ms-pdf-boardfoot">
            <span style={{ background: navColor }}>{s.values.SHOT || `镜头${i + 1}`}</span>
            <p>{s.values.CONTENT || s.values.SHOTSIZE || ''}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function PlansPreview({ project, navColor, scale }: { project: Project; navColor: string; scale: number }) {
  const plans = project.plans
  const shotsFor = (p: ShotPlan) => project.shots.filter((s: Shot) => s.planId === p.id)

  return (
    <div className="ms-pdf-plans" style={{ fontSize: `${10 * scale}px` }}>
      {plans.length === 0 && <div className="ms-pdf-empty">暂无拍摄计划</div>}
      {plans.map((plan) => (
        <div className="ms-pdf-plan" key={plan.id}>
          <div className="ms-pdf-planhead" style={{ borderLeftColor: navColor }}>
            <strong>{plan.title}</strong>
            <span>{[fmtDate(plan.date), plan.location].filter(Boolean).join(' · ')}</span>
          </div>
          {shotsFor(plan).length === 0 ? (
            <div className="ms-pdf-plantempty">暂无镜头</div>
          ) : (
            <table className="ms-pdf-plantable">
              <tbody>
                {shotsFor(plan).map((s, i) => (
                  <tr key={s.id}>
                    <td className="is-shotno">{s.values.SHOT || i + 1}</td>
                    <td className="is-planimg">
                      {s.image ? <img src={s.image} alt="" /> : <span />}
                    </td>
                    <td>{s.values.CONTENT || ''}</td>
                    <td className="is-right">{s.values.DURATION ? `${s.values.DURATION}s` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  )
}

function CallsheetPreview({ project, navColor }: { project: Project; navColor: string }) {
  const plan = project.plans[0]
  return (
    <div className="ms-pdf-callsheet">
      <div className="ms-pdf-cshead" style={{ background: navColor }}>
        <div>
          <strong>拍摄通告</strong>
          <span>{project.name}</span>
        </div>
        <div>{plan ? fmtDate(plan.date) : fmtDate(new Date().toISOString())}</div>
      </div>
      <div className="ms-pdf-csmeta">
        <div>
          <span>拍摄地点</span>
          <strong>{plan?.location || '—'}</strong>
        </div>
        <div>
          <span>集合时间</span>
          <strong>08:00</strong>
        </div>
        <div>
          <span>开机时间</span>
          <strong>09:00</strong>
        </div>
        <div>
          <span>拍摄计划</span>
          <strong>{plan?.title || '未指定'}</strong>
        </div>
      </div>
      <div className="ms-pdf-cstablewrap">
        <table className="ms-pdf-cstable">
          <thead>
            <tr style={{ background: navColor }}>
              <th>镜号</th>
              <th>景别</th>
              <th>内容</th>
              <th>时长</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {(plan ? project.shots.filter((s) => s.planId === plan.id) : project.shots.slice(0, 12)).map((s, i) => (
              <tr key={s.id}>
                <td className="is-center">{s.values.SHOT || i + 1}</td>
                <td className="is-center">{s.values.SHOTSIZE || ''}</td>
                <td>{s.values.CONTENT || ''}</td>
                <td className="is-center">{s.values.DURATION || ''}</td>
                <td>{s.values.REMARK || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="ms-pdf-csnote">
        请各组按时到场；如需调整，请提前与制片组联系。
      </div>
    </div>
  )
}
