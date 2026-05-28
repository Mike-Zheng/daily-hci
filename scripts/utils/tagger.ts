import type { Paper } from '../../src/types/paper'

const TAG_PATTERNS: [RegExp, string][] = [
  [/\bLLM\b|large language model/i, 'LLM'],
  [/\bGPT\b|ChatGPT|GPT-4/i, 'GPT'],
  [/\bVR\b|virtual reality/i, 'VR'],
  [/\bAR\b|augmented reality/i, 'AR'],
  [/\bXR\b|extended reality|mixed reality|\bMR\b/i, 'XR'],
  [/\baccessib/i, 'Accessibility'],
  [/\bhaptic/i, 'Haptics'],
  [/eye.?track/i, 'Eye Tracking'],
  [/\bgesture/i, 'Gesture'],
  [/\bvoice\b|speech.?recogni|voice.?assistant/i, 'Voice'],
  [/\bNLP\b|natural language process/i, 'NLP'],
  [/\bvisuali[sz]/i, 'Visualization'],
  [/\bcrowdsourc/i, 'Crowdsourcing'],
  [/\bUX\b|user experience/i, 'UX'],
  [/\busabil/i, 'Usability'],
  [/\bprivacy\b/i, 'Privacy'],
  [/\brobot/i, 'Robotics'],
  [/\bgam(?:e|ing|ifi)/i, 'Gaming'],
  [/\bcollabora/i, 'Collaboration'],
  [/\beducat|learn/i, 'Education'],
  [/\bhealth|medical|clinical/i, 'Health'],
  [/\bmobile\b/i, 'Mobile'],
  [/\bwearable/i, 'Wearable'],
  [/\btangible/i, 'Tangible'],
  [/\bfabricat/i, 'Fabrication'],
  [/\b3D print/i, '3D Printing'],
  [/\bdesign space|design tool/i, 'Design Tools'],
  [/\bchatbot|conversational agent/i, 'Chatbot'],
  [/\bemotion|affect|sentiment/i, 'Emotion'],
  [/\btrust\b/i, 'Trust'],
]

export function tagPaper(paper: Paper): string[] {
  const text = `${paper.title} ${paper.abstract}`
  const tags: string[] = []

  for (const [pattern, tag] of TAG_PATTERNS) {
    if (pattern.test(text)) {
      tags.push(tag)
    }
  }

  return [...new Set(tags)]
}

export function tagAllPapers(papers: Paper[]): void {
  for (const paper of papers) {
    paper.tags = tagPaper(paper)
  }
}
