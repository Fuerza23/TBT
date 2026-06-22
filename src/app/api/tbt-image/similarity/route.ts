import { NextRequest, NextResponse } from 'next/server'

const PROCESSOR_URL = process.env.TBT_IMAGE_PROCESSOR_URL
const PROCESSOR_KEY = process.env.TBT_IMAGE_PROCESSOR_API_KEY

// Thresholds for plagiarism detection
const THRESHOLD_BLOCK = 0.9   // block certification
const THRESHOLD_WARN  = 0.75  // show warning but allow

export async function POST(req: NextRequest) {
  if (!PROCESSOR_URL) {
    // If service is not configured, allow the flow to continue
    return NextResponse.json({ status: 'skipped' })
  }

  const formData = await req.formData()
  const file = formData.get('file')

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const upstream = new FormData()
  upstream.append('file', file)
  upstream.append('top_k', '5')

  const response = await fetch(`${PROCESSOR_URL}/search/images`, {
    method: 'POST',
    headers: { 'X-API-Key': PROCESSOR_KEY ?? '' },
    body: upstream,
  })

  // If the index is empty or search fails, allow the flow to continue
  if (!response.ok) {
    return NextResponse.json({ status: 'skipped' })
  }

  const data = await response.json()
  const hits = data.hits ?? []

  if (hits.length === 0) {
    return NextResponse.json({ status: 'clear' })
  }

  const topScore: number = hits[0].score

  if (topScore >= THRESHOLD_BLOCK) {
    return NextResponse.json({
      status: 'blocked',
      score: topScore,
      matches: hits.slice(0, 3),
    })
  }

  if (topScore >= THRESHOLD_WARN) {
    return NextResponse.json({
      status: 'warning',
      score: topScore,
      matches: hits.slice(0, 3),
    })
  }

  return NextResponse.json({ status: 'clear', score: topScore })
}
