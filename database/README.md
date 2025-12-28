# Panduan Implementasi Trigger Authentication di Supabase

## Langkah-langkah Setup

### 1. Buka Supabase Dashboard
- Login ke [Supabase Dashboard](https://app.supabase.com/)
- Pilih project Anda: `wxvpjellodxhdttlwysn`

### 2. Jalankan SQL Triggers
- Buka **SQL Editor** di dashboard Supabase
- Copy seluruh isi file `supabase-triggers.sql`
- Paste ke SQL Editor dan klik **Run**

### 3. Verifikasi Setup

#### Cek Tabel Users
```sql
SELECT * FROM public.users;
```

#### Cek Triggers
```sql
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' OR event_object_schema = 'auth';
```

#### Cek Functions
```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
```

### 4. Test Trigger

#### Test Registration (Akan otomatis create user di tabel users)
```javascript
// Di frontend, saat user register:
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123',
  options: {
    data: {
      full_name: 'Test User'
    }
  }
})
```

#### Test Manual Profile Update
```sql
-- Update user profile menggunakan function
SELECT public.update_user_profile(
  'user-uuid-here',
  'New Name',          -- full_name
  '+6281234567890',    -- phone
  '1990-01-01',        -- date_of_birth
  'male',              -- gender
  'https://example.com/avatar.jpg' -- avatar_url
);
```

## Fitur yang Tersedia

### 1. Automatic User Creation
- Saat user register, otomatis masuk ke tabel `public.users`
- Data diambil dari `auth.users` dan `raw_user_meta_data`

### 2. Automatic Profile Sync
- Perubahan di `auth.users` otomatis sync ke `public.users`
- Update timestamp otomatis

### 3. Row Level Security (RLS)
- User hanya bisa lihat/edit profile sendiri
- Keamanan tingkat database

### 4. Helper Functions
- `get_user_profile(user_id)` - Get profile by ID
- `update_user_profile(...)` - Update profile dengan validasi

## Troubleshooting

### Error: "relation does not exist"
- Pastikan tabel `public.users` sudah dibuat
- Jalankan ulang bagian CREATE TABLE

### Error: "permission denied"
- Pastikan RLS policies sudah aktif
- Cek apakah user sudah login di frontend

### Trigger tidak jalan
- Cek apakah trigger sudah aktif:
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE '%auth_user%';
```

## Testing dari Frontend

Setelah setup trigger, test dengan:

1. **Register user baru** - harus otomatis masuk ke tabel users
2. **Login** - data user harus tersedia di context
3. **Update profile** - perubahan harus tersimpan

```javascript
// Test di AuthContext atau Profile page
const testUserCreation = async () => {
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
  
  console.log('User in database:', users)
}
```

## Struktur Tabel Users

```sql
public.users:
- id (UUID, Primary Key, references auth.users.id)
- email (TEXT, NOT NULL, UNIQUE)
- full_name (TEXT)
- avatar_url (TEXT)
- phone (TEXT)
- date_of_birth (DATE)
- gender (TEXT, CHECK: male/female/other)
- created_at (TIMESTAMPTZ, DEFAULT NOW())
- updated_at (TIMESTAMPTZ, DEFAULT NOW())
```