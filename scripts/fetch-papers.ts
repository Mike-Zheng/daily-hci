import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fetchArxiv, fetchDblp, fetchSemanticScholar, fetchOpenAlex } from './adapters/index'
import { dedup } from './utils/dedup'
import { tagAllPapers } from './utils/tagger'
import type { DailyData } from '../src/types/paper'

const OUTPUT_DIR = join(import.meta.dirname, '..', 'public', 'data')

async function main() {
  console.log('=== Daily HCI Paper Fetcher ===')
  console.log(`Time: ${new Date().toISOString()}\n`)

  // Fetch from all sources in parallel
  const [arxivPapers, dblpPapers, s2Papers, oaPapers] = await Promise.all([
    fetchArxiv().catch((e) => { console.error('[arXiv] Fatal:', e); return [] }),
    fetchDblp().catch((e) => { console.error('[DBLP] Fatal:', e); return [] }),
    fetchSemanticScholar().catch((e) => { console.error('[S2] Fatal:', e); return [] }),
    fetchOpenAlex().catch((e) => { console.error('[OA] Fatal:', e); return [] }),
  ])

  console.log('\n--- Source Summary ---')
  console.log(`arXiv:            ${arxivPapers.length}`)
  console.log(`DBLP:             ${dblpPapers.length}`)
  console.log(`Semantic Scholar: ${s2Papers.length}`)
  console.log(`OpenAlex:         ${oaPapers.length}`)

  // Merge all papers (arXiv first for priority)
  const allPapers = [...arxivPapers, ...s2Papers, ...oaPapers, ...dblpPapers]
  console.log(`Total before dedup: ${allPapers.length}`)

  // Deduplicate
  const unique = dedup(allPapers)
  console.log(`Total after dedup:  ${unique.length}`)

  // Filter: only keep papers from the last 7 days (and not future)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) // end of today
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const filtered = unique.filter((p) => {
    const d = new Date(p.date)
    return d <= today && d >= sevenDaysAgo
  })
  console.log(`Filtered to last 7 days: ${filtered.length} kept, ${unique.length - filtered.length} removed`)

  // Auto-tag
  tagAllPapers(filtered)

  // Sort by date descending
  filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Write output
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const dailyData: DailyData = {
    fetchedAt: new Date().toISOString(),
    papers: filtered,
  }

  const now2 = new Date()
  const todayStr = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, '0')}-${String(now2.getDate()).padStart(2, '0')}`
  const latestPath = join(OUTPUT_DIR, 'latest.json')
  const dailyPath = join(OUTPUT_DIR, `papers-${todayStr}.json`)

  writeFileSync(latestPath, JSON.stringify(dailyData, null, 2), 'utf-8')
  writeFileSync(dailyPath, JSON.stringify(dailyData, null, 2), 'utf-8')

  console.log(`\nWritten to:\n  ${latestPath}\n  ${dailyPath}`)
  console.log(`\n=== Done: ${filtered.length} papers ===`)
}

main()
