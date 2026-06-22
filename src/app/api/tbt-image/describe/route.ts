import { NextRequest, NextResponse } from 'next/server'

const PROCESSOR_URL = process.env.TBT_IMAGE_PROCESSOR_URL
const PROCESSOR_KEY = process.env.TBT_IMAGE_PROCESSOR_API_KEY

export async function POST(req: NextRequest) {
  if (!PROCESSOR_URL) {
    return NextResponse.json({ error: 'Image processor not configured' }, { status: 503 })
  }

  const formData = await req.formData()
  const file = formData.get('file')

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const upstream = new FormData()
  upstream.append('file', file)

  const response = await fetch(`${PROCESSOR_URL}/images/describe`, {
    method: 'POST',
    headers: { 'X-API-Key': PROCESSOR_KEY ?? '' },
    body: upstream,
  })

  if (!response.ok) {
    const text = await response.text()
    return NextResponse.json({ error: text }, { status: response.status })
  }

  const data = await response.json()
  return NextResponse.json(data)
}
