import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { AppState, CallSheet, Contact, Project, Shot } from '../types'
import { makeProject, makeShot, seedState, uid } from './data'

const KEY = 'mediastory-clone-v1'

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      if (parsed && Array.isArray(parsed.projects)) return parsed
    }
  } catch {
    /* ignore corrupt storage */
  }
  return seedState()
}

export interface Toast {
  id: string
  text: string
  tone: 'default' | 'success' | 'danger'
}

interface Store {
  state: AppState
  toasts: Toast[]
  toast: (text: string, tone?: Toast['tone']) => void
  dismissToast: (id: string) => void
  login: (name: string, phone: string) => void
  logout: () => void
  createProject: (name: string, template: 'simple' | 'pro', icon: string) => Project
  updateProject: (id: string, updater: (p: Project) => Project) => void
  renameProject: (id: string, name: string) => void
  softDeleteProject: (id: string) => void
  restoreProject: (id: string) => void
  purgeProject: (id: string) => void
  duplicateProject: (id: string) => void
  addShot: (projectId: string, index?: number) => string
  updateShot: (projectId: string, shotId: string, patch: Partial<Shot>) => void
  setShotValue: (projectId: string, shotId: string, key: string, value: string) => void
  deleteShots: (projectId: string, shotIds: string[]) => void
  duplicateShot: (projectId: string, shotId: string) => void
  moveShot: (projectId: string, from: number, to: number) => void
  addPlan: (projectId: string, payload: { title: string; date: string; location: string; note: string }) => void
  updatePlan: (projectId: string, planId: string, patch: Partial<Project['plans'][number]>) => void
  deletePlan: (projectId: string, planId: string) => void
  assignShots: (projectId: string, planId: string | null, shotIds: string[]) => void
  saveCallSheet: (projectId: string, sheet: CallSheet) => void
  deleteCallSheet: (projectId: string, sheetId: string) => void
  upsertContact: (contact: Contact) => void
  deleteContact: (id: string) => void
  saveColumnPreset: (name: string, columns: Project['columns']) => void
  applyColumnPreset: (projectId: string, presetId: string) => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const loaded = load()
    if (!loaded.user) loaded.user = { name: '创作者', phone: '13800000000' }
    return loaded
  })
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Record<string, number>>({})

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      // Storage full (usually due to large images) — warn once.
      if (!timers.current.__quota) {
        timers.current.__quota = window.setTimeout(() => {
          delete timers.current.__quota
        }, 4000)
        setToasts((t) => [...t, { id: uid('t'), text: '浏览器存储空间不足，请减少图片数量', tone: 'danger' }])
      }
    }
  }, [state])

  const dismissToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const toast = useCallback((text: string, tone: Toast['tone'] = 'default') => {
    const id = uid('t')
    setToasts((t) => [...t.slice(-2), { id, text, tone }])
    timers.current[id] = window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
      delete timers.current[id]
    }, 2200)
  }, [])

  const patchProject = useCallback((id: string, fn: (p: Project) => Project) => {
    setState((s) => ({
      ...s,
      projects: s.projects.map((p) => (p.id === id ? fn(p) : p)),
    }))
  }, [])

  const api = useMemo<Store>(() => {
    const updateShot = (projectId: string, shotId: string, patch: Partial<Shot>) =>
      patchProject(projectId, (p) => ({
        ...p,
        shots: p.shots.map((s) => (s.id === shotId ? { ...s, ...patch, values: { ...s.values, ...(patch.values || {}) } } : s)),
      }))

    return {
      state,
      toasts,
      toast,
      dismissToast,
      login: (name, phone) => {
        setState((s) => ({ ...s, user: { name, phone } }))
      },
      logout: () => setState((s) => ({ ...s, user: null })),
      createProject: (name, template, icon) => {
        const project = makeProject(name, template, icon)
        setState((s) => ({ ...s, projects: [project, ...s.projects] }))
        return project
      },
      updateProject: patchProject,
      renameProject: (id, name) => patchProject(id, (p) => ({ ...p, name })),
      softDeleteProject: (id) => patchProject(id, (p) => ({ ...p, deletedAt: new Date().toISOString() })),
      restoreProject: (id) => patchProject(id, (p) => ({ ...p, deletedAt: null })),
      purgeProject: (id) => setState((s) => ({ ...s, projects: s.projects.filter((p) => p.id !== id) })),
      duplicateProject: (id) =>
        setState((s) => {
          const src = s.projects.find((p) => p.id === id)
          if (!src) return s
          const copy: Project = {
            ...structuredClone(src),
            id: uid('poj'),
            name: `${src.name} 副本`,
            createdAt: new Date().toISOString(),
            deletedAt: null,
            shareToken: uid('share'),
          }
          return { ...s, projects: [copy, ...s.projects] }
        }),
      addShot: (projectId, index) => {
        const shot = makeShot()
        patchProject(projectId, (p) => {
          const shots = [...p.shots]
          const at = typeof index === 'number' ? index + 1 : shots.length
          shots.splice(at, 0, shot)
          return { ...p, shots }
        })
        return shot.id
      },
      updateShot,
      setShotValue: (projectId, shotId, key, value) =>
        patchProject(projectId, (p) => ({
          ...p,
          shots: p.shots.map((s) => (s.id === shotId ? { ...s, values: { ...s.values, [key]: value } } : s)),
        })),
      deleteShots: (projectId, shotIds) =>
        patchProject(projectId, (p) => ({
          ...p,
          shots: p.shots.filter((s) => !shotIds.includes(s.id)),
          plans: p.plans.map((pl) => ({ ...pl, shotIds: pl.shotIds.filter((id) => !shotIds.includes(id)) })),
        })),
      duplicateShot: (projectId, shotId) =>
        patchProject(projectId, (p) => {
          const i = p.shots.findIndex((s) => s.id === shotId)
          if (i < 0) return p
          const src = p.shots[i]
          const copy: Shot = { ...structuredClone(src), id: uid('shot') }
          const shots = [...p.shots]
          shots.splice(i + 1, 0, copy)
          return { ...p, shots }
        }),
      moveShot: (projectId, from, to) =>
        patchProject(projectId, (p) => {
          if (from === to) return p
          const shots = [...p.shots]
          const [item] = shots.splice(from, 1)
          shots.splice(to, 0, item)
          return { ...p, shots }
        }),
      addPlan: (projectId, payload) =>
        patchProject(projectId, (p) => ({
          ...p,
          plans: [...p.plans, { id: uid('plan'), shotIds: [], ...payload }],
        })),
      updatePlan: (projectId, planId, patch) =>
        patchProject(projectId, (p) => ({
          ...p,
          plans: p.plans.map((pl) => (pl.id === planId ? { ...pl, ...patch } : pl)),
        })),
      deletePlan: (projectId, planId) =>
        patchProject(projectId, (p) => ({
          ...p,
          plans: p.plans.filter((pl) => pl.id !== planId),
          shots: p.shots.map((s) => (s.planId === planId ? { ...s, planId: null } : s)),
        })),
      assignShots: (projectId, planId, shotIds) =>
        patchProject(projectId, (p) => ({
          ...p,
          shots: p.shots.map((s) => (shotIds.includes(s.id) ? { ...s, planId } : s)),
          plans: p.plans.map((pl) => ({
            ...pl,
            shotIds: pl.id === planId ? Array.from(new Set([...pl.shotIds, ...shotIds])) : pl.shotIds.filter((id) => !shotIds.includes(id)),
          })),
        })),
      saveCallSheet: (projectId, sheet) =>
        patchProject(projectId, (p) => {
          const exists = p.callSheets.some((c) => c.id === sheet.id)
          return {
            ...p,
            callSheets: exists ? p.callSheets.map((c) => (c.id === sheet.id ? sheet : c)) : [sheet, ...p.callSheets],
          }
        }),
      deleteCallSheet: (projectId, sheetId) =>
        patchProject(projectId, (p) => ({ ...p, callSheets: p.callSheets.filter((c) => c.id !== sheetId) })),
      upsertContact: (contact) =>
        setState((s) => {
          const exists = s.contacts.some((c) => c.id === contact.id)
          return {
            ...s,
            contacts: exists ? s.contacts.map((c) => (c.id === contact.id ? contact : c)) : [contact, ...s.contacts],
          }
        }),
      deleteContact: (id) => setState((s) => ({ ...s, contacts: s.contacts.filter((c) => c.id !== id) })),
      saveColumnPreset: (name, columns) =>
        setState((s) => ({
          ...s,
          columnPresets: [{ id: uid('preset'), name, columns: structuredClone(columns) }, ...s.columnPresets],
        })),
      applyColumnPreset: (projectId, presetId) =>
        setState((s) => {
          const preset = s.columnPresets.find((p) => p.id === presetId)
          if (!preset) return s
          return {
            ...s,
            projects: s.projects.map((p) =>
              p.id === projectId ? { ...p, columns: structuredClone(preset.columns) } : p,
            ),
          }
        }),
    }
  }, [state, toasts, toast, dismissToast, patchProject])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useStore() {
  const store = useContext(Ctx)
  if (!store) throw new Error('useStore must be used inside StoreProvider')
  return store
}

export function useProject(id: string | undefined) {
  const { state } = useStore()
  return state.projects.find((p) => p.id === id)
}

