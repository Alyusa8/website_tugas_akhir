# Cara Mengatasi Masalah Profile Update yang Kembali ke Nilai Lama

## 🔴 Masalah

Ketika Anda:
1. Edit nama lengkap → Save → Berhasil ✓
2. Logout → Login ulang
3. Nama **kembali ke nilai lama** ✗

## 🔍 Penyebab Akar

Ada 2 kemungkinan:

### Kemungkinan 1: Trigger Database Lama (PALING MUNGKIN)
- File: `database/supabase-triggers.sql`
- **Trigger `on_auth_user_updated` mengoverwrite data** setiap kali user login
- Trigger ini restore nilai lama dari `auth.users` metadata

### Kemungkinan 2: RLS Policy Tidak Bekerja
- User tidak bisa read/write data mereka sendiri di table `public.users`
- Karena RLS policy tidak dikonfigurasi dengan benar

---

## ✅ SOLUSI LENGKAP (4 Langkah)

### LANGKAH 1: Jalankan Script Perbaikan di Supabase

1. Buka **Supabase Dashboard** → pilih project Anda
2. Klik menu **SQL Editor** (ikon database di sidebar)
3. Klik **+ New Query**
4. Copy-paste seluruh isi file `database/FIX_PROFILE_PERSISTENCE.sql`
5. Click **Run** (tombol hijau di kanan bawah)
6. Tunggu sampai selesai (harus ada "Success" message)

**Screenshot Path:**
```
Supabase Dashboard 
  → SQL Editor 
    → + New Query 
      → Paste FIX_PROFILE_PERSISTENCE.sql 
        → Run
```

---

### LANGKAH 2: Verifikasi Fix (PENTING!)

Setelah menjalankan script, jalankan query verifikasi ini untuk memastikan semua berhasil:

```sql
-- Query 1: Cek RLS Policies
SELECT tablename, policyname, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Expected output: 3 policies
-- - Users can view own profile
-- - Users can update own profile  
-- - Users can insert own profile
```

```sql
-- Query 2: Cek Triggers
SELECT trigger_name, event_object_table, event_manipulation
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_schema = 'public';

-- Expected output: 1 trigger
-- - update_users_updated_at (BEFORE UPDATE on public.users)
```

```sql
-- Query 3: Test akses sebagai user (run ini HANYA jika punya RLS bypass)
SELECT id, email, full_name FROM public.users LIMIT 5;
```

---

### LANGKAH 3: Update Frontend Code

✅ **Sudah dilakukan otomatis!** 

File yang sudah diupdate:
- `frontend/app/contexts/ProfileContext.tsx` - Ditambah better error logging

---

### LANGKAH 4: Test di Application

1. **Logout** dari akun Anda
2. **Login** kembali dengan email & password
3. Buka halaman **Profile** (Profil Akun)
4. **Edit nama lengkap** (misal: "Jozu" → "Jozu Baru")
5. Click **Save** 
6. Periksa browser console (F12) untuk error

**Jika sukses:**
- Ada notifikasi "Profile berhasil diupdate!"
- Nama berubah di halaman
- **Logout** → **Login** → Nama tetap sama ✓

**Jika masih error:**
- Lihat error message di console (F12)
- Cek Supabase logs

---

## 🐛 Debugging Jika Masih Ada Masalah

### Cek 1: Buka Browser Console (F12)
```
Catat error messages yang muncul:
- Permission denied (RLS issue)
- Row not found (data issue)
- Lainnya
```

### Cek 2: Lihat Supabase Logs
```
Supabase Dashboard 
  → Logs (di sidebar) 
    → Lihat SQL errors
```

### Cek 3: Cek RLS Bypass

Jika user tidak bisa read data sendiri, mungkin session ada masalah:

```tsx
// Di browser console, jalankan:
const { data: { session } } = await supabase.auth.getSession();
console.log('Current session:', session);
console.log('User ID:', session?.user?.id);
```

### Cek 4: Manual Query Test

Buat test file `frontend/test-profile.ts`:

```typescript
import { supabase } from './app/lib/supabase';

export async function testProfileQuery() {
  console.log('Testing profile query...');
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.error('No session found!');
    return;
  }
  
  console.log('Logged in as:', session.user.id);
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  console.log('Query result:', { data, error });
  
  if (error) {
    console.error('RLS or DB Error:', error.message);
  } else {
    console.log('Full name from DB:', data.full_name);
  }
}

// Run di console:
// import { testProfileQuery } from './test-profile';
// testProfileQuery();
```

---

## 🎯 Ringkasan

| Langkah | Aksi | Status |
|---------|------|--------|
| 1 | Run `FIX_PROFILE_PERSISTENCE.sql` di Supabase | ⏳ **HARUS DILAKUKAN** |
| 2 | Verifikasi dengan query cek RLS & triggers | ⏳ **HARUS DILAKUKAN** |
| 3 | Update frontend code | ✅ **SUDAH DILAKUKAN** |
| 4 | Test di aplikasi | ⏳ **LAKUKAN SEKARANG** |

---

## 📝 Catatan Penting

- **Jangan jalankan script 2x** - bisa error. Jika error, clear semua dan jalankan sekali saja
- **Tunggu selesai** - jangan refresh/close tab sampai status "Success"
- **Clear cache browser** - kalau masih error, coba Ctrl+Shift+Delete
- **Restart dev server** - jika perlu, jalankan ulang frontend (`npm run dev`)

---

## 📞 Jika Masih Stuck

Kumpulkan informasi ini:
1. Screenshot error message di console (F12)
2. Output dari query verification di Supabase
3. Nama user dan email yang di-test
4. Browser yang digunakan

Kemudian saya bisa bantu debug lebih lanjut!
