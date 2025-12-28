import { supabase, detectionHelpers } from '../frontend/app/lib/supabase.ts';

async function testHistoryFetch() {
  try {
    console.log("🔍 Testing getUserDetectionHistory function...\n");
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log("❌ No user logged in. Please login first.");
      process.exit(1);
    }

    console.log(`👤 Current user: ${user.email} (${user.id})\n`);
    
    // Call the function
    const sessions = await detectionHelpers.getUserDetectionHistory(user.id, 5);
    
    console.log(`\n📊 RESULT: ${sessions.length} sessions fetched\n`);
    
    sessions.forEach((session, i) => {
      console.log(`Session ${i + 1}:`);
      console.log(`  ID: ${session.id}`);
      console.log(`  Session ID: ${session.session_id}`);
      console.log(`  Started: ${session.started_at}`);
      console.log(`  Total Screenshots (metadata): ${session.total_screenshots}`);
      console.log(`  Images Array Length: ${session.images?.length || 0}`);
      
      if (session.images && session.images.length > 0) {
        console.log(`  First Image: ${session.images[0].image_url}`);
        console.log(`  Direction: ${session.images[0].direction}`);
      }
      console.log();
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testHistoryFetch();
