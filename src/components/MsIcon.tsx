import type { CSSProperties } from 'react'

export function MsIcon({
  name,
  size = 16,
  className,
  style,
}: {
  name: string
  size?: number | string
  className?: string
  style?: CSSProperties
}) {
  return (
    <svg
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      style={{ display: 'block', flex: 'none', ...style }}
      aria-hidden="true"
      focusable="false"
    >
      <use href={`#${name}`} />
    </svg>
  )
}
