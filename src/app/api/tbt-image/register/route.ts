import { NextRequest, NextResponse } from 'next/server'

const PROCESSOR_URL = process.env.TBT_IMAGE_PROCESSOR_URL
const PROCESSOR_KEY = process.env.TBT_IMAGE_PROCESSOR_API_KEY

// Called after a TBT is certified — registers the image in the vector DB
// so future uploads can be compared against it
export async function POST(req: NextRequest) {
  if (!PROCESSOR_URL) {
    return NextResponse.json({ status: 'skipped' })
  }

  const formData = await req.formData()
  const file = formData.get('file')

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const upstream = new FormData()
  upstream.append('file', file)

  const response = await fetch(`${PROCESSOR_URL}/images`, {
    method: 'POST',
    headers: { 'X-API-Key': PROCESSOR_KEY ?? '' },
    body: upstream,
  })

  if (!response.ok) {
    // Non-critical — log but don't fail the certification
    console.error('[tbt-image/register] Failed to register image:', await response.text())
    return NextResponse.json({ status: 'failed' }, { status: 200 })
  }

  const data = await response.json()
  return NextResponse.json({ status: 'registered', image_id: data.id })
}
