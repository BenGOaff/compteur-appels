import { useEffect, useRef, type ReactNode } from 'react'

type Props = {
  title: string
  onClose: () => void
  children: ReactNode
}

/** Feuille qui monte du bas : toutes les fenêtres de l'outil passent par ici, jamais par une boîte native du navigateur. */
export default function Sheet({ title, onClose, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  return (
    <div
      className="sheet-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
      >
        <div className="grip" aria-hidden="true" />
        {children}
      </div>
    </div>
  )
}
