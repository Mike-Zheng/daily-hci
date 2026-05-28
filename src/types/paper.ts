export interface Paper {
  id: string
  title: string
  authors: string[]
  abstract?: string
  date: string
  source: 'arxiv' | 'dblp' | 'semantic-scholar' | 'openalex'
  url: string
  pdfUrl?: string
  arxivId?: string
  doi?: string
  categories?: string[]
  tags: string[]
  citationCount?: number
  tldr?: string
  venue?: string
}

export interface DailyData {
  fetchedAt: string
  papers: Paper[]
}
