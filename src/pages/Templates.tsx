import { useState } from 'react'
import { useStore } from '../lib/store'
import { navigate } from '../lib/router'
import SideRail from '../components/SideRail'
import { Modal } from '../components/ui'
import { buildColumns, makeShot } from '../lib/data'
import { cn } from '../lib/utils'

interface TemplateDef {
  id: string
  name: string
  desc: string
  icon: string
  tint: string
  fields: string[]
  visible: string[]
  sample: { size: string; dur: string; text: string }[]
}

const TEMPLATES: TemplateDef[] = [
  {
    id: 'simple',
    name: '简洁分镜',
    desc: '最常用的六列结构，适合快速过本、和客户对齐画面。',
    icon: '🎬',
    tint: 'from-[#FDE68A] to-[#F59E0B]',
    fields: ['镜号', '画面', '景别', '时长', '内容', '备注'],
    visible: ['SHOT', 'PICTURE', 'SHOTSIZE', 'DURATION', 'CONTENT', 'REMARK'],
    sample: [
      { size: '中景', dur: '3', text: '开场：主角走进画面，环境声先入。' },
      { size: '特写', dur: '2', text: '手部动作特写，强调关键道具。' },
      { size: '全景', dur: '4', text: '拉远交代空间关系，片名出现。' },
    ],
  },
  {
    id: 'pro',
    name: '专业分镜',
    desc: '14 个制作字段，景别、运镜、装备、焦段一次写清，可直接下发摄影组。',
    icon: '🎥',
    tint: 'from-[#C7D2FE] to-[#6366F1]',
    fields: ['镜号', '画面', '景别', '时长', '内容', '备注', '场景预期', '声音', '角度', '运镜', '装备', '焦段'],
    visible: ['SHOT', 'PICTURE', 'SHOTSIZE', 'DURATION', 'CONTENT', 'REMARK', 'SCENEADVICE', 'VOICE', 'CAMERAANGLE', 'CAMERAMOVE', 'CAMERAEQUIPMENT', 'LENS'],
    sample: [
      { size: '大远景', dur: '4', text: '城市清晨航拍，光线穿过楼群。' },
      { size: '中景', dur: '3', text: '主角在窗前打电话，画外音铺陈。' },
      { size: '近景', dur: '2', text: '放下电话，表情发生变化。' },
    ],
  },
  {
    id: 'tvc',
    name: '广告 TVC',
    desc: '产品特写与卖点镜头为主的 30 秒结构，含参考图与焦段备注。',
    icon: '📸',
    tint: 'from-[#FBCFE8] to-[#EC4899]',
    fields: ['镜号', '画面', '参考', '景别', '时长', '内容', '焦段'],
    visible: ['SHOT', 'PICTURE', 'REFERENCE', 'SHOTSIZE', 'DURATION', 'CONTENT', 'LENS', 'REMARK'],
    sample: [
      { size: '特写', dur: '2', text: '产品从暗处被一束光打亮，logo 反光。' },
      { size: '近景', dur: '3', text: '手拿起产品，指腹划过材质纹理。' },
      { size: '中景', dur: '3', text: '使用者微笑，产品在画面右下角保持露出。' },
    ],
  },
  {
    id: 'shortfilm',
    name: '微电影 / 短片',
    desc: '以场景与情绪推进为主，预留声音与场景预期，适合叙事短片。',
    icon: '🎭',
    tint: 'from-[#BBF7D0] to-[#059669]',
    fields: ['镜号', '画面', '景别', '时长', '场景预期', '内容', '声音'],
    visible: ['SHOT', 'PICTURE', 'SHOTSIZE', 'DURATION', 'SCENEADVICE', 'CONTENT', 'VOICE', 'REMARK'],
    sample: [
      { size: '全景', dur: '5', text: '雨夜街道，霓虹在水洼里碎成一片。' },
      { size: '中近景', dur: '4', text: '她站在屋檐下，犹豫着要不要走进雨里。' },
      { size: '特写', dur: '2', text: '脚尖踏进水洼。' },
    ],
  },
  {
    id: 'mv',
    name: 'MV / 音乐短片',
    desc: '按段落与节奏切分，强调运镜与剪辑点，标注对应歌词。',
    icon: '🎧',
    tint: 'from-[#E9D5FF] to-[#8B5CF6]',
    fields: ['镜号', '画面', '景别', '时长', '内容', '运镜', '备注'],
    visible: ['SHOT', 'PICTURE', 'SHOTSIZE', 'DURATION', 'CONTENT', 'CAMERAMOVE', 'VOICE', 'REMARK'],
    sample: [
      { size: '近景', dur: '2', text: '主歌第一句，歌手对镜头开口。' },
      { size: '全景', dur: '2', text: '鼓点进，镜头环绕舞台。' },
      { size: '大特写', dur: '1', text: '副歌爆点，手部划过镜头。' },
    ],
  },
  {
    id: 'doc',
    name: '纪录片',
    desc: '采访 + 空镜双线结构，记录场景预期与收音方式。',
    icon: '🌆',
    tint: 'from-[#BAE6FD] to-[#0284C7]',
    fields: ['镜号', '画面', '景别', '时长', '内容', '声音', '备注'],
    visible: ['SHOT', 'PICTURE', 'SHOTSIZE', 'DURATION', 'CONTENT', 'VOICE', 'REMARK', 'SCENEADVICE'],
    sample: [
      { size: '空镜 · 全景', dur: '6', text: '工地清晨，塔吊在雾里缓慢转向。' },
      { size: '中景', dur: '8', text: '采访：他讲起二十年前第一次进城。' },
      { size: '特写', dur: '3', text: '手上磨出的老茧。' },
    ],
  },
]

