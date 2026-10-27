import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Member, Project } from '../types'
import { useStore } from '../lib/store'
import { asset, copyText } from '../lib/utils'
import { uid } from '../lib/data'
import { MsIcon } from './MsIcon'

type LinkPermission = 'view' | 'edit'

const PERMISSION_LABEL: Record<LinkPermission, string> = { view: '可查看', edit: '可编辑' }

export default function ShareModal({
  project,
  open,
  onClose,
}: {
  project: Project
  open: boolean
  onClose: () => void
}) {
  const { state, updateProject, toast } = useStore()
  const [shareLink, setShareLink] = useState(true)
  const [linkPermission, setLinkPermission] = useState<LinkPermission>('view')
  const [linkMenu, setLinkMenu] = useState(false)
  const [advanced, setAdvanced] = useState(false)
  const [search, setSearch] = useState('')
  const [roleMenu, setRoleMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      setSearch('')
      setLinkMenu(false)
      setAdvanced(false)
      setRoleMenu(false)
      setCopied(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const others = project.members.filter((m) => m.role !== 'owner')
  const shareUrl = `${window.location.origin}${window.location.pathname}#/join/${project.shareToken}`

  const results = useMemo(() => {
    const q = search.trim()
    if (!q) return []
    return state.contacts
      .filter((c) => `${c.name}${c.phone}${c.company}`.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 5)
  }, [search, state.contacts])

  if (!open) return null

  const addContact = (name: string, phone: string) => {
    if (project.members.some((m) => m.name === name)) {
      toast('该联系人已在项目中')
      return
    }
    const member: Member = { id: uid('mem'), name, role: 'editor', email: phone }
    updateProject(project.id, (p) => ({ ...p, members: [...p.members, member] }))
    setSearch('')
    toast('已添加协作者', 'success')
  }

  const addBySearch = () => {
    const q = search.trim()
    if (!q) return
    if (results.length) return addContact(results[0].name, results[0].phone)
    if (/^\d{6,}$/.test(q.replace(/[\s-]/g, ''))) {
      addContact(`用户_${q.replace(/\D/g, '').slice(-4)}`, q)
      return
    }
    toast('没有找到该联系人，请先在「联系人」中创建')
  }

  const setRole = (member: Member, role: Member['role']) => {
    updateProject(project.id, (p) => ({
      ...p,
      members: p.members.map((m) => (m.id === member.id ? { ...m, role } : m)),
    }))
  }

  const copy = () => {
    copyText(shareUrl)
    setCopied(true)
    toast('链接已复制', 'success')
    window.setTimeout(() => setCopied(false), 1600)
  }

  return createPortal(
    <div className="ms-share-mask" onMouseDown={() => onClose()}>
      <div
        className="ms-share-modal"
        role="dialog"
        aria-modal="true"
        aria-label="项目共享"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="ms-share-titlebar">
          <div className="ms-share-title">项目共享</div>
          <button type="button" className="ms-share-close" aria-label="关闭" onClick={onClose}>
            <MsIcon name="icons_close_dialog" size={24} />
          </button>
        </div>

        <div className="ms-share-body">
          <div className="ms-share-main">
            <div className="ms-share-cooperate">
              <div className="ms-share-bigtitle">项目协作者</div>

              <div className="ms-share-alert">
                <span className="ms-share-alert-text">
                  协作者中拥有<span className="is-strong">编辑权限</span>的
                  <span className="is-strong">专业版用户</span>，可以编辑此项目
                </span>
              </div>

              <div className="ms-share-gridhead">
                <div className="is-first">项目协作者</div>
                <div>角色</div>
                <div>权限</div>
              </div>

              <div className="ms-share-rows">
                <div className="ms-share-row">
                  <div className="ms-share-person">
                    <img src={asset('/media/avatar-default.png')} alt="" className="ms-share-avatar" />
                    <span className="ms-share-name">用户_2763</span>
                  </div>
                  <div className="ms-share-role">
                    <button type="button" className="ms-share-tag" onClick={() => setRoleMenu((v) => !v)}>
                      <span>设置</span>
                      <MsIcon name="icons_down_mini" size={8} />
                    </button>
                    {roleMenu && (
                      <div className="ms-share-minimenu ms-share-role-menu">
                        <button type="button" onClick={() => setRoleMenu(false)}>
                          设置
                        </button>
                        <button type="button" onClick={() => setRoleMenu(false)}>
                          导演组
                        </button>
                        <button type="button" onClick={() => setRoleMenu(false)}>
                          摄影组
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="ms-share-permission">
                    <span className="ms-share-owner-role">超管</span>
                    <MsIcon name="icons_down_mini" size={8} className="ms-share-dim" />
                  </div>
                </div>

                {others.map((m) => (
                  <div className="ms-share-row" key={m.id}>
                    <div className="ms-share-person">
                      <span className="ms-share-avatar is-letter">{m.name.slice(0, 1)}</span>
                      <span className="ms-share-name">{m.name}</span>
                    </div>
                    <div className="ms-share-role">
                      <span className="ms-share-tag is-static">
                        <span>{m.role === 'editor' ? '编辑' : '查看'}</span>
                      </span>
                    </div>
                    <div className="ms-share-permission">
                      <div className="ms-share-select">
                        <select
                          value={m.role === 'owner' ? 'editor' : m.role}
                          onChange={(e) => setRole(m, e.target.value as Member['role'])}
                          aria-label={`${m.name} 的权限`}
                        >
                          <option value="editor">可编辑</option>
                          <option value="viewer">可查看</option>
                        </select>
                        <MsIcon name="icons_down_mini" size={8} />
                      </div>
                      <button
                        type="button"
                        className="ms-share-remove"
                        title="移除协作者"
                        onClick={() =>
                          updateProject(project.id, (p) => ({
                            ...p,
                            members: p.members.filter((x) => x.id !== m.id),
                          }))
                        }
                      >
                        <MsIcon name="icons_close_mini" size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="ms-share-search">
              <div className="ms-share-searchinner">
                <div className="ms-share-inputwrap">
                  <MsIcon name="iconteamwork_search" size={24} />
                  <input
                    ref={inputRef}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addBySearch()
                    }}
                    placeholder="输入联系人昵称或添加新手机号"
                  />
                </div>

                {search.trim() && (
                  <div className="ms-share-results">
                    {results.map((c) => (
                      <button type="button" key={c.id} onClick={() => addContact(c.name, c.phone)}>
                        <span className="ms-share-result-avatar">{c.name.slice(0, 1)}</span>
                        <span className="ms-share-result-name">{c.name}</span>
                        <span className="ms-share-result-meta">{c.company || c.phone}</span>
                        <MsIcon name="icons_add" size={12} />
                      </button>
                    ))}
                    {!results.length && (
                      <div className="ms-share-noresult">按 Enter 添加「{search.trim()}」</div>
                    )}
                  </div>
                )}

                <button type="button" className="ms-share-filter">
                  <span>所有联系人</span>
                  <MsIcon name="icons_down_mini" size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="ms-share-footer">
          <div className="ms-share-footer-left">
            <div className="ms-share-link">
              <div className="ms-share-linktitle">链接分享</div>
              <button
                type="button"
                role="switch"
                aria-checked={shareLink}
                className={`ms-share-switch ${shareLink ? 'is-on' : ''}`}
                onClick={() => setShareLink((v) => !v)}
              >
                <span />
              </button>
            </div>

            <div className="ms-share-dropdown">
              <div className="ms-share-dropdown-text">获得链接者</div>
              <button
                type="button"
                className="ms-share-permission-btn"
                disabled={!shareLink}
                onClick={() => setLinkMenu((v) => !v)}
              >
                <span>{PERMISSION_LABEL[linkPermission]}</span>
                <MsIcon name="icons_down_mini" size={8} />
              </button>
              {linkMenu && (
                <div className="ms-share-minimenu ms-share-link-menu">
                  {(['view', 'edit'] as LinkPermission[]).map((p) => (
                    <button
                      type="button"
                      key={p}
                      className={linkPermission === p ? 'is-active' : ''}
                      onClick={() => {
                        setLinkPermission(p)
                        setLinkMenu(false)
                      }}
                    >
                      {PERMISSION_LABEL[p]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="ms-share-advanced">
              <button type="button" className="ms-share-advanced-btn" onClick={() => setAdvanced((v) => !v)}>
                <MsIcon name="icons_setting" size={16} className="ms-share-advanced-icon" />
                <span>高级权限</span>
              </button>
              {advanced && (
                <div className="ms-share-advanced-panel">
                  <div className="ms-share-advanced-title">链接分享的高级设置</div>
                  <label>
                    <span>允许下载原图</span>
                    <input type="checkbox" defaultChecked />
                  </label>
                  <label>
                    <span>允许复制分镜内容</span>
                    <input type="checkbox" defaultChecked />
                  </label>
                  <label>
                    <span>显示水印</span>
                    <input type="checkbox" />
                  </label>
                  <p>高级权限仅对个人专业版及以上版本开放。</p>
                </div>
              )}
            </div>
          </div>

          <div className="ms-share-footer-right">
            <button type="button" className="ms-share-copy" onClick={copy}>
              <span>{copied ? '已复制' : '复制链接'}</span>
            </button>
            <button type="button" className="ms-share-done" onClick={onClose}>
              <span>完成</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
