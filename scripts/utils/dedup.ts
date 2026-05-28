import type { Paper } from '../../src/types/paper'

/**
 * Deduplicate and merge papers from multiple sources.
 * Priority: DOI > arXiv ID > fuzzy title match.
 * When a paper appears from multiple sources, merge metadata.
 */
export function dedup(papers: Paper[]): Paper[] {
  const byDoi = new Map<string, Paper>()
  const byArxiv = new Map<string, Paper>()
  const byTitle = new Map<string, Paper>()
  const result: Paper[] = []

  for (const paper of papers) {
    const normalizedDoi = paper.doi?.replace(/^https?:\/\/doi\.org\//, '').toLowerCase()
    const normalizedTitle = normalizeTitle(paper.title)

    // Try to find existing paper to merge with
    let existing: Paper | undefined

    if (normalizedDoi) {
      existing = byDoi.get(normalizedDoi)
    }
    if (!existing && paper.arxivId) {
      existing = byArxiv.get(paper.arxivId)
    }
    if (!existing && normalizedTitle.length > 20) {
      existing = byTitle.get(normalizedTitle)
    }

    if (existing) {
      mergePaper(existing, paper)
    } else {
      result.push(paper)
      if (normalizedDoi) byDoi.set(normalizedDoi, paper)
      if (paper.arxivId) byArxiv.set(paper.arxivId, paper)
      if (normalizedTitle.length > 20) byTitle.set(normalizedTitle, paper)
    }
  }

  return result
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Merge metadata from `incoming` into `existing` (mutates existing) */
function mergePaper(existing: Paper, incoming: Paper): void {
  // Fill in missing fields
  if (!existing.abstract && incoming.abstract) existing.abstract = incoming.abstract
  if (!existing.pdfUrl && incoming.pdfUrl) existing.pdfUrl = incoming.pdfUrl
  if (!existing.doi && incoming.doi) existing.doi = incoming.doi
  if (!existing.arxivId && incoming.arxivId) existing.arxivId = incoming.arxivId
  if (!existing.tldr && incoming.tldr) existing.tldr = incoming.tldr
  if (!existing.venue && incoming.venue) existing.venue = incoming.venue
  if (existing.citationCount == null && incoming.citationCount != null) {
    existing.citationCount = incoming.citationCount
  }

  // Merge categories (unique)
  const catSet = new Set([...existing.categories, ...incoming.categories])
  existing.categories = [...catSet]

  // Merge authors if existing has none
  if (existing.authors.length === 0 && incoming.authors.length > 0) {
    existing.authors = incoming.authors
  }
}
