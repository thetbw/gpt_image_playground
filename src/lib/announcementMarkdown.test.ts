import { describe, expect, it } from 'vitest'
import { parseAnnouncementMarkdown, parseInlineTokens, resolveAnnouncementUrl } from './announcementMarkdown'

describe('announcement markdown', () => {
  it('parses headings, paragraphs, and list items', () => {
    const blocks = parseAnnouncementMarkdown(`# 标题

这是第一段。

- 列表一
- 列表二`)

    expect(blocks).toHaveLength(3)
    expect(blocks[0]).toMatchObject({ type: 'heading', level: 1 })
    expect(blocks[1]).toMatchObject({ type: 'paragraph' })
    expect(blocks[2]).toMatchObject({ type: 'list' })
  })

  it('parses inline links and images', () => {
    expect(parseInlineTokens('访问 [说明](guide.md) 和 ![封面](cover.png)')).toEqual([
      { type: 'text', text: '访问 ' },
      { type: 'link', text: '说明', href: 'guide.md' },
      { type: 'text', text: ' 和 ' },
      { type: 'image', alt: '封面', src: 'cover.png' },
    ])
  })

  it('resolves relative assets and blocks unsafe schemes', () => {
    expect(resolveAnnouncementUrl('cover.png', '/announcements/2026-05-05-release.md', { origin: 'http://localhost:8080' }))
      .toBe('http://localhost:8080/announcements/cover.png')
    expect(resolveAnnouncementUrl('https://example.com/readme', '/announcements/2026-05-05-release.md', { origin: 'http://localhost:8080' }))
      .toBe('https://example.com/readme')
    expect(resolveAnnouncementUrl('javascript:alert(1)', '/announcements/2026-05-05-release.md', { origin: 'http://localhost:8080' }))
      .toBeNull()
    expect(resolveAnnouncementUrl('data:image/png;base64,aaa', '/announcements/2026-05-05-release.md', { origin: 'http://localhost:8080', image: true }))
      .toBeNull()
  })
})
