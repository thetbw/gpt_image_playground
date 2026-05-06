import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useCloseOnEscape } from '../hooks/useCloseOnEscape'
import {
  fetchAnnouncementDocument,
  type AnnouncementDocument,
  type AnnouncementSummary,
} from '../lib/announcements'
import AnnouncementMarkdown from './AnnouncementMarkdown'

interface AnnouncementModalProps {
  announcements: AnnouncementSummary[]
  selectedAnnouncementId: string | null
  onSelect: (id: string) => void
  onClose: () => void
}

export default function AnnouncementModal({
  announcements,
  selectedAnnouncementId,
  onSelect,
  onClose,
}: AnnouncementModalProps) {
  const [documents, setDocuments] = useState<Record<string, AnnouncementDocument>>({})
  const [errorIds, setErrorIds] = useState<string[]>([])
  const pendingIdsRef = useRef(new Set<string>())
  const selectedAnnouncement = useMemo(
    () => announcements.find((announcement) => announcement.id === selectedAnnouncementId) ?? announcements[0] ?? null,
    [announcements, selectedAnnouncementId],
  )

  useCloseOnEscape(true, onClose)

  useEffect(() => {
    if (!selectedAnnouncement) return
    if (documents[selectedAnnouncement.id] || pendingIdsRef.current.has(selectedAnnouncement.id)) return

    let cancelled = false
    pendingIdsRef.current.add(selectedAnnouncement.id)

    fetchAnnouncementDocument(selectedAnnouncement)
      .then((document) => {
        if (cancelled) return
        setDocuments((current) => ({ ...current, [document.id]: document }))
        setErrorIds((current) => current.filter((id) => id !== document.id))
      })
      .catch(() => {
        if (cancelled) return
        setErrorIds((current) => (current.includes(selectedAnnouncement.id) ? current : [...current, selectedAnnouncement.id]))
      })
      .finally(() => {
        pendingIdsRef.current.delete(selectedAnnouncement.id)
      })

    return () => {
      cancelled = true
    }
  }, [documents, selectedAnnouncement])

  if (!selectedAnnouncement) return null

  const selectedDocument = documents[selectedAnnouncement.id]
  const loadFailed = errorIds.includes(selectedAnnouncement.id)

  return createPortal(
    <div
      data-no-drag-select
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-overlay-in" />
      <div
        className="relative z-10 flex h-[min(88vh,860px)] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/50 bg-white/95 shadow-2xl ring-1 ring-black/5 animate-modal-in dark:border-white/[0.08] dark:bg-gray-900/95 dark:ring-white/10"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-4 py-4 dark:border-white/[0.08] sm:px-5">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-100">
              <svg className="h-5 w-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 11.5v1a1.5 1.5 0 0 0 1.5 1.5H8l6 4V6l-6 4H5.5A1.5 1.5 0 0 0 4 11.5Z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3a1.5 1.5 0 0 0 3 0v-1.2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9.5a3.5 3.5 0 0 1 0 5" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7a6.5 6.5 0 0 1 0 10" />
              </svg>
              公告中心
            </h3>
            <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
              {selectedAnnouncement.title}
              {selectedAnnouncement.publishedAt ? ` · ${selectedAnnouncement.publishedAt}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/[0.06] dark:hover:text-gray-200"
            aria-label="关闭公告"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <aside className="border-b border-gray-200 bg-gray-50/70 px-3 py-3 dark:border-white/[0.08] dark:bg-gray-950/40 md:w-72 md:border-b-0 md:border-r md:px-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-medium uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                全部公告
              </h4>
              <span className="text-[11px] text-gray-400 dark:text-gray-500">
                {announcements.length} 条
              </span>
            </div>
            <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1 md:max-h-full md:flex-col md:overflow-y-auto md:overflow-x-hidden">
              {announcements.map((announcement) => {
                const active = announcement.id === selectedAnnouncement.id
                return (
                  <button
                    key={announcement.id}
                    type="button"
                    onClick={() => onSelect(announcement.id)}
                    className={`min-w-[220px] rounded-2xl border px-3 py-3 text-left transition md:min-w-0 ${
                      active
                        ? 'border-blue-300 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200'
                        : 'border-gray-200/80 bg-white/80 text-gray-600 hover:border-gray-300 hover:bg-white dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="truncate text-sm font-medium">{announcement.title}</div>
                    <div className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                      {announcement.publishedAt ?? announcement.id}
                    </div>
                  </button>
                )
              })}
            </div>
          </aside>

          <section className="min-h-0 flex-1 overflow-y-auto px-4 py-4 custom-scrollbar sm:px-5 sm:py-5">
            {loadFailed ? (
              <div className="flex h-full min-h-[260px] items-center justify-center rounded-3xl border border-dashed border-red-200 bg-red-50/70 px-6 text-center text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                当前公告加载失败，请稍后刷新页面重试。
              </div>
            ) : !selectedDocument ? (
              <div className="flex h-full min-h-[260px] items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50/80 px-6 text-center text-sm text-gray-500 dark:border-white/[0.08] dark:bg-gray-950/40 dark:text-gray-400">
                正在加载公告内容…
              </div>
            ) : (
              <AnnouncementMarkdown markdown={selectedDocument.body} sourcePath={selectedDocument.file} />
            )}
          </section>
        </div>
      </div>
    </div>,
    document.body,
  )
}
