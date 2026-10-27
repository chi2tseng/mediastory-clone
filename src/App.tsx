import { useEffect } from 'react'
import { useStore } from './lib/store'
import { navigate, useRoute } from './lib/router'
import Projects from './pages/Projects'
import Contacts from './pages/Contacts'
import Templates from './pages/Templates'
import ProjectLayout from './components/ProjectLayout'
import Make from './pages/project/Make'
import Board from './pages/project/Board'
import Plans from './pages/project/Plans'
import CallSheets from './pages/project/CallSheets'
import ExportPage from './pages/project/ExportPage'
import { Toasts } from './components/ui'
import { Icon } from './components/Icons'

export default function App() {
  const { state } = useStore()
  const route = useRoute()
  useEffect(() => {
    if (route.path === '/login' || route.path === '/') navigate('/projects')
  }, [route.path])

  const exportRoute = route.parts[0] === 'exportNewV2'
  const projectId = exportRoute ? route.parts[2] : route.parts[1]
  const tab = exportRoute ? 'exportNewV2' : route.parts[2] || 'make'
  const project = state.projects.find((p) => p.id === projectId)

  if (projectId) {
    if (!project) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f2f3f6] text-[#b9bbc4]">
            <Icon name="film" size={26} />
          </div>
          <p className="text-[14px] text-[#6c6d76]">项目不存在或已被删除</p>
          <button className="btn btn-primary" onClick={() => navigate('/projects')}>
            返回项目列表
          </button>
          <Toasts />
        </div>
      )
    }

    if (tab === 'export' || tab === 'exportNewV2') {
      return (
        <>
          <ExportPage project={project} />
          <Toasts />
        </>
      )
    }

    return (
      <>
        <ProjectLayout project={project}>
          {tab === 'make' && <Make project={project} />}
          {tab === 'board' && <Board project={project} />}
          {tab === 'plans' && <Plans project={project} />}
          {tab === 'callsheet' && <CallSheets project={project} />}
          {tab === 'collab' && <Make project={project} />}
        </ProjectLayout>
        <Toasts />
      </>
    )
  }

  return (
    <>
      {route.path === '/contacts' ? <Contacts /> : route.path === '/templates' ? <Templates /> : <Projects />}
      <Toasts />
    </>
  )
}
