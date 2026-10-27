import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../lib/utils'
import { Icon, type IconName } from './Icons'
import { useStore } from '../lib/store'

/* ---------------- overlay stack ---------------- */

// Keeps track of open modals/drawers so only the topmost one reacts to Escape.
const overlayStack: number[] = []
let overlaySeq = 0

function useTopmostEscape(active: boolean, onClose: () => void) {
  const idRef = useRef(0)
  if (!idRef.current) idRef.current = ++overlaySeq
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!active) return
    const id = idRef.current
    // Re-register defensively in case a previous cleanup was skipped.
    const stale = overlayStack.lastIndexOf(id)
    if (stale >= 0) overlayStack.splice(stale, 1)
    overlayStack.push(id)

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (overlayStack[overlayStack.length - 1] !== id) return
      e.preventDefault()
      e.stopPropagation()
      closeRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      const i = overlayStack.lastIndexOf(id)
      if (i >= 0) overlayStack.splice(i, 1)
    }
  }, [active])
}

/* ---------------- modal ---------------- */

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  width = 480,
  bodyClass,
}: {
  open: boolean
  title?: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  width?: number
  bodyClass?: string
}) {
  useTopmostEscape(open, onClose)

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px]" onClick={onClose} />
      <div
        className="pop-in relative max-h-[88vh] w-full overflow-hidden rounded-2xl bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
        style={{ maxWidth: width }}
      >
        {title !== undefined && (
          <div className="flex items-center justify-between px-7 pt-6">
            <h3 className="text-[18px] font-semibold text-ink">{title}</h3>
            <button className="rounded-lg p-1.5 text-sub transition hover:bg-canvas hover:text-ink" onClick={onClose} aria-label="关闭">
              <Icon name="close" size={18} />
            </button>
          </div>
        )}
        <div className={cn('max-h-[70vh] overflow-y-auto px-7 py-5', bodyClass)}>{children}</div>
        {footer && <div className="flex items-center justify-end gap-3 border-t border-line px-7 py-4">{footer}</div>}
      </div>
    </div>
  )
}

/* ---------------- drawer ---------------- */

export function Drawer({
  open,
  title,
  onClose,
  children,
  footer,
  width = 380,
}: {
  open: boolean
  title: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  width?: number
}) {
  useTopmostEscape(open, onClose)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/25" onClick={onClose} />
      <div
        className="absolute top-0 right-0 flex h-full flex-col bg-white shadow-[-12px_0_40px_rgba(0,0,0,0.12)]"
        style={{ width, animation: 'slide-in .2s ease' }}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="text-[16px] font-semibold">{title}</h3>
          <button className="rounded-lg p-1.5 text-sub hover:bg-canvas hover:text-ink" onClick={onClose}>
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-line px-5 py-3">{footer}</div>}
      </div>
      <style>{`@keyframes slide-in{from{transform:translateX(24px);opacity:.6}to{transform:none;opacity:1}}`}</style>
    </div>
  )
}

/* ---------------- dropdown ---------------- */

export interface MenuItem {
  label: string
  icon?: IconName
  onClick?: () => void
  danger?: boolean
  disabled?: boolean
  divider?: boolean
  checked?: boolean
}

