import { useState } from 'react'
import { useStore } from '../store'
import { useVersionCheck } from '../hooks/useVersionCheck'
import { isLatestAnnouncementUnread } from '../lib/announcements'
import HelpModal from './HelpModal'

export default function Header() {
  const setShowSettings = useStore((s) => s.setShowSettings)
  const announcements = useStore((s) => s.announcements)
  const dismissedAnnouncementIds = useStore((s) => s.dismissedAnnouncementIds)
  const setSelectedAnnouncementId = useStore((s) => s.setSelectedAnnouncementId)
  const setShowAnnouncementModal = useStore((s) => s.setShowAnnouncementModal)
  const { hasUpdate, latestRelease, dismiss } = useVersionCheck()
  const [showHelp, setShowHelp] = useState(false)
  const hasUnreadAnnouncement = isLatestAnnouncementUnread(announcements, dismissedAnnouncementIds)

  return (
    <header data-no-drag-select className="safe-area-top sticky top-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur border-b border-gray-200 dark:border-white/[0.08]">
      <div className="safe-area-x safe-header-inner max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-start gap-1">
          <h1 className="text-lg font-bold tracking-tight">
            <a
              href="https://github.com/CookSleep/gpt_image_playground"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-800 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              GPT Image Playground
            </a>
          </h1>
          {hasUpdate && latestRelease && (
            <a
              href={latestRelease.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={dismiss}
              className="px-1.5 py-0.5 mt-0.5 rounded border border-red-500/30 text-[10px] font-bold bg-red-500 text-white hover:bg-red-600 transition-colors animate-fade-in leading-none"
              title={`新版本 ${latestRelease.tag}`}
            >
              NEW
            </a>
          )}
        </div>
        <div className="flex items-center gap-1">
          {announcements.length > 0 && (
            <button
              onClick={() => {
                setSelectedAnnouncementId(useStore.getState().selectedAnnouncementId ?? announcements[0].id)
                setShowAnnouncementModal(true)
              }}
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
              title="查看公告"
            >
              <svg
                className="w-5 h-5 text-gray-600 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M4 11.5v1a1.5 1.5 0 0 0 1.5 1.5H8l6 4V6l-6 4H5.5A1.5 1.5 0 0 0 4 11.5Z" />
                <path d="M8 14v3a1.5 1.5 0 0 0 3 0v-1.2" />
                <path d="M17 9.5a3.5 3.5 0 0 1 0 5" />
                <path d="M19 7a6.5 6.5 0 0 1 0 10" />
              </svg>
              {hasUnreadAnnouncement && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-gray-950" />
              )}
            </button>
          )}
          <button
            onClick={() => setShowHelp(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
            title="操作指南"
          >
            <svg
              className="w-5 h-5 text-gray-600 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M12 6.25c-1.75-1.4-4.53-2.25-7-2.25a1 1 0 0 0-1 1v11.5a1 1 0 0 0 1.18.98c2.13-.37 4.58.22 6.82 1.52 2.24-1.3 4.69-1.89 6.82-1.52A1 1 0 0 0 20 16.5V5a1 1 0 0 0-1-1c-2.47 0-5.25.85-7 2.25Z" />
              <path d="M12 6.25V19" />
            </svg>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
            title="设置"
          >
            <svg
              className="w-5 h-5 text-gray-600 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </div>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </header>
  )
}
