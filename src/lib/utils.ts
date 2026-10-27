export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

/**
 * Prefix a root-relative public asset path with the Vite base URL so the
 * build also works when hosted from a sub-path (e.g. GitHub Pages).
 */
export function asset(path: string) {
  if (!path.startsWith('/')) return path
  const base = import.meta.env.BASE_URL || '/'
  return `${base.endsWith('/') ? base : `${base}/`}${path.slice(1)}`
}

export function fmtDate(iso: string | null | undefined, withTime = false) {
  if (!iso) return ''
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  if (!withTime) return `${y}-${m}-${day}`
  return `${y}-${m}-${day} ${`${d.getHours()}`.padStart(2, '0')}:${`${d.getMinutes()}`.padStart(2, '0')}`
}

export function relativeDay(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const day = Math.floor(diff / 86400000)
  if (day <= 0) return '今天'
  if (day === 1) return '昨天'
  if (day < 7) return `${day} 天前`
  return fmtDate(iso)
}

export function sumDuration(shots: { values: Record<string, string> }[]) {
  return shots.reduce((acc, s) => acc + (parseFloat(s.values.DURATION || '0') || 0), 0)
}

export function totalSecondsLabel(sec: number) {
  const s = Math.round(sec * 10) / 10
  return `${s} 秒`
}

export async function fileToDataURL(file: File, maxSize = 1400): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
  if (!file.type.startsWith('image/')) return raw
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = raw
  })
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
  if (scale >= 1 && raw.length < 900_000) return raw
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.82)
}

export function downloadText(filename: string, text: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([`\ufeff${text}`], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function toCSV(rows: (string | number)[][]) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? '')
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
        })
        .join(','),
    )
    .join('\r\n')
}

export function copyText(text: string) {
  navigator.clipboard?.writeText(text).catch(() => {})
}
