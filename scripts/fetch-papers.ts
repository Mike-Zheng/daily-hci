import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fetchArxiv, fetchDblp, fetchSemanticScholar, fetchOpenAlex } from './adapters/index'
import { dedup } from './utils/dedup'
import { tagAllPapers } from './utils/tagger'
import type { DailyData } from '../src/types/paper'

const OUTPUT_DIR = join(import.meta.dirname, '..', 'data')
const DAILY_RAW_DIR = join(OUTPUT_DIR, 'daily')

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function main() {
  console.log('=== Daily HCI Paper Fetcher ===')
  console.log(`Time: ${new Date().toISOString()}\n`)

  // ── Step 1: Fetch today's papers from all sources ────────────────────────────
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

  const todayRaw = dedup([...arxivPapers, ...s2Papers, ...oaPapers, ...dblpPapers])
  console.log(`Today's unique papers: ${todayRaw.length}`)

  // ── Step 2: Save today's raw daily file ──────────────────────────────────────
  // Preserves each day's RSS batch so papers aren't lost when tomorrow's RSS replaces today's.
  if (!existsSync(DAILY_RAW_DIR)) mkdirSync(DAILY_RAW_DIR, { recursive: true })
  const now = new Date()
  const todayStr = formatDateStr(now)
  const rawPath = join(DAILY_RAW_DIR, `${todayStr}.json`)
  writeFileSync(rawPath, JSON.stringify({ fetchedAt: now.toISOString(), papers: todayRaw }, null, 2), 'utf-8')
  console.log(`\nSaved today's raw: ${rawPath}`)

  // ── Step 3: Load last 7 days of raw daily files ───────────────────────────────
  console.log('\n--- Loading historical daily files ---')
  const allPapers = [...todayRaw]
  for (let i = 1; i < 7; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = formatDateStr(d)
    const filePath = join(DAILY_RAW_DIR, `${dateStr}.json`)
    if (existsSync(filePath)) {
      const data: DailyData = JSON.parse(readFileSync(filePath, 'utf-8'))
      allPapers.push(...data.papers)
      console.log(`  ${dateStr}: +${data.papers.length} papers`)
    }
  }

  // ── Step 4: Dedup across all 7 days ──────────────────────────────────────────
  const unique = dedup(allPapers)
  console.log(`\nTotal before filter: ${unique.length}`)

  // Filter: keep papers from last 7 days (removes DBLP/S2 papers with old dates)
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const sevenDaysAgo = new Date(endOfToday.getTime() - 7 * 24 * 60 * 60 * 1000)
  const filtered = unique.filter((p) => {
    const d = new Date(p.date)
    return d <= endOfToday && d >= sevenDaysAgo
  })
  console.log(`After 7-day filter: ${filtered.length} papers`)

  // ── Step 5: Tag, sort, write output ──────────────────────────────────────────
  tagAllPapers(filtered)
  filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true })

  const dailyData: DailyData = {
    fetchedAt: now.toISOString(),
    papers: filtered,
  }

  const latestPath = join(OUTPUT_DIR, 'latest.json')
  const dailyPath = join(OUTPUT_DIR, `papers-${todayStr}.json`)

  writeFileSync(latestPath, JSON.stringify(dailyData, null, 2), 'utf-8')
  writeFileSync(dailyPath, JSON.stringify(dailyData, null, 2), 'utf-8')

  console.log(`\nWritten to:\n  ${latestPath}\n  ${dailyPath}`)
  console.log(`\n=== Done: ${filtered.length} papers ===`)
}

main()
