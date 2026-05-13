import type { ReactNode } from 'react'
import {
  parseAnnouncementMarkdown,
  resolveAnnouncementUrl,
  type MarkdownBlock,
  type MarkdownInlineToken,
} from '../lib/announcementMarkdown'

interface AnnouncementMarkdownProps {
  markdown: string
  sourcePath: string
}

function renderInlineTokens(tokens: MarkdownInlineToken[], sourcePath: string): ReactNode[] {
  return tokens.map((token, index) => {
    if (token.type === 'text') {
      return <span key={`text-${index}`}>{token.text}</span>
    }

    if (token.type === 'link') {
      const href = resolveAnnouncementUrl(token.href, sourcePath)
      if (!href) return <span key={`link-${index}`}>{token.text}</span>
      return (
        <a
          key={`link-${index}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-600 underline decoration-blue-300 underline-offset-4 transition hover:text-blue-700 dark:text-blue-400 dark:decoration-blue-500/60 dark:hover:text-blue-300"
        >
          {token.text}
        </a>
      )
    }

    const src = resolveAnnouncementUrl(token.src, sourcePath, { image: true })
    if (!src) return null
    return (
      <img
        key={`image-${index}`}
        src={src}
        alt={token.alt}
        className="my-4 w-full rounded-2xl border border-gray-200/80 bg-gray-100 object-contain shadow-sm dark:border-white/[0.08] dark:bg-gray-950"
        loading="lazy"
      />
    )
  })
}

function renderBlock(block: MarkdownBlock, index: number, sourcePath: string) {
  if (block.type === 'heading') {
    const classNameByLevel: Record<number, string> = {
      1: 'text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50',
      2: 'text-xl font-semibold text-gray-900 dark:text-gray-50',
      3: 'text-lg font-semibold text-gray-800 dark:text-gray-100',
      4: 'text-base font-semibold text-gray-800 dark:text-gray-100',
      5: 'text-sm font-semibold text-gray-800 dark:text-gray-100',
      6: 'text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400',
    }
    const commonProps = {
      key: `heading-${index}`,
      className: `${classNameByLevel[block.level] ?? classNameByLevel[6]} mt-6 first:mt-0`,
      children: renderInlineTokens(block.content, sourcePath),
    }
    switch (Math.min(block.level, 6)) {
      case 1:
        return <h1 {...commonProps} />
      case 2:
        return <h2 {...commonProps} />
      case 3:
        return <h3 {...commonProps} />
      case 4:
        return <h4 {...commonProps} />
      case 5:
        return <h5 {...commonProps} />
      default:
        return <h6 {...commonProps} />
    }
  }

  if (block.type === 'list') {
    return (
      <ul
        key={`list-${index}`}
        className="my-4 list-disc space-y-2 pl-5 text-sm leading-7 text-gray-600 marker:text-gray-400 dark:text-gray-300 dark:marker:text-gray-500"
      >
        {block.items.map((item, itemIndex) => (
          <li key={`item-${itemIndex}`}>{renderInlineTokens(item, sourcePath)}</li>
        ))}
      </ul>
    )
  }

  return (
    <p key={`paragraph-${index}`} className="my-4 text-sm leading-7 text-gray-600 dark:text-gray-300">
      {renderInlineTokens(block.content, sourcePath)}
    </p>
  )
}

export default function AnnouncementMarkdown({ markdown, sourcePath }: AnnouncementMarkdownProps) {
  const blocks = parseAnnouncementMarkdown(markdown)

  return (
    <div data-selectable-text className="announcement-markdown">
      {blocks.map((block, index) => renderBlock(block, index, sourcePath))}
    </div>
  )
}
