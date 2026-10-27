import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '../lib/store'
import { navigate, useRoute } from '../lib/router'
import { asset } from '../lib/utils'

export default function SideRail() {
  const { toast } = useStore()
  const route = useRoute()
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  const accountPopRef = useRef<HTMLDivElement>(null)

  const onProjects = route.path.startsWith('/projects') || route.path.startsWith('/project')
  const onContacts = route.path === '/contacts' || route.path.startsWith('/contact')

  useEffect(() => {
    if (!accountOpen) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        accountRef.current &&
        !accountRef.current.contains(target) &&
        accountPopRef.current &&
        !accountPopRef.current.contains(target)
      )
        setAccountOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAccountOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [accountOpen])

  return (
    <aside className="ms-side">
      <div className="ms-side-children">
        <div className="ms-side-item ms-side-logo" onClick={() => navigate('/projects')} role="button" tabIndex={0}>
          <img src={asset('/media/side-logo.png')} alt="闪电分镜" width={40} height={40} draggable={false} />
        </div>

        <div className="ms-side-divider-wrap">
          <div className="ms-side-divider" />
        </div>

        <div className="ms-side-nav">
          <div
            className={`ms-side-item${onProjects ? ' is-active' : ''}`}
            onClick={() => navigate('/projects')}
            role="button"
            tabIndex={0}
          >
            <img src={asset('/media/tab-project.png')} alt="" width={40} height={40} draggable={false} />
            <div className="ms-side-label">项目</div>
          </div>
          <div
            className={`ms-side-item${onContacts ? ' is-active' : ''}`}
            onClick={() => navigate('/contacts')}
            role="button"
            tabIndex={0}
          >
            <img src={asset('/media/tab-contacts.png')} alt="" width={40} height={40} draggable={false} />
            <div className="ms-side-label">联系人</div>
          </div>
        </div>

        <div className="ms-side-user" ref={accountRef}>
          <div className="ms-side-user-divider" />
          <button className="ms-avatar-view" type="button" onClick={() => setAccountOpen((v) => !v)}>
            <img className="ms-avatar" src={asset('/media/avatar-default.png')} alt="" draggable={false} />
            <div className="ms-avatar-title">我的账号</div>
          </button>

          {accountOpen &&
            createPortal(
              <div className="ms-account-pop" ref={accountPopRef}>
                <div className="ms-account-inner">
                  <div className="ms-account-menu">
                    <div className="ms-account-top">
                      <img className="ms-account-avatar" src={asset('/media/avatar-default.png')} alt="" />
                      <p className="ms-account-name">用户_2763</p>
                    </div>
                    <div className="ms-account-item">
                      <div
                        className="ms-account-body"
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setAccountOpen(false)
                          toast('账号设置（教学复刻版）')
                        }}
                      >
                        <img src={asset('/media/account-settings.png')} alt="" />
                        <p>账号设置</p>
                      </div>
                    </div>
                    <div className="ms-account-item">
                      <div
                        className="ms-account-body"
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setAccountOpen(false)
                          toast('已退出登录（教学复刻版）')
                        }}
                      >
                        <img src={asset('/media/account-logout.png')} alt="" />
                        <p>退出登录</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>,
              document.body,
            )}
        </div>
      </div>
    </aside>
  )
}
