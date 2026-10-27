import { useEffect, useState } from 'react'

export interface Route {
  path: string
  parts: string[]
  query: URLSearchParams
}

function parse(): Route {
  const raw = window.location.hash.replace(/^#/, '') || '/'
  const [pathname, search] = raw.split('?')
  const path = pathname || '/'
  return {
    path,
    parts: path.split('/').filter(Boolean),
    query: new URLSearchParams(search || ''),
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parse)
  useEffect(() => {
    const onChange = () => setRoute(parse())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export function navigate(to: string) {
  if (window.location.hash === `#${to}`) return
  window.location.hash = to
}

export function replace(to: string) {
  window.location.replace(`${window.location.pathname}${window.location.search}#${to}`)
}
