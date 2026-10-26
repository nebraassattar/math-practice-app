import { useContext, useEffect } from 'react'
import { UNSAFE_DataRouterContext, useBlocker } from 'react-router-dom'
import { ConfirmDialog } from '../common/ConfirmDialog'

function RouteGuard({
  onLeave,
  isActive,
}: {
  onLeave: () => void
  isActive: () => boolean
}) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isActive() &&
      (currentLocation.pathname !== nextLocation.pathname ||
        currentLocation.search !== nextLocation.search),
  )
  return blocker.state === 'blocked' ? (
    <ConfirmDialog
      title="Leave this practice session?"
      message="Cancel to keep practicing. End and Leave saves completed answers and ends this session. Your unanswered question will not count."
      confirmLabel="End and Leave"
      onCancel={() => blocker.reset()}
      onConfirm={() => {
        onLeave()
        blocker.proceed()
      }}
    />
  ) : null
}

export function SessionNavigationGuard({
  onLeave,
  isActive,
}: {
  onLeave: () => void
  isActive: () => boolean
}) {
  const router = useContext(UNSAFE_DataRouterContext)
  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (isActive()) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [isActive])
  return router ? <RouteGuard onLeave={onLeave} isActive={isActive} /> : null
}
