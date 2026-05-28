export interface Paper {
  /** Unique ID: DOI or arXiv ID or generated hash */
  id: string
  title: string
  authors: string[]
  abstract: string
  date: string // ISO 8601
  source: 'arxiv' | 'dblp' | 'semantic-scholar' | 'openalex' | 'crossref' | 'core'
  url: string
  pdfUrl?: string
  doi?: string
  arxivId?: string
  categories: string[]
  tags: string[]
  citationCount?: number
  tldr?: string
  venue?: string
}

export interface DailyData {
  fetchedAt: string // ISO 8601
  papers: Paper[]
}
