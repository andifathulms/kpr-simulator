'use client'

import { useEffect, useState } from 'react'

/**
 * A sticky index of the sections below it. It replaces scrolling past ten
 * panels of equal weight with one row of named destinations — and it is an
 * index, not tabs: every section still renders, so print, find-in-page, and
 * a screen reader's heading list all see the whole page.
 *
 * The highlight follows the section nearest the top of the viewport. That is
 * reading position, not a figure, so it is the one piece of state here.
 */
export function SectionIndex({
  label,
  sections,
}: {
  label: string
  sections: readonly { readonly id: string; readonly label: string; readonly amber?: boolean }[]
}) {
  const [current, setCurrent] = useState<string | undefined>(sections[0]?.id)
  // The list is rebuilt on every render of the container; observe again only
  // when the set of sections actually changes.
  const ids = sections.map((section) => section.id).join(' ')

  useEffect(() => {
    const targets = ids
      .split(' ')
      .map((sectionId) => document.getElementById(sectionId))
      .filter((element): element is HTMLElement => element !== null)
    if (targets.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        const first = visible[0]
        if (first) setCurrent(first.target.id)
      },
      // A band just under the sticky header and this index.
      { rootMargin: '-180px 0px -55% 0px' },
    )
    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [ids])

  return (
    <nav
      aria-label={label}
      className="print-hidden z-30 -mx-4 border-b border-annotation/20 bg-blueprint/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-blueprint/80 sm:mx-0 sm:rounded-lg sm:border sm:px-2 lg:sticky lg:top-[7.75rem]"
    >
      <ul className="flex gap-1 overflow-x-auto py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sections.map((section) => {
          const active = current === section.id
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={active ? 'location' : undefined}
                className={`block whitespace-nowrap rounded-md px-3 py-1.5 text-caption transition-colors ${
                  active
                    ? `bg-raised font-medium ${section.amber ? 'text-unknown' : 'text-print'}`
                    : `${section.amber ? 'text-unknown/80 hover:text-unknown' : 'text-muted hover:text-print'} hover:bg-surface`
                }`}
              >
                {section.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
