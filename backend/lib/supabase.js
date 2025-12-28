import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL || 'https://wxvpjellodxhdttlwysn.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4dnBqZWxsb2R4aGR0dGx3eXNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxOTI5MjgsImV4cCI6MjA3Nzc2ODkyOH0.TX2cULDvs8jlYS7Fyu86fa_hiX4PEYFeJOEVVoCYpzU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin functions for server-side operations
export const supabaseAdmin = {
  // Verify JWT token
  verifyToken: async (token) => {
    const { data, error } = await supabase.auth.getUser(token)
    if (error) throw error
    return data.user
  },

  // Get user profile
  getUserProfile: async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  // Create user profile
  createUserProfile: async (userId, email, fullName) => {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          email,
          full_name: fullName,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update user profile
  updateUserProfile: async (userId, updateData) => {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

export default supabase