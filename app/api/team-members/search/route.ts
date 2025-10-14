import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    // Search team members by name (case-insensitive)
    const { data: members, error } = await supabase
      .from('team_members')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(10)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to search team members' }, { status: 500 })
    }

    return NextResponse.json({ members })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
