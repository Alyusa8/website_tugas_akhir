-- Check detection_sessions dan detection_images
SELECT 
  ds.id,
  ds.session_id,
  ds.user_id,
  ds.total_screenshots,
  COUNT(di.id) as image_count,
  STRING_AGG(di.image_url, ', ') as image_urls
FROM detection_sessions ds
LEFT JOIN detection_images di ON ds.id = di.session_id
GROUP BY ds.id, ds.session_id, ds.user_id, ds.total_screenshots
ORDER BY ds.created_at DESC
LIMIT 5;

-- Check specific images to see path format
SELECT 
  id,
  session_id,
  image_url,
  direction,
  captured_at,
  created_at
FROM detection_images
ORDER BY created_at DESC
LIMIT 10;
