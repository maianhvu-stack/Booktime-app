// Import employee data from CSV to Supabase
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔄 Starting Employee Import...\n')

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

async function importEmployees() {
  try {
    // Read and parse CSV
    const csvPath = path.join(__dirname, 'Data-Ripping-Workemail - sheet.csv')
    console.log('📖 Reading CSV file:', csvPath)
    const csvData = parseCSV(csvPath)
    console.log(`✅ Found ${csvData.length} employees in CSV\n`)

    // Transform data
    const teamMembers = csvData.map(mapToTeamMember)

    console.log('📤 Uploading to Supabase...')
    console.log('Sample record:', JSON.stringify(teamMembers[0], null, 2), '\n')

    // Insert data in batches (Supabase recommends batches of 1000 or less)
    const batchSize = 100
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < teamMembers.length; i += batchSize) {
      const batch = teamMembers.slice(i, i + batchSize)

      const { data, error } = await supabase
        .from('team_members')
        .insert(batch)
        .select()

      if (error) {
        console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error.message)
        errorCount += batch.length
      } else {
        successCount += data.length
        console.log(`✅ Batch ${i / batchSize + 1}: Inserted ${data.length} records`)
      }
    }

    console.log('\n📊 Import Summary:')
    console.log(`✅ Successfully imported: ${successCount} employees`)
    if (errorCount > 0) {
      console.log(`❌ Failed: ${errorCount} employees`)
    }
    console.log('\n🎉 Import complete!')

  } catch (error) {
    console.error('❌ Import failed:', error.message)
  }
}

importEmployees()
