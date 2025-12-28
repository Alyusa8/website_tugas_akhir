-- Quick check untuk see if ada data
SELECT COUNT(*) as session_count FROM detection_sessions;
SELECT COUNT(*) as image_count FROM detection_images;

-- List semua sessions
SELECT 
  ds.id,
  ds.session_id,
  ds.started_at,
  ds.total_screenshots,
  COUNT(di.id) as actual_image_count
FROM detection_sessions ds
LEFT JOIN detection_images di ON ds.id = di.session_id
GROUP BY ds.id, ds.session_id, ds.started_at, ds.total_screenshots
ORDER BY ds.started_at DESC
LIMIT 10;
