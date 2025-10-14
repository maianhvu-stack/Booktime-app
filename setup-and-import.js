// Setup database tables and import employee data
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🚀 Starting Database Setup and Import...\n')

const supabase = createClient(supabaseUrl, supabaseKey)

// Function to parse CSV
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const headers = lines[0].split(',')

  const data = []
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue

    const values = lines[i].split(',')
    const row = {}
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || ''
    })
    data.push(row)
  }

  return data
}

// Function to map CSV data to team_members schema
function mapToTeamMember(csvRow) {
  return {
    name: csvRow.Employee,
    email: csvRow['Work email'],
    role: csvRow.Title,
    expertise: [csvRow.Department], // Store department as expertise array
    bio: `${csvRow.Title} in ${csvRow.Department}`,
    avatar: null // No avatar data in CSV
  }
}

async function setupAndImport() {
  try {
    // Step 1: Check if table exists
    console.log('📋 Step 1: Checking database tables...')
    const { data: existingData, error: checkError } = await supabase
      .from('team_members')
      .select('id')
      .limit(1)

    if (checkError && checkError.message.includes('does not exist')) {
      console.log('❌ Table "team_members" does not exist')
      console.log('\n⚠️  ACTION REQUIRED:')
      console.log('You need to create the table first in Supabase SQL Editor:')
      console.log('1. Go to https://supabase.com/dashboard')
      console.log('2. Select your project')
      console.log('3. Click "SQL Editor" in the left sidebar')
      console.log('4. Click "New Query"')
      console.log('5. Copy and paste the SQL from: scripts/001_create_tables.sql')
      console.log('6. Click "Run"')
      console.log('7. Then run this script again\n')
      return
    } else if (checkError) {
      console.log('❌ Error checking table:', checkError.message)
      return
    }

    console.log('✅ Table "team_members" exists\n')

    // Step 2: Read and parse CSV
    const csvPath = path.join(__dirname, 'Data-Ripping-Workemail - sheet.csv')
    console.log('📖 Step 2: Reading CSV file...')
    const csvData = parseCSV(csvPath)
    console.log(`✅ Found ${csvData.length} employees in CSV\n`)

    // Step 3: Transform data
    console.log('🔄 Step 3: Transforming data...')
    const teamMembers = csvData.map(mapToTeamMember)
    console.log('✅ Data transformed')
    console.log('Sample record:', JSON.stringify(teamMembers[0], null, 2), '\n')

    // Step 4: Upload to Supabase
    console.log('📤 Step 4: Uploading to Supabase...')

    // Insert data in batches
    const batchSize = 100
    let successCount = 0
    let errorCount = 0
    const errors = []

    for (let i = 0; i < teamMembers.length; i += batchSize) {
      const batch = teamMembers.slice(i, i + batchSize)
      const batchNum = Math.floor(i / batchSize) + 1
      const totalBatches = Math.ceil(teamMembers.length / batchSize)

      process.stdout.write(`   Batch ${batchNum}/${totalBatches}... `)

      const { data, error } = await supabase
        .from('team_members')
        .insert(batch)
        .select()

      if (error) {
        console.log(`❌ Error: ${error.message}`)
        errorCount += batch.length
        errors.push({ batch: batchNum, error: error.message })
      } else {
        console.log(`✅ Inserted ${data.length} records`)
        successCount += data.length
      }
    }

    // Step 5: Summary
    console.log('\n📊 Import Summary:')
    console.log(`   Total employees in CSV: ${csvData.length}`)
    console.log(`   ✅ Successfully imported: ${successCount}`)
    if (errorCount > 0) {
      console.log(`   ❌ Failed: ${errorCount}`)
      console.log('\n   Errors:')
      errors.forEach(e => {
        console.log(`   - Batch ${e.batch}: ${e.error}`)
      })
    }

    console.log('\n🎉 Import complete!')

    // Step 6: Verify the import
    console.log('\n🔍 Verifying import...')
    const { data: verifyData, error: verifyError } = await supabase
      .from('team_members')
      .select('id, name, email, role, expertise')
      .limit(5)

    if (verifyError) {
      console.log('❌ Verification failed:', verifyError.message)
    } else {
      console.log(`✅ Found ${verifyData.length} records in database`)
      console.log('\nFirst 5 employees:')
      verifyData.forEach((member, i) => {
        console.log(`   ${i + 1}. ${member.name} (${member.email}) - ${member.role}`)
      })
    }

  } catch (error) {
    console.error('\n❌ Setup and import failed:', error.message)
  }
}

setupAndImport()
