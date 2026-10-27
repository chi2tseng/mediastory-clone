import type { SVGProps } from 'react'

export type IconName =
  | 'chevron-left' | 'chevron-right' | 'chevron-down' | 'chevron-up'
  | 'plus' | 'minus' | 'close' | 'check' | 'search' | 'bell'
  | 'grid' | 'layout' | 'sheet' | 'calendar' | 'card' | 'share' | 'export'
  | 'settings' | 'columns' | 'sort' | 'trash' | 'restore' | 'edit' | 'copy'
  | 'folder' | 'contacts' | 'user' | 'users' | 'image' | 'drag' | 'play'
  | 'print' | 'download' | 'clock' | 'pin' | 'more' | 'eye' | 'lock'
  | 'logout' | 'spark' | 'external' | 'camera' | 'film' | 'list' | 'upload'
  | 'zoom-in' | 'zoom-out' | 'maximize' | 'duplicate' | 'help' | 'arrow-right' | 'arrow-left'

const paths: Record<IconName, string> = {
  'chevron-left': 'M15 18l-6-6 6-6',
  'chevron-right': 'M9 18l6-6-6-6',
  'chevron-down': 'M6 9l6 6 6-6',
  'chevron-up': 'M18 15l-6-6-6 6',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  close: 'M18 6L6 18M6 6l12 12',
  check: 'M20 6L9 17l-5-5',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35',
  bell: 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  layout: 'M3 5h18v14H3zM3 10h18M9 10v9',
  sheet: 'M4 4h16v16H4zM4 9h16M4 14h16M10 4v16',
  calendar: 'M8 2v4M16 2v4M3 6h18v15H3zM3 11h18',
  card: 'M4 5h16v14H4zM8 9h8M8 13h5',
  share: 'M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
  export: 'M12 3v12M7 10l5 5 5-5M4 21h16',
  settings:
    'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z',
  columns: 'M4 4h16v16H4zM9.3 4v16M14.7 4v16',
  sort: 'M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4',
  trash: 'M3 6h18M8 6V4h8v2M5 6l1 15h12l1-15M10 11v6M14 11v6',
  restore: 'M3 3v6h6M3.5 9a9 9 0 102.1-3.4L3 9',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z',
  copy: 'M8 8h12v12H8zM4 16V4h12',
  folder: 'M3 7a2 2 0 012-2h4l2 3h10a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  contacts: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8',
  user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8',
  image: 'M3 4h18v16H3zM3 16l5-5 4 4 3-3 6 6M15 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
  drag: 'M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01',
  play: 'M7 4l13 8-13 8z',
  print: 'M6 9V3h12v6M6 18H4v-6h16v6h-2M6 14h12v7H6z',
  download: 'M12 3v12M7 10l5 5 5-5M4 21h16',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
  pin: 'M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1118 0zM12 13a3 3 0 100-6 3 3 0 000 6z',
  more: 'M12 6h.01M12 12h.01M12 18h.01',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 15a3 3 0 100-6 3 3 0 000 6z',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 018 0v4',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  spark: 'M12 2l2.2 6.3L21 10l-6.8 1.7L12 18l-2.2-6.3L3 10l6.8-1.7z',
  external: 'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3',
  camera: 'M3 7h4l2-2h6l2 2h4v13H3zM12 17a4 4 0 100-8 4 4 0 000 8z',
  film: 'M3 4h18v16H3zM7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  upload: 'M12 16V4M7 9l5-5 5 5M4 20h16',
  'zoom-in': 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35M11 8v6M8 11h6',
  'zoom-out': 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35M8 11h6',
  maximize: 'M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5',
  duplicate: 'M8 8h12v12H8zM4 16V4h12',
  help: 'M12 21a9 9 0 100-18 9 9 0 000 18zM9.1 9a3 3 0 015.8 1c0 2-3 3-3 3M12 17h.01',
  'arrow-right': 'M5 12h14M13 6l6 6-6 6',
  'arrow-left': 'M19 12H5M11 18l-6-6 6-6',
}

export function Icon({ name, size = 18, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      <path d={paths[name]} />
    </svg>
  )
}

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-label="闪电分镜">
      <rect width="64" height="64" rx="14" fill="#FFD84D" />
      <path d="M37 6 14 37h13l-4 21 27-33H36z" fill="#24252C" />
    </svg>
  )
}
