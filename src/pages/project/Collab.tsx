import { useState } from 'react'
import { useStore } from '../../lib/store'
import type { Member, Project } from '../../types'
import { copyText, fmtDate } from '../../lib/utils'
import { uid } from '../../lib/data'
import { Icon } from '../../components/Icons'
import { ProjectTitleBlock } from '../../components/ProjectLayout'
import { Dropdown, SectionLabel } from '../../components/ui'

const ROLE_LABEL: Record<Member['role'], string> = { owner: '拥有者', editor: '可编辑', viewer: '仅查看' }

export default function Collab({ project }: { project: Project }) {
  const { updateProject, state, toast } = useStore()
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState<'editor' | 'viewer'>('editor')
  const link = `${window.location.origin}${window.location.pathname}#/join/${project.shareToken}`

  const invite = () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast('请输入有效邮箱')
    const member: Member = { id: uid('mem'), name: email.split('@')[0], role: permission, email }
    updateProject(project.id, (p) => ({ ...p, members: [...p.members, member] }))
    setEmail('')
    toast('邀请已发送（演示）', 'success')
  }

  return (
    <div className="min-h-full overflow-auto bg-[#F5F6F7]">
      <div className="mx-auto max-w-[900px] px-7 py-6">
        <ProjectTitleBlock title="协作与分享" help="通过链接把项目分享给导演、客户或制片，权限可随时调整。" />

        <div className="mt-6 rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <h3 className="text-[14px] font-semibold">分享链接</h3>
          <p className="mt-1 text-[12px] text-[#9b9ca5]">获得链接的人可以按照下方权限打开这份分镜。</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="flex h-10 flex-1 items-center gap-2 rounded-lg border border-line bg-[#fafafb] px-3">
              <Icon name="external" size={14} className="text-[#b3b4bc]" />
              <input readOnly value={link} className="w-full bg-transparent text-[12px] text-[#6c6d76] outline-none" />
            </div>
            <Dropdown
              width={130}
              trigger={
                <button className="field flex w-[110px] items-center justify-between text-[12.5px]">
                  {ROLE_LABEL[permission]}
                  <Icon name="chevron-down" size={12} className="text-[#c3c4cb]" />
                </button>
              }
              items={[
                { label: '可编辑', checked: permission === 'editor', onClick: () => setPermission('editor') },
                { label: '仅查看', checked: permission === 'viewer', onClick: () => setPermission('viewer') },
              ]}
            />
            <button
              className="btn btn-primary h-10"
              onClick={() => {
                copyText(link)
                toast('链接已复制', 'success')
              }}
            >
              <Icon name="copy" size={15} /> 复制链接
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#FFF9E3] px-3 py-2 text-[11.5px] text-[#8a6a1e]">
            <Icon name="help" size={13} />
            这是教学克隆版，分享链接为本地演示，不会真正对外打开。
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold">成员</h3>
            <span className="text-[11.5px] text-[#9b9ca5]">{project.members.length} 人</span>
          </div>

          <div className="mt-3 divide-y divide-[#f4f4f6]">
            {project.members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#FFE9A3] to-[#FFD24D] text-[12px] font-semibold text-[#7a4a12]">
                  {m.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">{m.name}</div>
                  <div className="truncate text-[11px] text-[#a2a3ac]">{m.email || '本地账号'}</div>
                </div>
                {m.role === 'owner' ? (
                  <span className="text-[11.5px] text-[#9b9ca5]">拥有者</span>
                ) : (
                  <Dropdown
                    width={130}
                    trigger={
                      <button className="flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-[#6c6d76] hover:bg-canvas">
                        {ROLE_LABEL[m.role]} <Icon name="chevron-down" size={11} />
                      </button>
                    }
                    items={[
                      { label: '可编辑', checked: m.role === 'editor', onClick: () => updateProject(project.id, (p) => ({ ...p, members: p.members.map((x) => (x.id === m.id ? { ...x, role: 'editor' } : x)) })) },
                      { label: '仅查看', checked: m.role === 'viewer', onClick: () => updateProject(project.id, (p) => ({ ...p, members: p.members.map((x) => (x.id === m.id ? { ...x, role: 'viewer' } : x)) })) },
                      { divider: true, label: '' },
                      { label: '移除成员', icon: 'trash', danger: true, onClick: () => updateProject(project.id, (p) => ({ ...p, members: p.members.filter((x) => x.id !== m.id) })) },
                    ]}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-[#f4f4f6] pt-4">
            <SectionLabel>邀请新成员</SectionLabel>
            <div className="flex gap-2">
              <input className="field flex-1" placeholder="输入邮箱地址" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && invite()} />
              <Dropdown
                width={130}
                trigger={
                  <button className="field flex w-[100px] items-center justify-between text-[12.5px]">
                    {ROLE_LABEL[permission]}
                    <Icon name="chevron-down" size={12} className="text-[#c3c4cb]" />
                  </button>
                }
                items={[
                  { label: '可编辑', checked: permission === 'editor', onClick: () => setPermission('editor') },
                  { label: '仅查看', checked: permission === 'viewer', onClick: () => setPermission('viewer') },
                ]}
              />
              <button className="btn btn-primary" onClick={invite}>
                邀请
              </button>
            </div>
            <p className="mt-2 text-[11.5px] text-[#a2a3ac]">可从「联系人」页添加常用合作者：{state.contacts.slice(0, 3).map((c) => c.name).join('、')}…</p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <h3 className="text-[14px] font-semibold">项目信息</h3>
          <div className="mt-3 grid grid-cols-3 gap-3 text-[12px]">
            <Meta label="创建时间" value={fmtDate(project.createdAt, true)} />
            <Meta label="镜头数" value={`${project.shots.length} 镜`} />
            <Meta label="模板" value={project.template === 'simple' ? '简洁' : '专业'} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#fafafb] px-3 py-2">
      <div className="text-[10.5px] text-[#a2a3ac]">{label}</div>
      <div className="mt-0.5 text-[12px]">{value}</div>
    </div>
  )
}
