export interface AnnouncementSummary {
  id: string
  title: string
  file: string
  publishedAt?: string
}

export interface AnnouncementDocument extends AnnouncementSummary {
  body: string
}

interface AnnouncementIndexEntry {
  id?: unknown
  title?: unknown
  file?: unknown
  publishedAt?: unknown
}

function normalizeAnnouncementFile(file: string): string {
  if (file.startsWith('/')) return file
  return `/announcements/${file.replace(/^\.?\/*/, '')}`
}

export function deriveAnnouncementTitleFromFilename(filename: string): string {
  const baseName = filename.split('/').pop() ?? filename
  const withoutExt = baseName.replace(/\.md$/i, '')
  const withoutDatePrefix = withoutExt.replace(/^\d{4}-\d{2}-\d{2}[-_]/, '')
  const humanized = withoutDatePrefix.replace(/[-_]+/g, ' ').trim()
  return humanized || withoutExt || '公告'
}

export function extractPublishedAtFromFilename(filename: string): string | undefined {
  const match = filename.match(/(\d{4}-\d{2}-\d{2})[-_]/)
  return match?.[1]
}

function normalizeAnnouncementEntry(entry: AnnouncementIndexEntry): AnnouncementSummary | null {
  if (typeof entry.file !== 'string' || entry.file.trim() === '') return null
  const normalizedFile = normalizeAnnouncementFile(entry.file.trim())
  const fileName = normalizedFile.split('/').pop() ?? normalizedFile
  const id = typeof entry.id === 'string' && entry.id.trim() !== '' ? entry.id.trim() : fileName
  const title =
    typeof entry.title === 'string' && entry.title.trim() !== ''
      ? entry.title.trim()
      : deriveAnnouncementTitleFromFilename(fileName)
  const publishedAt =
    typeof entry.publishedAt === 'string' && entry.publishedAt.trim() !== ''
      ? entry.publishedAt.trim()
      : extractPublishedAtFromFilename(fileName)

  return {
    id,
    title,
    file: normalizedFile,
    publishedAt,
  }
}

export async function fetchAnnouncementIndex(fetchImpl: typeof fetch = fetch): Promise<AnnouncementSummary[]> {
  try {
    const response = await fetchImpl('/announcements/index.json', { cache: 'no-store' })
    if (response.status === 404) return []
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const payload = await response.json() as unknown
    if (!Array.isArray(payload)) return []

    return payload
      .map((entry) => normalizeAnnouncementEntry(entry as AnnouncementIndexEntry))
      .filter((entry): entry is AnnouncementSummary => entry !== null)
  } catch {
    return []
  }
}

export async function fetchAnnouncementDocument(
  summary: AnnouncementSummary,
  fetchImpl: typeof fetch = fetch,
): Promise<AnnouncementDocument> {
  const response = await fetchImpl(summary.file, { cache: 'no-store' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  return {
    ...summary,
    body: await response.text(),
  }
}

export function isLatestAnnouncementUnread(
  announcements: AnnouncementSummary[],
  dismissedAnnouncementIds: string[],
): boolean {
  const latest = announcements[0]
  return Boolean(latest && !dismissedAnnouncementIds.includes(latest.id))
}
