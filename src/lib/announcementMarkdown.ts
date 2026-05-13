export interface MarkdownTextToken {
  type: 'text'
  text: string
}

export interface MarkdownLinkToken {
  type: 'link'
  text: string
  href: string
}

export interface MarkdownImageToken {
  type: 'image'
  alt: string
  src: string
}

export type MarkdownInlineToken = MarkdownTextToken | MarkdownLinkToken | MarkdownImageToken

export interface MarkdownHeadingBlock {
  type: 'heading'
  level: number
  content: MarkdownInlineToken[]
}

export interface MarkdownParagraphBlock {
  type: 'paragraph'
  content: MarkdownInlineToken[]
}

export interface MarkdownListBlock {
  type: 'list'
  items: MarkdownInlineToken[][]
}

export type MarkdownBlock = MarkdownHeadingBlock | MarkdownParagraphBlock | MarkdownListBlock

const INLINE_TOKEN_PATTERN = /!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)/g

export function parseAnnouncementMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n')
  const blocks: MarkdownBlock[] = []
  let index = 0

  while (index < lines.length) {
    const currentLine = lines[index]?.trim()
    if (!currentLine) {
      index += 1
      continue
    }

    const headingMatch = currentLine.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: parseInlineTokens(headingMatch[2]),
      })
      index += 1
      continue
    }

    const listMatch = currentLine.match(/^[-*]\s+(.+)$/)
    if (listMatch) {
      const items: MarkdownInlineToken[][] = []
      while (index < lines.length) {
        const listLine = lines[index]?.trim()
        const match = listLine?.match(/^[-*]\s+(.+)$/)
        if (!match) break
        items.push(parseInlineTokens(match[1]))
        index += 1
      }
      blocks.push({ type: 'list', items })
      continue
    }

    const paragraphLines: string[] = []
    while (index < lines.length) {
      const paragraphLine = lines[index] ?? ''
      const trimmed = paragraphLine.trim()
      if (!trimmed) break
      if (/^(#{1,6})\s+(.+)$/.test(trimmed) || /^[-*]\s+(.+)$/.test(trimmed)) break
      paragraphLines.push(trimmed)
      index += 1
    }
    blocks.push({
      type: 'paragraph',
      content: parseInlineTokens(paragraphLines.join(' ')),
    })
  }

  return blocks
}

export function parseInlineTokens(text: string): MarkdownInlineToken[] {
  const tokens: MarkdownInlineToken[] = []
  let lastIndex = 0

  text.replace(INLINE_TOKEN_PATTERN, (match, imageAlt, imageSrc, linkText, linkHref, offset: number) => {
    if (offset > lastIndex) {
      tokens.push({
        type: 'text',
        text: text.slice(lastIndex, offset),
      })
    }

    if (typeof imageSrc === 'string' && imageSrc !== '') {
      tokens.push({
        type: 'image',
        alt: imageAlt ?? '',
        src: imageSrc.trim(),
      })
    } else if (typeof linkHref === 'string' && linkHref !== '') {
      tokens.push({
        type: 'link',
        text: (linkText ?? '').trim() || linkHref.trim(),
        href: linkHref.trim(),
      })
    } else {
      tokens.push({
        type: 'text',
        text: match,
      })
    }

    lastIndex = offset + match.length
    return match
  })

  if (lastIndex < text.length) {
    tokens.push({
      type: 'text',
      text: text.slice(lastIndex),
    })
  }

  return tokens.length > 0 ? tokens : [{ type: 'text', text }]
}

function getDefaultOrigin(): string {
  if (typeof window !== 'undefined') return window.location.origin
  return 'http://localhost'
}

export function resolveAnnouncementUrl(
  rawUrl: string,
  sourcePath: string,
  options?: { origin?: string; image?: boolean },
): string | null {
  const trimmed = rawUrl.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('#')) return trimmed

  try {
    const resolved = new URL(trimmed, new URL(sourcePath, options?.origin ?? getDefaultOrigin()))
    if (options?.image && resolved.protocol === 'data:') return null
    if (!['http:', 'https:', 'mailto:'].includes(resolved.protocol)) return null
    return resolved.toString()
  } catch {
    return null
  }
}
