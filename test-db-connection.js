// Test Supabase connection and check tables
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Testing Supabase Connection...\n')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseKey ? '✅ Found' : '❌ Missing')
console.log('\n')

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
  try {
    // Check team_members table
    console.log('📋 Checking team_members table...')
    const { data: teamMembers, error: teamError } = await supabase
      .from('team_members')
      .select('*')
      .limit(10)

    if (teamError) {
      console.log('❌ Error:', teamError.message)
      if (teamError.message.includes('does not exist')) {
        console.log('   → Table "team_members" does not exist yet')
        console.log('   → You need to run the SQL setup script in Supabase')
      }
    } else {
      console.log(`✅ Found ${teamMembers.length} team members:`)
      teamMembers.forEach((member, i) => {
        console.log(`   ${i + 1}. ${member.name} - ${member.role}`)
      })
    }
    console.log('\n')

    // Check bookings table
    console.log('📅 Checking bookings table...')
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .limit(10)

    if (bookingError) {
      console.log('❌ Error:', bookingError.message)
      if (bookingError.message.includes('does not exist')) {
        console.log('   → Table "bookings" does not exist yet')
        console.log('   → You need to run the SQL setup script in Supabase')
      }
    } else {
      console.log(`✅ Found ${bookings.length} bookings`)
    }

  } catch (error) {
    console.log('❌ Connection Error:', error.message)
  }
}

checkDatabase()
