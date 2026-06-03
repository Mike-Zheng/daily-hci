import { XMLParser } from 'fast-xml-parser'
import type { Paper } from '../../src/types/paper'

const RSS_FEEDS = [
  'https://rss.arxiv.org/rss/cs.HC',
  'https://rss.arxiv.org/rss/cs.CY',
]

const API_BASE = 'http://export.arxiv.org/api/query'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
})

function cleanLatex(text: string): string {
  return text
    .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1')
    .replace(/\\\\/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseRssItem(item: any, feedCategory: string): Paper | null {
  // Seed categories with the feed category (RDF RSS items have no per-item <category> tags)
  const categories: string[] = feedCategory ? [feedCategory] : []
  if (item.category) {
    const cats = Array.isArray(item.category) ? item.category : [item.category]
    cats.forEach((c: any) => {
      const term = typeof c === 'string' ? c : (c?.['@_term'] ?? '')
      if (term && !categories.includes(term)) categories.push(term)
    })
  }

  // Include if this is a cs.HC feed or if cs.HC appears in item categories
  if (feedCategory !== 'cs.HC' && !categories.some((c) => c === 'cs.HC')) return null

  const link = item.link || ''
  const arxivId = link.replace('https://arxiv.org/abs/', '')

  const description = item.description || ''
  // Extract abstract: after "Abstract: " until end
  const abstractMatch = description.match(/Abstract:\s*([\s\S]*)/)
  const abstract = abstractMatch ? cleanLatex(abstractMatch[1]) : cleanLatex(description)

  const creatorsRaw = item['dc:creator'] || ''
  const authors = creatorsRaw
    .split(',')
    .map((a: string) => cleanLatex(a.trim()))
    .filter(Boolean)

  return {
    id: arxivId,
    title: cleanLatex(item.title || ''),
    authors,
    abstract,
    date: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
    source: 'arxiv',
    url: link,
    pdfUrl: link.replace('/abs/', '/pdf/') + '.pdf',
    arxivId,
    categories,
    tags: [],
  }
}

async function fetchRss(): Promise<Paper[]> {
  const papers: Paper[] = []

  for (const feedUrl of RSS_FEEDS) {
    // Extract category from URL, e.g. 'cs.HC' from '.../rss/cs.HC'
    const feedCategory = feedUrl.split('/').pop() || ''

    try {
      const res = await fetch(feedUrl, {
        headers: { 'User-Agent': 'daily-hci/1.0 (research aggregator; https://github.com/Mike-Zheng/daily-hci)' },
      })
      if (!res.ok) continue
      const xml = await res.text()
      const parsed = parser.parse(xml)
      // arXiv RSS uses RDF 1.0 (root: rdf:RDF, items at top-level), not RSS 2.0
      const items = parsed?.['rdf:RDF']?.item ?? parsed?.rss?.channel?.item
      if (!items) continue

      const itemList = Array.isArray(items) ? items : [items]
      for (const item of itemList) {
        const paper = parseRssItem(item, feedCategory)
        if (paper) papers.push(paper)
      }
    } catch (e) {
      console.warn(`[arXiv RSS] Failed to fetch ${feedUrl}:`, e)
    }
  }

  return papers
}

function toArxivDate(d: Date, endOfDay = false): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return endOfDay ? `${y}${m}${day}235959` : `${y}${m}${day}000000`
}

async function fetchApi(): Promise<Paper[]> {
  const papers: Paper[] = []
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const query = `cat:cs.HC AND submittedDate:[${toArxivDate(sevenDaysAgo)} TO ${toArxivDate(now, true)}]`
  const url = `${API_BASE}?search_query=${encodeURIComponent(query)}&sortBy=submittedDate&sortOrder=descending&start=0&max_results=200`

  try {
    const res = await fetch(url)
    if (!res.ok) return papers
    const xml = await res.text()
    const parsed = parser.parse(xml)
    const entries = parsed?.feed?.entry
    if (!entries) return papers

    const entryList = Array.isArray(entries) ? entries : [entries]
    for (const entry of entryList) {
      const id = entry.id || ''
      const arxivId = id.replace('http://arxiv.org/abs/', '')

      const categories: string[] = []
      const cats = Array.isArray(entry.category) ? entry.category : [entry.category]
      cats.forEach((c: any) => {
        const term = c?.['@_term'] || c
        if (typeof term === 'string') categories.push(term)
      })

      const authorsList = Array.isArray(entry.author) ? entry.author : [entry.author]
      const authors = authorsList.map((a: any) => cleanLatex(a?.name || '')).filter(Boolean)

      const links = Array.isArray(entry.link) ? entry.link : [entry.link]
      const pdfLink = links.find((l: any) => l?.['@_title'] === 'pdf')
      const absLink = links.find((l: any) => l?.['@_type'] === 'text/html')

      papers.push({
        id: arxivId,
        title: cleanLatex(entry.title || ''),
        authors,
        abstract: cleanLatex(entry.summary || ''),
        date: entry.published ? new Date(entry.published).toISOString() : new Date().toISOString(),
        source: 'arxiv',
        url: absLink?.['@_href'] || `https://arxiv.org/abs/${arxivId}`,
        pdfUrl: pdfLink?.['@_href'] || `https://arxiv.org/pdf/${arxivId}.pdf`,
        arxivId,
        categories,
        tags: [],
      })
    }
  } catch (e) {
    console.warn('[arXiv API] Failed:', e)
  }

  return papers
}

export async function fetchArxiv(): Promise<Paper[]> {
  console.log('[arXiv] Fetching from RSS feeds and API...')
  const [rssPapers, apiPapers] = await Promise.all([fetchRss(), fetchApi()])

  // Merge: use RSS metadata but overwrite date with API's `published` (actual submission date).
  // RSS pubDate is the announcement date — all papers in one batch share the same day.
  // API entry.published is the real submission date, spreading papers across multiple days.
  const apiById = new Map(apiPapers.map((p) => [p.id, p]))
  const merged: Paper[] = rssPapers.map((p) => {
    const api = apiById.get(p.id)
    return api ? { ...p, date: api.date } : p
  })
  // Add API-only papers (not yet in RSS, e.g. very recent or cross-listed)
  const rssIds = new Set(rssPapers.map((p) => p.id))
  for (const p of apiPapers) {
    if (!rssIds.has(p.id)) merged.push(p)
  }

  console.log(`[arXiv] Fetched ${merged.length} papers (RSS: ${rssPapers.length}, API: ${apiPapers.length})`)
  return merged
}
