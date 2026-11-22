'use client'

import { useState, useTransition, type ReactNode } from 'react'
import Button from '@/components/Button'
import { noticeFor, type Notice } from '@/lib/owner-notices'

/**
 * Dashboard form that saves without reloading the page. On a problem the message
 * shows right under the button and everything typed stays put; on success it shows
 * a confirmation (and optionally clears the form for the next entry).
 */
export default function ActionForm({
  action,
  children,
  submitLabel,
  submitVariant = 'ghost',
  resetOnSuccess = false,
  className,
}: {
  action: (formData: FormData) => Promise<{ notice: string }>
  children: ReactNode
  submitLabel: string
  submitVariant?: 'primary' | 'secondary' | 'ghost'
  resetOnSuccess?: boolean
  className?: string
}) {
  const [result, setResult] = useState<Notice | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault()
        const form = e.currentTarget
        const data = new FormData(form)
        setResult(null)
        startTransition(async () => {
          let notice: Notice
          try {
            notice = noticeFor((await action(data)).notice)
          } catch {
            notice = noticeFor('error')
          }
          setResult(notice)
          if (notice.ok && resetOnSuccess) form.reset()
        })
      }}
    >
      {children}
      <Button type="submit" variant={submitVariant} size="md" className="self-start" disabled={pending}>
        {pending ? 'Saving…' : submitLabel}
      </Button>
      {result && (
        <p
          role={result.ok ? 'status' : 'alert'}
          className={[
            'rounded-lg border px-3 py-2 text-sm',
            result.ok ? 'border-success/40 bg-success/10 text-ink' : 'border-danger/50 bg-danger/10 text-ink',
          ].join(' ')}
        >
          {result.text}
        </p>
      )}
    </form>
  )
}
