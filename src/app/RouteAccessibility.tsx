import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/** Keep initial tab order; focus new route headings after in-app navigation. */
export function RouteAccessibility() {
  const { pathname } = useLocation()
  const previous = useRef(pathname)
  useEffect(() => {
    const changed = previous.current !== pathname
    let handled = false
    function updateHeading() {
      const heading = document.querySelector<HTMLElement>('main h1')
      if (!heading || heading.closest('[style*="display: none"]')) return
      document.title = `${heading?.textContent ?? 'Math Practice'} | Math Practice App`
      if (!handled && changed && pathname !== '/practice/session') {
        if (heading) {
          heading.tabIndex = -1
          heading.focus()
        }
      }
      handled = true
    }
    updateHeading()
    const observer = new MutationObserver(updateHeading)
    const main = document.querySelector('main')
    if (main) observer.observe(main, { childList: true, subtree: true })
    previous.current = pathname
    return () => observer.disconnect()
  }, [pathname])
  return null
}
