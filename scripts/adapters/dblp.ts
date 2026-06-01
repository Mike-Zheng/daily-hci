import type { Paper } from '../../src/types/paper'

const API_BASE = 'https://dblp.org/search/publ/api'

// Top HCI venues to query
const HCI_VENUES = [
  'CHI',
  'UIST',
  'CSCW',
  'DIS',
  'IUI',
  'MobileHCI',
  'TEI',
  'INTERACT',
  'NordiCHI',
  'OzCHI',
]

interface DblpHit {
  info: {
    title?: string
    authors?: { author: { text: string } | { text: string }[] }
    year?: string
    venue?: string
    doi?: string
    url?: string
    type?: string
    ee?: string
  }
}

function parseHit(hit: DblpHit): Paper | null {
  const info = hit.info
  if (!info.title) return null

  const authorsRaw = info.authors?.author
  let authors: string[] = []
  if (authorsRaw) {
    const authorList = Array.isArray(authorsRaw) ? authorsRaw : [authorsRaw]
    authors = authorList.map((a) => a.text).filter(Boolean)
  }

  const doi = info.doi || undefined
  const id = doi || `dblp:${info.url || info.title}`

  return {
    id,
    title: info.title.replace(/\.$/, ''),
    authors,
    abstract: '', // DBLP doesn't provide abstracts
    date: info.year ? `${info.year}-01-01T00:00:00Z` : new Date().toISOString(),
    source: 'dblp',
    url: info.ee || info.url || (doi ? `https://doi.org/${doi}` : ''),
    doi,
    categories: [],
    tags: [],
    venue: info.venue || undefined,
  }
}

const DBLP_HEADERS = {
  'User-Agent': 'daily-hci/1.0 (research aggregator; https://github.com/Mike-Zheng/daily-hci)',
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, { headers: DBLP_HEADERS })
    } catch (e) {
      if (i === retries - 1) throw e
      await sleep(1000 * (i + 1))
    }
  }
  throw new Error('unreachable')
}

async function searchVenue(venue: string, year: number): Promise<Paper[]> {
  const query = `${venue} ${year}`
  const url = `${API_BASE}?q=${encodeURIComponent(query)}&format=json&h=30`

  try {
    const res = await fetchWithRetry(url)
    if (!res.ok) return []
    const data = await res.json()
    const hits = data?.result?.hits?.hit
    if (!hits) return []

    const hitList: DblpHit[] = Array.isArray(hits) ? hits : [hits]
    return hitList.map(parseHit).filter((p): p is Paper => p !== null)
  } catch (e) {
    console.warn(`[DBLP] Failed to search venue "${venue}":`, e)
    return []
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchDblp(): Promise<Paper[]> {
  console.log('[DBLP] Fetching from venue searches...')
  const currentYear = new Date().getFullYear()

  // Serialize requests to avoid connection flooding
  const papers: Paper[] = []
  for (const venue of HCI_VENUES) {
    for (const year of [currentYear, currentYear - 1]) {
      const result = await searchVenue(venue, year)
      papers.push(...result)
      await sleep(20000) // be polite to DBLP
    }
  }

  // Deduplicate within DBLP results
  const seen = new Set<string>()
  const unique = papers.filter((p) => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })

  console.log(`[DBLP] Fetched ${unique.length} papers from ${HCI_VENUES.length} venues`)
  return unique
}
