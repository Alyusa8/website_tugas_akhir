import { supabase, detectionHelpers } from './frontend/app/lib/supabase.ts';

// Test getUserDetectionHistory function
async function testGetUserDetectionHistory() {
  try {
    // Get current user first
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("❌ No user logged in");
      return;
    }

    console.log("👤 Logged in as:", user.email);
    console.log("🔍 Fetching detection history for user:", user.id);

    const sessions = await detectionHelpers.getUserDetectionHistory(user.id, 5);
    
    console.log("📊 Sessions fetched:", sessions.length);
    
    sessions.forEach((session, index) => {
      console.log(`\n--- Session ${index + 1} ---`);
      console.log("  ID:", session.id);
      console.log("  Session ID:", session.session_id);
      console.log("  Started:", session.started_at);
      console.log("  Images:", session.images?.length || 0);
      
      if (session.images && session.images.length > 0) {
        console.log("  First image URL:", session.images[0].image_url);
        console.log("  First image direction:", session.images[0].direction);
      }
    });

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Run test
testGetUserDetectionHistory();
