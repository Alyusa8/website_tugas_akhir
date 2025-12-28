-- Check user data to see phone and gender values
SELECT 
  id,
  email,
  full_name,
  phone,
  gender,
  date_of_birth,
  created_at
FROM users
WHERE email = 'yexofai263@arugy.com';

-- To clean the phone field, uncomment and run this:
-- UPDATE users 
-- SET phone = NULL 
-- WHERE email = 'yexofai263@arugy.com';
