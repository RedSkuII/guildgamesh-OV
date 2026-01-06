/**
 * Populate resources for a specific guild
 * Usage: npx tsx scripts/populate-guild-resources.ts <guild-id>
 */

import { nanoid } from 'nanoid'
import * as fs from 'fs'
import * as path from 'path'

// Read standard resources from JSON file
const standardResourcesPath = path.join(process.cwd(), 'standard-resources-98.json')
const standardResources = JSON.parse(fs.readFileSync(standardResourcesPath, 'utf-8'))

async function populateGuildResources(guildId: string) {
  try {
    console.log(`🚀 Populating resources for guild: ${guildId}`)
    
    // Import database
    const { db, resources: resourcesTable } = await import('../lib/db')
    const { eq } = await import('drizzle-orm')
    
    // Check if guild exists
    const { guilds } = await import('../lib/db')
    const guildData = await db.select().from(guilds).where(eq(guilds.id, guildId)).limit(1)
    
    if (guildData.length === 0) {
      console.error(`❌ Guild not found: ${guildId}`)
      console.log('\nAvailable guilds:')
      const allGuilds = await db.select().from(guilds).all()
      allGuilds.forEach(g => console.log(`  - ${g.id}: ${g.title}`))
      process.exit(1)
    }
    
    console.log(`✓ Found guild: ${guildData[0].title}`)
    
    // Check if resources already exist for this guild
    const existingResources = await db.select()
      .from(resourcesTable)
      .where(eq(resourcesTable.guildId, guildId))
      .all()
    
    if (existingResources.length > 0) {
      console.log(`⚠️  Guild already has ${existingResources.length} resources`)
      console.log('Do you want to add more? (This will NOT delete existing resources)')
      console.log('Press Ctrl+C to cancel, or continue...\n')
    }
    
    // Prepare resources with guild ID
    const resourcesToInsert = standardResources.map((resource: any, index: number) => ({
      id: nanoid(),
      guildId: guildId,
      name: resource.name,
      quantity: 0, // Start with 0 quantity
      targetQuantity: 1000, // Default target
      description: resource.description || '',
      category: resource.category || 'Other',
      imageUrl: null,
      icon: resource.icon || '',
      multiplier: resource.multiplier || 1.0,
      lastUpdatedBy: 'System',
      updatedAt: new Date(),
      createdAt: new Date()
    }))
    
    console.log(`\n📦 Inserting ${resourcesToInsert.length} resources...`)
    
    // Insert in batches of 50
    const batchSize = 50
    let inserted = 0
    
    for (let i = 0; i < resourcesToInsert.length; i += batchSize) {
      const batch = resourcesToInsert.slice(i, i + batchSize)
      await db.insert(resourcesTable).values(batch)
      inserted += batch.length
      console.log(`  ✓ Inserted ${inserted}/${resourcesToInsert.length}`)
    }
    
    console.log(`\n✅ Successfully populated ${inserted} resources for guild "${guildData[0].title}"!`)
    console.log(`\n🌐 View them at: http://localhost:3000/resources?guildId=${guildId}`)
    
  } catch (error) {
    console.error('❌ Error populating resources:', error)
    process.exit(1)
  }
}

// Get guild ID from command line argument
const guildId = process.argv[2]

if (!guildId) {
  console.error('❌ Please provide a guild ID')
  console.log('\nUsage: npx tsx scripts/populate-guild-resources.ts <guild-id>')
  console.log('\nTo see available guilds, run:')
  console.log('  npx tsx scripts/check-guilds.ts')
  process.exit(1)
}

populateGuildResources(guildId)
