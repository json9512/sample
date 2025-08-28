// Database migration utilities
// Provides functions to apply database schema and seed test data

import { createClient } from '@/utils/supabase/server'

export async function runMigrations() {
  const supabase = createClient()
  
  try {
    // Check if tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['users', 'conversations', 'messages'])

    if (tablesError) {
      throw new Error(`Failed to check existing tables: ${tablesError.message}`)
    }

    const existingTables = tables?.map(t => t.table_name) || []
    const requiredTables = ['users', 'conversations', 'messages']
    const missingTables = requiredTables.filter(table => !existingTables.includes(table))

    if (missingTables.length > 0) {
      console.warn(`Missing database tables: ${missingTables.join(', ')}`)
      console.warn('Please run the database-schema.sql file in your Supabase dashboard')
      return false
    }

    console.log('Database schema validation successful')
    return true
  } catch (error) {
    console.error('Migration validation failed:', error)
    return false
  }
}

export async function seedTestData() {
  const supabase = createClient()
  
  try {
    // Get current user to seed data for
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('No authenticated user found for seeding')
    }

    // Create sample conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title: 'Welcome Chat'
      })
      .select()
      .single()

    if (convError) {
      throw new Error(`Failed to create sample conversation: ${convError.message}`)
    }

    // Create sample messages
    const sampleMessages = [
      {
        conversation_id: conversation.id,
        role: 'user' as const,
        content: 'Hello! This is a sample conversation.'
      },
      {
        conversation_id: conversation.id,
        role: 'assistant' as const,
        content: 'Welcome to your new chat application! This is a sample response to demonstrate the interface.'
      }
    ]

    const { error: messagesError } = await supabase
      .from('messages')
      .insert(sampleMessages)

    if (messagesError) {
      throw new Error(`Failed to create sample messages: ${messagesError.message}`)
    }

    console.log('Test data seeded successfully')
    return true
  } catch (error) {
    console.error('Test data seeding failed:', error)
    return false
  }
}