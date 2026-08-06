'use client'

import { useState } from 'react'
import type { Locale } from '@/lib/i18n/locales'

/**
 * Sharing and printing.
 *
 * The link is simply the current URL, because the inputs already live in its
 * hash. That has a consequence worth saying out loud on the page rather than
 * burying in a privacy note: a fragment is never sent to a server, so the
 * figures do not reach a log — but they are fully readable to anyone the link
 * is handed to. Someone about to paste their household income into a group
 * chat deserves to be told that before they do it, not after.
 */
export function ShareBar({ locale }: { locale: Locale }) {
  const id = locale === 'id'
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      // Clipboard access can be refused; the address bar still holds the link.
      setCopied(false)
    }
  }

  return (
    <div className="print-hidden space-y-2">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={copy}
          className="sheet-label border border-annotation/40 px-4 py-2 text-xs text-annotation hover:text-print"
        >
          {copied
            ? id
              ? 'Tautan disalin'
              : 'Link copied'
            : id
              ? 'Salin tautan perhitungan'
              : 'Copy link to this calculation'}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="sheet-label border border-annotation/40 px-4 py-2 text-xs text-annotation hover:text-print"
        >
          {id ? 'Cetak' : 'Print'}
        </button>
      </div>
      <p className="max-w-xl text-xs text-print/60">
        {id
          ? 'Tautan memuat seluruh angka yang Anda isikan, termasuk penghasilan, di bagian setelah tanda pagar. Bagian itu tidak pernah dikirim ke server mana pun — tetapi siapa pun yang menerima tautannya bisa membacanya.'
          : 'The link carries every figure you entered, income included, in the part after the hash. That part is never sent to any server — but anyone you hand the link to can read it.'}
      </p>
    </div>
  )
}
