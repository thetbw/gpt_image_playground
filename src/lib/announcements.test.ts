import { describe, expect, it, vi } from 'vitest'
import {
  deriveAnnouncementTitleFromFilename,
  fetchAnnouncementDocument,
  fetchAnnouncementIndex,
  isLatestAnnouncementUnread,
} from './announcements'

describe('announcements helpers', () => {
  it('derives a readable title from the markdown filename', () => {
    expect(deriveAnnouncementTitleFromFilename('2026-05-05-release-notes.md')).toBe('release notes')
    expect(deriveAnnouncementTitleFromFilename('/announcements/2026-05-05_公告.md')).toBe('公告')
  })

  it('treats a missing announcement index as empty', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 404 }))
    await expect(fetchAnnouncementIndex(fetchMock)).resolves.toEqual([])
  })

  it('normalizes index entries and falls back to the filename title', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify([
      { file: '2026-05-06-release-note.md' },
      { id: 'custom-id', title: '手动标题', file: '/announcements/2026-05-05-hotfix.md', publishedAt: '2026-05-05' },
    ]), { status: 200 }))

    await expect(fetchAnnouncementIndex(fetchMock)).resolves.toEqual([
      {
        id: '2026-05-06-release-note.md',
        title: 'release note',
        file: '/announcements/2026-05-06-release-note.md',
        publishedAt: '2026-05-06',
      },
      {
        id: 'custom-id',
        title: '手动标题',
        file: '/announcements/2026-05-05-hotfix.md',
        publishedAt: '2026-05-05',
      },
    ])
  })

  it('loads the markdown body for a selected announcement', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response('# 公告正文', { status: 200 }))
    await expect(fetchAnnouncementDocument({
      id: '2026-05-05-release.md',
      title: '发布公告',
      file: '/announcements/2026-05-05-release.md',
    }, fetchMock)).resolves.toEqual({
      id: '2026-05-05-release.md',
      title: '发布公告',
      file: '/announcements/2026-05-05-release.md',
      body: '# 公告正文',
    })
  })

  it('tracks whether the latest announcement is unread', () => {
    const announcements = [
      { id: '2026-05-06-release.md', title: '最新公告', file: '/announcements/2026-05-06-release.md' },
      { id: '2026-05-05-release.md', title: '旧公告', file: '/announcements/2026-05-05-release.md' },
    ]

    expect(isLatestAnnouncementUnread(announcements, [])).toBe(true)
    expect(isLatestAnnouncementUnread(announcements, ['2026-05-06-release.md'])).toBe(false)
  })
})
