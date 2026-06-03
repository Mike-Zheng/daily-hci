import type { Paper } from '../../src/types/paper'

const API_BASE = 'https://api.openalex.org'
const API_KEY = process.env.OPENALEX_API_KEY || ''

// OpenAlex topic IDs related to HCI
// These will be used as filters. We also do keyword search as fallback.
const HCI_KEYWORDS = [
  'human-computer interaction',
  'user experience',
  'interaction design',
]

interface OpenAlexWork {
  id: string
  doi?: string
  title?: string
  publication_date?: string
  authorships?: { author: { display_name: string } }[]
  abstract_inverted_index?: Record<string, number[]>
  cited_by_count?: number
  primary_location?: {
    source?: { display_name: string }
    pdf_url?: string
    landing_page_url?: string
  }
  concepts?: { display_name: string; level: number }[]
  topics?: { display_name: string }[]
  open_access?: { oa_url?: string }
}

function reconstructAbstract(invertedIndex: Record<string, number[]> | undefined): string {
  if (!invertedIndex) return ''
  const words: [number, string][] = []
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      words.push([pos, word])
    }
  }
  words.sort((a, b) => a[0] - b[0])
  return words.map(([, w]) => w).join(' ')
}

function parseWork(work: OpenAlexWork): Paper | null {
  if (!work.title) return null

  const doi = work.doi?.replace('https://doi.org/', '') || undefined
  const id = doi || work.id.replace('https://openalex.org/', '')

  const authors =
    work.authorships?.map((a) => a.author.display_name).filter(Boolean) || []

  const categories =
    work.concepts
      ?.filter((c) => c.level <= 2)
      .map((c) => c.display_name) || []

  return {
    id,
    title: work.title,
    authors,
    abstract: reconstructAbstract(work.abstract_inverted_index),
    date: work.publication_date
      ? new Date(work.publication_date).toISOString()
      : new Date().toISOString(),
    source: 'openalex',
    url: work.primary_location?.landing_page_url || `https://openalex.org/${work.id}`,
    pdfUrl: work.open_access?.oa_url || work.primary_location?.pdf_url || undefined,
    doi: doi ? `https://doi.org/${doi}` : undefined,
    categories,
    tags: [],
    citationCount: work.cited_by_count ?? undefined,
    venue: work.primary_location?.source?.display_name || undefined,
  }
}

export async function fetchOpenAlex(): Promise<Paper[]> {
  console.log('[OpenAlex] Fetching HCI papers...')
  const allPapers: Paper[] = []

  const mailTo = API_KEY || 'daily-hci@example.com'

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const fromDate = sevenDaysAgo.toISOString().split('T')[0]

  for (const keyword of HCI_KEYWORDS) {
    const params = new URLSearchParams({
      search: keyword,
      filter: `from_publication_date:${fromDate},type:article`,
      sort: 'publication_date:desc',
      per_page: '25',
      mailto: mailTo,
    })

    const url = `${API_BASE}/works?${params}`

    try {
      const res = await fetch(url)
      if (!res.ok) {
        console.warn(`[OpenAlex] Query "${keyword}" failed: ${res.status}`)
        continue
      }
      const data = await res.json()
      const works: OpenAlexWork[] = data?.results || []
      for (const work of works) {
        const paper = parseWork(work)
        if (paper) allPapers.push(paper)
      }
    } catch (e) {
      console.warn(`[OpenAlex] Query "${keyword}" error:`, e)
    }
  }

  // Deduplicate
  const seen = new Set<string>()
  const unique = allPapers.filter((p) => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })

  console.log(`[OpenAlex] Fetched ${unique.length} papers`)
  return unique
}