export default function Templates() {
  const { createProject, updateProject, toast } = useStore()
  const [picked, setPicked] = useState<TemplateDef | null>(null)
  const [name, setName] = useState('')

  const create = () => {
    if (!picked) return
    const project = createProject(name.trim() || picked.name, picked.id === 'simple' ? 'simple' : 'pro', picked.icon)
    const columns = buildColumns(picked.id === 'simple' ? 'simple' : 'pro').map((c) => ({
      ...c,
      show: picked.visible.includes(c._id),
    }))
    const shots = picked.sample.map((s) =>
      makeShot({ values: { SHOTSIZE: s.size.replace('空镜 · ', ''), DURATION: s.dur, CONTENT: s.text } }),
    )
    updateProject(project.id, (p) => ({ ...p, columns, shots }))
    toast('已从模板创建项目', 'success')
    navigate(`/project/${project.id}/make`)
    setPicked(null)
    setName('')
  }

  return (
    <div className="min-h-full bg-[#f5f6f7] pl-[84px]">
      <SideRail />
      <div className="mx-auto max-w-[1180px] px-8 py-7">
        <header className="flex items-center gap-3">
          <h1 className="text-[22px] font-bold">模板库</h1>
          <span className="rounded-full bg-white px-2.5 py-1 text-[11.5px] text-[#8b8d97]">{TEMPLATES.length} 套结构</span>
        </header>
        <p className="mt-2 text-[12.5px] text-[#9b9ca5]">选一套现成的分镜字段组合，创建后仍可在「列设置」里自由增删。</p>

        <div className="mt-6 grid grid-cols-1 gap-5 pb-20 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setPicked(t)
                setName(t.name)
              }}
              className="group overflow-hidden rounded-2xl border border-line bg-white text-left transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(20,24,40,0.10)]"
            >
              <div className={cn('relative flex h-[110px] items-center justify-center bg-gradient-to-br', t.tint)}>
                <span className="text-[34px] drop-shadow">{t.icon}</span>
                <div className="absolute right-3 bottom-3 rounded-md bg-black/30 px-2 py-0.5 text-[10.5px] text-white backdrop-blur">
                  {t.fields.length} 列
                </div>
              </div>
              <div className="p-4">
                <div className="text-[14px] font-semibold">{t.name}</div>
                <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[#9b9ca5]">{t.desc}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {t.fields.slice(0, 6).map((f) => (
                    <span key={f} className="rounded-md bg-[#f4f5f7] px-1.5 py-0.5 text-[10.5px] text-[#7b7c86]">
                      {f}
                    </span>
                  ))}
                  {t.fields.length > 6 && (
                    <span className="rounded-md bg-[#f4f5f7] px-1.5 py-0.5 text-[10.5px] text-[#7b7c86]">+{t.fields.length - 6}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Modal
        open={!!picked}
        title={`使用「${picked?.name || ''}」`}
        onClose={() => setPicked(null)}
        width={440}
        footer={
          <>
            <button className="btn btn-primary px-8" onClick={create}>
              创建项目
            </button>
            <button className="btn btn-outline px-8" onClick={() => setPicked(null)}>
              取消
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[12.5px] text-[#6c6d76]">项目名</label>
            <input autoFocus className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="输入项目名" />
          </div>
          <div className="rounded-lg bg-[#fafafb] p-3 text-[12px] leading-relaxed text-[#7b7c86]">
            创建后会自动带出 {picked?.fields.length} 个字段的表格结构，并写入 3 个示例镜头，可直接改。
          </div>
        </div>
      </Modal>
    </div>
  )
}
