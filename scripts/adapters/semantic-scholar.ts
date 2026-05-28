import type { Paper } from '../../src/types/paper'

const API_BASE = 'https://api.semanticscholar.org/graph/v1'
const API_KEY = process.env.SEMANTIC_SCHOLAR_API_KEY || ''

const FIELDS = 'paperId,externalIds,title,abstract,year,authors,citationCount,tldr,venue,publicationDate,openAccessPdf,url'

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (API_KEY) headers['x-api-key'] = API_KEY
  return headers
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

interface S2Paper {
  paperId: string
  externalIds?: { ArXiv?: string; DOI?: string }
  title?: string
  abstract?: string
  year?: number
  authors?: { name: string }[]
  citationCount?: number
  tldr?: { text: string }
  venue?: string
  publicationDate?: string
  openAccessPdf?: { url: string }
  url?: string
}

function parsePaper(raw: S2Paper): Paper | null {
  if (!raw.title) return null

  const doi = raw.externalIds?.DOI || undefined
  const arxivId = raw.externalIds?.ArXiv || undefined
  const id = doi || arxivId || raw.paperId

  return {
    id,
    title: raw.title,
    authors: raw.authors?.map((a) => a.name).filter(Boolean) || [],
    abstract: raw.abstract || '',
    date: raw.publicationDate
      ? new Date(raw.publicationDate).toISOString()
      : raw.year
        ? `${raw.year}-01-01T00:00:00Z`
        : new Date().toISOString(),
    source: 'semantic-scholar',
    url: raw.url || `https://www.semanticscholar.org/paper/${raw.paperId}`,
    pdfUrl: raw.openAccessPdf?.url || undefined,
    doi,
    arxivId,
    categories: [],
    tags: [],
    citationCount: raw.citationCount ?? undefined,
    tldr: raw.tldr?.text || undefined,
    venue: raw.venue || undefined,
  }
}

const HCI_QUERIES = [
  'human-computer interaction',
  'user interface design',
  'usability study',
  'accessibility technology',
]

export async function fetchSemanticScholar(): Promise<Paper[]> {
  console.log('[Semantic Scholar] Fetching HCI papers...')
  const allPapers: Paper[] = []

  for (const query of HCI_QUERIES) {
    const url = `${API_BASE}/paper/search?query=${encodeURIComponent(query)}&limit=30&fields=${FIELDS}&year=2025-2026`

    try {
      const res = await fetch(url, { headers: getHeaders() })
      if (!res.ok) {
        console.warn(`[Semantic Scholar] Query "${query}" failed: ${res.status}`)
        continue
      }
      const data = await res.json()
      const papers: S2Paper[] = data?.data || []
      for (const raw of papers) {
        const paper = parsePaper(raw)
        if (paper) allPapers.push(paper)
      }
    } catch (e) {
      console.warn(`[Semantic Scholar] Query "${query}" error:`, e)
    }

    // Respect rate limit: 1 RPS without key, be generous
    await sleep(API_KEY ? 300 : 3000)
  }

  // Deduplicate within results
  const seen = new Set<string>()
  const unique = allPapers.filter((p) => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })

  console.log(`[Semantic Scholar] Fetched ${unique.length} papers`)
  return unique
}
