import { useEffect } from 'react'
import { initStore } from './store'
import { useStore } from './store'
import { normalizeBaseUrl } from './lib/api'
import type { ApiMode, AppSettings } from './types'
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
import AccessGateModal, { readAccessSession } from './components/AccessGateModal'

export function getUrlSettingsOverrides(search: string, settings: AppSettings): Partial<AppSettings> {
  const searchParams = new URLSearchParams(search)
  const nextSettings: { baseUrl?: string; codexCli?: boolean; apiMode?: ApiMode } = {}
  const managed = settings.managedConfig

  const apiUrlParam = searchParams.get('apiUrl')
  if (!managed.managedApiUrl && apiUrlParam !== null) {
    nextSettings.baseUrl = normalizeBaseUrl(apiUrlParam.trim())
  }

  const codexCliParam = searchParams.get('codexCli')
  if (!managed.managedCodexCli && codexCliParam !== null) {
    nextSettings.codexCli = codexCliParam.trim().toLowerCase() === 'true'
  }

  const apiModeParam = searchParams.get('apiMode')
  if (!managed.managedApiMode && (apiModeParam === 'images' || apiModeParam === 'responses')) {
    nextSettings.apiMode = apiModeParam
  }

  return nextSettings
}

export default function App() {
  const setSettings = useStore((s) => s.setSettings)
  const isAccessGranted = useStore((s) => s.isAccessGranted)
  const setAccessGranted = useStore((s) => s.setAccessGranted)

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const nextSettings = getUrlSettingsOverrides(window.location.search, useStore.getState().settings)
    setSettings(nextSettings)

    if (searchParams.has('apiUrl') || searchParams.has('apiKey') || searchParams.has('codexCli') || searchParams.has('apiMode')) {
      searchParams.delete('apiUrl')
      searchParams.delete('apiKey')
      searchParams.delete('codexCli')
      searchParams.delete('apiMode')

      const nextSearch = searchParams.toString()
      const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`
      window.history.replaceState(null, '', nextUrl)
    }

    setAccessGranted(readAccessSession())
    initStore()
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
    </>
  )
}
