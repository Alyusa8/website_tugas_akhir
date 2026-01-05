import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wxvpjellodxhdttlwysn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4dnBqZWxsb2R4aGR0dGx3eXNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxOTI5MjgsImV4cCI6MjA3Nzc2ODkyOH0.TX2cULDvs8jlYS7Fyu86fa_hiX4PEYFeJOEVVoCYpzU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database tables types (extend as needed)
export interface UserProfile {
  id: string
  email: string
  full_name: string
  created_at: string
  updated_at?: string
}

export interface DetectionSession {
  id: string
  user_id: string
  session_id: string
  started_at: string
  ended_at?: string
  duration_seconds?: number
  total_screenshots: number
  direction_summary?: Record<string, number>
  custom_name?: string
  created_at: string
  updated_at?: string
}

export interface DetectionImage {
  id: string
  session_id: string
  user_id: string
  image_url: string
  direction: string
  confidence: number
  bbox_data?: Record<string, number>
  captured_at: string
  created_at: string
}

// Auth helper functions
export const authHelpers = {
  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  // Sign up with email and password
  signUp: async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
    return data
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Reset password
  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    // Get the current origin (works for both localhost and deployed versions)
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        // Use the correct redirect URL format
        redirectTo: `${origin}/auth/callback`,
      },
    })
    if (error) throw error
    return data
  },

  // Sign up with Google (same as sign in for Google)
  signUpWithGoogle: async () => {
    return await authHelpers.signInWithGoogle()
  }
}

