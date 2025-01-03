import { NextResponse } from 'next/server'
import { getSearchUrl } from '@/features/command'

export async function GET() {
  const urls = getSearchUrl()
  return NextResponse.json(urls)
}
