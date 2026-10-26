import { useEffect, useId, useRef } from 'react'

/** Native modal dialog provides focus trapping and prevents interaction with the page behind it. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const cancel = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const messageId = useId()
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const element = dialog.current
    element?.showModal()
    cancel.current?.focus()
    return () => {
      element?.close()
      if (previouslyFocused?.isConnected) previouslyFocused.focus()
    }
  }, [])
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
      className="confirm-dialog"
    >
      <h2 id={titleId}>{title}</h2>
      <p id={messageId}>{message}</p>
      <div className="result-actions">
        <button ref={cancel} className="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="button button-primary" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
