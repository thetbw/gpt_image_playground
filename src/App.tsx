import { useEffect, useState } from 'react'
import { initStore } from './store'
import { useStore } from './store'
import { normalizeBaseUrl } from './lib/api'
import { normalizeSettings, switchApiProfileProvider } from './lib/apiProfiles'
import { useDockerApiUrlMigrationNotice } from './hooks/useDockerApiUrlMigrationNotice'
import type { ApiMode, ApiProvider, AppSettings } from './types'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import TaskGrid from './components/TaskGrid'
import InputBar from './components/InputBar'
import DetailModal from './components/DetailModal'
import Lightbox from './components/Lightbox'
import SettingsModal from './components/SettingsModal'
import ConfirmDialog from './components/ConfirmDialog'
import Toast from './components/Toast'
import MaskEditorModal from './components/MaskEditorModal'
import ImageContextMenu from './components/ImageContextMenu'
import AccessGateModal from './components/AccessGateModal'
import AnnouncementModal from './components/AnnouncementModal'
import { resolveInitialAccessGrant, subscribeToAccessUnauthorized } from './lib/accessGate'
import { fetchAnnouncementIndex } from './lib/announcements'

export function getUrlSettingsOverrides(search: string, settings: AppSettings): Partial<AppSettings> {
  const searchParams = new URLSearchParams(search)
  const nextSettings: Partial<AppSettings> = {}
  const managed = settings.managedConfig

  const apiUrlParam = searchParams.get('apiUrl')
  if (!managed.managedApiUrl && apiUrlParam !== null) {
    nextSettings.baseUrl = normalizeBaseUrl(apiUrlParam.trim())
  }

  const apiKeyParam = searchParams.get('apiKey')
  if (!managed.managedApiKey && !managed.managedProxyAuth && apiKeyParam !== null) {
    nextSettings.apiKey = apiKeyParam.trim()
  }

  const codexCliParam = searchParams.get('codexCli')
  if (!managed.managedCodexCli && codexCliParam !== null) {
    nextSettings.codexCli = codexCliParam.trim().toLowerCase() === 'true'
  }

  const apiModeParam = searchParams.get('apiMode')
  if (!managed.managedApiMode && (apiModeParam === 'images' || apiModeParam === 'responses')) {
    nextSettings.apiMode = apiModeParam
  }

  const providerParam = searchParams.get('provider')?.trim().toLowerCase()
  if (providerParam) {
    const provider: ApiProvider | null = providerParam === 'fal'
      ? 'fal'
      : ['openai', 'openai-compatible'].includes(providerParam)
        ? 'openai'
        : null
    if (provider) {
      const normalized = normalizeSettings(settings)
      const current = normalized.profiles.find((profile) => profile.id === normalized.activeProfileId) ?? normalized.profiles[0]
      if (current) {
        nextSettings.profiles = normalized.profiles.map((profile) =>
          profile.id === current.id
            ? {
                ...switchApiProfileProvider(profile, provider),
                ...(nextSettings.baseUrl !== undefined ? { baseUrl: nextSettings.baseUrl } : {}),
                ...(nextSettings.apiKey !== undefined ? { apiKey: nextSettings.apiKey } : {}),
                ...(provider === 'openai' && nextSettings.apiMode !== undefined ? { apiMode: nextSettings.apiMode as ApiMode } : {}),
                ...(provider === 'openai' && nextSettings.codexCli !== undefined ? { codexCli: nextSettings.codexCli } : {}),
              }
            : profile,
        )
        nextSettings.activeProfileId = current.id
      }
    }
  }

  return nextSettings
}

