import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { Icon } from '../components/Icons'
import SideRail from '../components/SideRail'
import { Confirm, Dropdown, EmptyState, Modal } from '../components/ui'
import { COMMON_ROLES, uid } from '../lib/data'
import type { Contact } from '../types'

const empty = (): Contact => ({ id: uid('ct'), name: '', role: '导演', phone: '', email: '', company: '' })

export default function Contacts() {
  const { state, upsertContact, deleteContact, toast } = useStore()
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<Contact | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  const list = useMemo(
    () =>
      state.contacts.filter((c) =>
        [c.name, c.role, c.phone, c.company].join(' ').toLowerCase().includes(q.trim().toLowerCase()),
      ),
    [state.contacts, q],
  )

  const save = () => {
    if (!editing) return
    if (!editing.name.trim()) return toast('请输入姓名')
    upsertContact({ ...editing, name: editing.name.trim() })
    setEditing(null)
    toast('联系人已保存', 'success')
  }

  return (
    <div className="min-h-full bg-[#f5f6f7] pl-[84px]">
      <SideRail />
      <div className="mx-auto max-w-[1180px] px-8 py-7">
        <header className="flex flex-wrap items-center gap-3">
          <h1 className="text-[22px] font-bold">联系人</h1>
          <span className="rounded-full bg-white px-2.5 py-1 text-[11.5px] text-[#8b8d97]">{state.contacts.length} 人</span>
          <div className="ml-auto flex w-full flex-wrap items-center gap-2.5 sm:w-auto">
            <div className="flex h-10 w-full min-w-0 items-center gap-2 rounded-full bg-white px-4 sm:w-[240px]">
              <Icon name="search" size={16} className="text-[#b3b4bc]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="搜索姓名 / 职位 / 公司"
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#b3b4bc]"
              />
            </div>
            <button className="btn btn-primary w-full justify-center sm:w-auto" onClick={() => setEditing(empty())}>
              <Icon name="plus" size={16} /> 新建联系人
            </button>
          </div>
        </header>

        <p className="mt-2 text-[12.5px] text-[#9b9ca5]">
          联系人会被用在「拍摄通告」的人员信息里，选择后自动带出电话。
        </p>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead className="bg-[#fafafb] text-[12px] text-[#8b8d97]">
              <tr>
                <th className="px-5 py-3 font-medium">姓名</th>
                <th className="px-5 py-3 font-medium">职位</th>
                <th className="px-5 py-3 font-medium">电话</th>
                <th className="px-5 py-3 font-medium">邮箱</th>
                <th className="px-5 py-3 font-medium">公司 / 团队</th>
                <th className="w-[70px] px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className="border-t border-line hover:bg-[#fcfcfd]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF3C4] text-[12px] font-semibold text-[#A2662A]">
                        {c.name.slice(0, 1)}
                      </span>
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[#6c6d76]">{c.role}</td>
                  <td className="px-5 py-3 text-[#6c6d76]">{c.phone || '—'}</td>
                  <td className="px-5 py-3 text-[#6c6d76]">{c.email || '—'}</td>
                  <td className="px-5 py-3 text-[#6c6d76]">{c.company || '—'}</td>
                  <td className="px-5 py-3">
                    <Dropdown
                      width={140}
                      portal
                      trigger={
                        <button className="rounded-md p-1.5 text-[#9b9ca5] hover:bg-canvas hover:text-ink">
                          <Icon name="more" size={16} />
                        </button>
                      }
                      items={[
                        { label: '编辑', icon: 'edit', onClick: () => setEditing({ ...c }) },
                        { label: '删除', icon: 'trash', danger: true, onClick: () => setRemoving(c.id) },
                      ]}
                    />
                  </td>
                </tr>
              ))}
              {!list.length && (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon="contacts"
                      title={q ? '没有匹配的联系人' : '还没有联系人'}
                      desc="把导演、制片、摄影加进来，拍摄通告可以一键带出"
                      compact
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={!!editing}
        title={editing && state.contacts.some((c) => c.id === editing.id) ? '编辑联系人' : '新建联系人'}
        onClose={() => setEditing(null)}
        width={520}
        footer={
          <>
            <button className="btn btn-primary px-8" onClick={save}>
              保存
            </button>
            <button className="btn btn-outline px-8" onClick={() => setEditing(null)}>
              取消
            </button>
          </>
        }
      >
        {editing && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[12.5px] text-[#6c6d76]">姓名</label>
              <input autoFocus className="field" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] text-[#6c6d76]">职位</label>
              <Dropdown
                width={220}
                align="left"
                trigger={
                  <button className="field flex items-center justify-between">
                    <span className="text-[13px]">{editing.role || '请选择'}</span>
                    <Icon name="chevron-down" size={14} className="text-[#b3b4bc]" />
                  </button>
                }
                items={COMMON_ROLES.map((r) => ({ label: r, checked: editing.role === r, onClick: () => setEditing({ ...editing, role: r }) }))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] text-[#6c6d76]">电话</label>
              <input className="field" value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} placeholder="138-0000-0000" />
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] text-[#6c6d76]">邮箱</label>
              <input className="field" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} placeholder="name@example.com" />
            </div>
            <div className="col-span-2">
              <label className="mb-1.5 block text-[12.5px] text-[#6c6d76]">公司 / 团队</label>
              <input className="field" value={editing.company} onChange={(e) => setEditing({ ...editing, company: e.target.value })} />
            </div>
          </div>
        )}
      </Modal>

      <Confirm
        open={!!removing}
        title="删除联系人"
        desc="只从联系人列表中移除，已填写的通告不受影响。"
        danger
        confirmText="删除"
        onCancel={() => setRemoving(null)}
        onConfirm={() => removing && deleteContact(removing)}
      />
    </div>
  )
}