export function Dropdown({
  trigger,
  items,
  align = 'right',
  width = 180,
  className,
  open: controlledOpen,
  onOpenChange,
  children,
  portal = false,
}: {
  trigger?: ReactNode
  items?: MenuItem[]
  align?: 'left' | 'right'
  width?: number
  className?: string
  open?: boolean
  onOpenChange?: (v: boolean) => void
  children?: ReactNode
  portal?: boolean
}) {
  const [innerOpen, setInnerOpen] = useState(false)
  const open = controlledOpen ?? innerOpen
  const setOpen = (v: boolean) => {
    setInnerOpen(v)
    onOpenChange?.(v)
  }
  const ref = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (ref.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Dropdowns opened from clipping containers (table rows) are portaled to
  // <body> so the menu is never cut off by the row/table overflow.
  useLayoutEffect(() => {
    if (!open || !portal) return
    const place = () => {
      const host = ref.current
      if (!host) return
      const r = host.getBoundingClientRect()
      const margin = 8
      const gap = 8
      let left = align === 'right' ? r.right - width : r.left
      left = Math.max(margin, Math.min(left, window.innerWidth - width - margin))
      const h = menuRef.current?.offsetHeight ?? 0
      let top = r.bottom + gap
      if (h && top + h > window.innerHeight - margin) top = r.top - h - gap
      top = Math.max(margin, Math.min(top, window.innerHeight - h - margin))
      setPos({ top, left })
    }
    place()
    const raf = requestAnimationFrame(place)
    const close = () => setOpen(false)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open, portal, align, width])

  const menu = (
    <div
      ref={menuRef}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) setOpen(false)
      }}
      className={cn(
        'pop-in z-40 overflow-hidden rounded-xl border border-line bg-white py-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.14)]',
        portal ? 'fixed' : 'absolute',
        !portal && (align === 'right' ? 'right-0' : 'left-0'),
        !portal && 'mt-2',
      )}
      style={
        portal
          ? {
              top: pos?.top ?? -9999,
              left: pos?.left ?? -9999,
              width,
              zIndex: 60,
              visibility: pos ? 'visible' : 'hidden',
            }
          : { width }
      }
    >
      {children}
      {items?.map((item, i) =>
        item.divider ? (
          <div key={i} className="my-1.5 h-px bg-line" />
        ) : (
          <button
            key={i}
            disabled={item.disabled}
            className={cn(
              'flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] transition',
              item.danger ? 'text-[#e05252] hover:bg-[#fff3f3]' : 'text-[#3b3c44] hover:bg-canvas',
              item.disabled && 'cursor-not-allowed opacity-40',
            )}
            onClick={() => {
              setOpen(false)
              item.onClick?.()
            }}
          >
            {item.icon && <Icon name={item.icon} size={16} />}
            <span className="flex-1 truncate">{item.label}</span>
            {item.checked && <Icon name="check" size={15} />}
          </button>
        ),
      )}
    </div>
  )

  return (
    <div className={cn('relative', className)} ref={ref}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (portal ? createPortal(menu, document.body) : menu)}
    </div>
  )
}

/* ---------------- misc ---------------- */

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      className="flex items-center gap-2"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      <span
        className={cn(
          'relative h-[22px] w-[38px] rounded-full transition-colors',
          checked ? 'bg-brand' : 'bg-[#e3e4e9]',
        )}
      >
        <span
          className={cn(
            'absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-all',
            checked ? 'left-[18px]' : 'left-[2px]',
          )}
        />
      </span>
      {label && <span className="text-[13px] text-[#55565f]">{label}</span>}
    </button>
  )
}

export function HelpDot({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <span className="flex h-[18px] w-[18px] cursor-help items-center justify-center rounded-full bg-[#FFE9A3] text-[11px] font-semibold text-[#A2662A]">
        ?
      </span>
      <span className="pointer-events-none absolute top-6 left-1/2 z-30 w-[220px] -translate-x-1/2 rounded-lg bg-[#2b2c33] px-3 py-2 text-[12px] leading-relaxed text-white opacity-0 shadow-lg transition group-hover:opacity-100">
        {text}
      </span>
    </span>
  )
}

export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <div className="text-[13px] font-medium text-[#6c6d76]">{children}</div>
      {right}
    </div>
  )
}

export function EmptyState({
  icon = 'film',
  title,
  desc,
  action,
  compact,
}: {
  icon?: IconName
  title: string
  desc?: string
  action?: ReactNode
  compact?: boolean
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'py-10' : 'py-24')}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f2f3f6] text-[#b9bbc4]">
        <Icon name={icon} size={28} />
      </div>
      <p className="text-[14px] font-medium text-[#5d5e67]">{title}</p>
      {desc && <p className="mt-1.5 max-w-[320px] text-[12.5px] leading-relaxed text-[#9b9ca5]">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Toasts() {
  const { toasts, dismissToast } = useStore()
  return (
    <div className="fixed bottom-24 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismissToast(t.id)}
          className={cn(
            'fade-in rounded-full px-4 py-2 text-[13px] text-white shadow-lg',
            t.tone === 'danger' ? 'bg-[#d9534f]' : t.tone === 'success' ? 'bg-[#3f9e6a]' : 'bg-[#2b2c33]',
          )}
        >
          {t.text}
        </button>
      ))}
    </div>
  )
}

export function Confirm({
  open,
  title,
  desc,
  confirmText = '确定',
  danger,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  desc?: string
  confirmText?: string
  danger?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      width={400}
      footer={
        <>
          <button className="btn btn-outline" onClick={onCancel}>
            取消
          </button>
          <button
            className={cn('btn', danger ? 'bg-[#e05252] text-white' : 'btn-primary')}
            onClick={() => {
              onConfirm()
              onCancel()
            }}
          >
            {confirmText}
          </button>
        </>
      }
    >
      {desc && <p className="text-[13.5px] leading-relaxed text-[#6c6d76]">{desc}</p>}
    </Modal>
  )
}
