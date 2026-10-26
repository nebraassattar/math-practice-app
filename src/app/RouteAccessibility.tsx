import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/** Keep initial tab order; focus new route headings after in-app navigation. */
export function RouteAccessibility() {
  const { pathname } = useLocation()
  const previous = useRef(pathname)
  useEffect(() => {
    const heading = document.querySelector<HTMLElement>('main h1')
    document.title = `${heading?.textContent ?? 'Math Practice'} | Math Practice App`
    if (previous.current !== pathname && pathname !== '/practice/session') {
      if (heading) {
        heading.tabIndex = -1
        heading.focus()
      }
    }
    previous.current = pathname
  }, [pathname])
  return null
}