// Detection helpers
export const detectionHelpers = {
  // Create a new detection session record
  createDetectionSession: async (userId: string, sessionId: string, startedAt: string) => {
    const { data, error } = await supabase
      .from('detection_sessions')
      .insert([{
        user_id: userId,
        session_id: sessionId,
        started_at: startedAt,
        total_screenshots: 0,
        direction_summary: { KIRI: 0, DEPAN: 0, KANAN: 0 }
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Upload screenshot to storage and create detection_images record
  uploadScreenshot: async (
    userId: string,
    sessionId: string,
    base64Image: string,
    direction: string,
    confidence: number,
    bboxData: Record<string, number>,
    capturedAt: string
  ) => {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(base64Image.split(',')[1] || base64Image)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/jpeg' })

      // Upload to storage: eye_exam_screenshots/userId/sessionId/timestamp.jpg
      const fileName = `${userId}/${sessionId}/${Date.now()}.jpg`
      console.log(`📤 Uploading to storage: ${fileName}`)
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('eye_exam_screenshots')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError)
        throw uploadError
      }
      
      console.log(`✅ File uploaded: ${fileName}`)

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('eye_exam_screenshots')
        .getPublicUrl(fileName)

      // Get the session database ID first
      const { data: sessionData, error: sessionFetchError } = await supabase
        .from('detection_sessions')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .single()

      if (sessionFetchError) {
        console.error('❌ Failed to fetch session ID:', sessionFetchError)
        throw sessionFetchError
      }

      if (!sessionData) {
        console.error('❌ Session not found for sessionId:', sessionId)
        throw new Error(`Session not found: ${sessionId}`)
      }

      console.log(`📍 Session DB ID: ${sessionData.id}, direction: ${direction}`)

      // Create detection_images record
      const { data: imageRecord, error: recordError } = await supabase
        .from('detection_images')
        .insert([{
          session_id: sessionData.id, // Use database ID, not frontend sessionId
          user_id: userId,
          image_url: fileName,
          direction,
          confidence,
          bbox_data: bboxData,
          captured_at: capturedAt
        }])
        .select()
        .single()

      if (recordError) {
        console.error('❌ Failed to create detection_images record:', recordError)
        throw recordError
      }

      console.log(`✅ Image record created:`, imageRecord)

      return {
        imageRecord,
        imageUrl: publicUrlData?.publicUrl || fileName
      }
    } catch (error) {
      console.error('❌ Error uploading screenshot:', error)
      throw error
    }
  },

  // Update detection session when stopping
  updateDetectionSession: async (
    sessionId: string,
    userId: string,
    endedAt: string,
    durationSeconds: number,
    totalScreenshots: number,
    directionSummary: Record<string, number>
  ) => {
    const { data, error } = await supabase
      .from('detection_sessions')
      .update({
        ended_at: endedAt,
        duration_seconds: durationSeconds,
        total_screenshots: totalScreenshots,
        direction_summary: directionSummary,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get user's detection history with images
  getUserDetectionHistory: async (userId: string, limit = 10) => {
    console.log("📂 Fetching detection sessions for user:", userId);
    
    const { data: sessions, error: sessionsError } = await supabase
      .from('detection_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (sessionsError) {
      console.error("❌ Error fetching sessions:", sessionsError);
      throw sessionsError;
    }
    
    console.log(`✅ Fetched ${sessions?.length || 0} sessions from DB`);
    console.log("  Sessions data:", sessions);
    
    if (!sessions || sessions.length === 0) {
      console.log("⚠️ No sessions found - returning empty array");
      return [];
    }

    // Fetch images for all sessions in parallel
    console.log(`📸 Fetching images for ${sessions.length} sessions in parallel...`);
    
    const sessionsWithImages = await Promise.all(
      sessions.map(async (session) => {
        console.log(`  🔄 Fetching images for session: ${session.id}`);
        
        const { data: images, error: imagesError } = await supabase
          .from('detection_images')
          .select('*')
          .eq('session_id', session.id)
          .order('captured_at', { ascending: true })

        if (imagesError) {
          console.error(`  ❌ Error for session ${session.id}:`, imagesError);
          return { ...session, images: [] };
        }

        const imageCount = images?.length || 0;
        console.log(`  ✅ Session ${session.session_id.substring(0, 8)}: ${imageCount} images found`);
        if (imageCount > 0) {
          console.log(`     First image: ${images[0].image_url}`);
        }
        
        return { ...session, images: images || [] };
      })
    )

    console.log(`✅ COMPLETE: All ${sessionsWithImages.length} sessions now have images populated`);
    return sessionsWithImages;
  },

  // Get detection session with images
  getDetectionSessionWithImages: async (sessionId: string, userId: string) => {
    console.log("🔍 Fetching session details:", { sessionId, userId });
    
    const { data: session, error: sessionError } = await supabase
      .from('detection_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .single()

    if (sessionError) {
      console.error("❌ Error fetching session:", sessionError);
      throw sessionError;
    }

    console.log("✅ Session found:", session.id);

    const { data: images, error: imagesError } = await supabase
      .from('detection_images')
      .select('*')
      .eq('session_id', session.id)
      .order('captured_at', { ascending: true })

    if (imagesError) {
      console.error("❌ Error fetching images:", imagesError);
      throw imagesError;
    }

    console.log(`✅ Found ${images?.length || 0} images for session`);
    return { session, images }
  },

  // Update session custom name
  updateSessionName: async (sessionId: string, userId: string, customName: string) => {
    console.log(`📝 Updating session name:`, { sessionId, customName });
    
    const { data, error } = await supabase
      .from('detection_sessions')
      .update({ custom_name: customName })
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error("❌ Error updating session name:", error);
      throw error;
    }

    console.log(`✅ Session name updated:`, data.custom_name);
    return data;
  },

  // Delete detection session and its images
  deleteDetectionSession: async (sessionId: string, userId: string) => {
    // Get the session record to find its database ID
    const { data: session, error: fetchError } = await supabase
      .from('detection_sessions')
      .select('id')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .single()

    if (fetchError) throw fetchError

    // Delete detection_images (cascade delete would handle this, but explicit is safer)
    const { error: imagesError } = await supabase
      .from('detection_images')
      .delete()
      .eq('session_id', session.id)

    if (imagesError) throw imagesError

    // Delete detection_sessions
    const { error: sessionError } = await supabase
      .from('detection_sessions')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', userId)

    if (sessionError) throw sessionError
  }
}