export default function App() {
  const setSettings = useStore((s) => s.setSettings)
  useDockerApiUrlMigrationNotice()
  const isAccessGranted = useStore((s) => s.isAccessGranted)
  const setAccessGranted = useStore((s) => s.setAccessGranted)
  const announcements = useStore((s) => s.announcements)
  const setAnnouncements = useStore((s) => s.setAnnouncements)
  const dismissAnnouncement = useStore((s) => s.dismissAnnouncement)
  const selectedAnnouncementId = useStore((s) => s.selectedAnnouncementId)
  const setSelectedAnnouncementId = useStore((s) => s.setSelectedAnnouncementId)
  const showAnnouncementModal = useStore((s) => s.showAnnouncementModal)
  const setShowAnnouncementModal = useStore((s) => s.setShowAnnouncementModal)
  const [accessChecked, setAccessChecked] = useState(false)

  useEffect(() => {
    let cancelled = false
    const searchParams = new URLSearchParams(window.location.search)
    const nextSettings = getUrlSettingsOverrides(window.location.search, useStore.getState().settings)
    setSettings(nextSettings)

    if (searchParams.has('apiUrl') || searchParams.has('apiKey') || searchParams.has('codexCli') || searchParams.has('apiMode') || searchParams.has('provider')) {
      searchParams.delete('apiUrl')
      searchParams.delete('apiKey')
      searchParams.delete('codexCli')
      searchParams.delete('apiMode')
      searchParams.delete('provider')

      const nextSearch = searchParams.toString()
      const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`
      window.history.replaceState(null, '', nextUrl)
    }

    const unsubscribe = subscribeToAccessUnauthorized(() => {
      setAccessGranted(false)
    })

    const initAccessGate = async () => {
      const granted = await resolveInitialAccessGrant()
      if (!cancelled) {
        setAccessGranted(granted)
        setAccessChecked(true)
      }
    }

    void initAccessGate()
    initStore()
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [setSettings, setAccessGranted])

  useEffect(() => {
    const preventPageImageDrag = (e: DragEvent) => {
      if ((e.target as HTMLElement | null)?.closest('img')) {
        e.preventDefault()
      }
    }

    document.addEventListener('dragstart', preventPageImageDrag)
    return () => document.removeEventListener('dragstart', preventPageImageDrag)
  }, [])

  useEffect(() => {
    if (!accessChecked || !isAccessGranted) return

    let cancelled = false

    fetchAnnouncementIndex().then((items) => {
      if (cancelled) return

      setAnnouncements(items)
      const latestAnnouncement = items[0]
      const currentSelectedId = useStore.getState().selectedAnnouncementId
      if (!latestAnnouncement) {
        setSelectedAnnouncementId(null)
        setShowAnnouncementModal(false)
        return
      }

      const nextSelectedId =
        currentSelectedId && items.some((item) => item.id === currentSelectedId)
          ? currentSelectedId
          : latestAnnouncement.id
      setSelectedAnnouncementId(nextSelectedId)

      if (!useStore.getState().dismissedAnnouncementIds.includes(latestAnnouncement.id)) {
        setShowAnnouncementModal(true)
      }
    })

    return () => {
      cancelled = true
    }
  }, [accessChecked, isAccessGranted, setAnnouncements, setSelectedAnnouncementId, setShowAnnouncementModal])

  const handleCloseAnnouncementModal = () => {
    const latestAnnouncement = announcements[0]
    if (latestAnnouncement) dismissAnnouncement(latestAnnouncement.id)
    setShowAnnouncementModal(false)
  }

  if (!accessChecked) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-950" />
  }

  if (!isAccessGranted) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950" />
        <AccessGateModal />
      </>
    )
  }

  return (
    <>
      <Header />
      <main data-home-main data-drag-select-surface className="pb-48">
        <div className="safe-area-x max-w-7xl mx-auto">
          <SearchBar />
          <TaskGrid />
        </div>
      </main>
      <InputBar />
      <DetailModal />
      <Lightbox />
      <SettingsModal />
      <ConfirmDialog />
      <Toast />
      <MaskEditorModal />
      <ImageContextMenu />
      {showAnnouncementModal && selectedAnnouncementId && announcements.length > 0 && (
        <AnnouncementModal
          announcements={announcements}
          selectedAnnouncementId={selectedAnnouncementId}
          onSelect={setSelectedAnnouncementId}
          onClose={handleCloseAnnouncementModal}
        />
      )}
    </>
  )
}
