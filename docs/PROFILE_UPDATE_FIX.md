# Profile Update Fix - Masalah Nama Lengkap Kembali Ke Nilai Lama

## 🐛 Masalah yang Dialami

Ketika user mengubah nama lengkap (full_name) dan menyimpannya:
1. Perubahan berhasil disimpan sementara (terlihat di UI)
2. **Setelah logout dan login ulang, nama kembali ke nilai lama sebelumnya**

## 🔍 Root Cause Analysis

### Penyebab Masalah

Ada **trigger database yang bermasalah** di `supabase-triggers.sql`:

```sql
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();
```

Trigger ini **otomatis tertrigger setiap kali auth.users diupdate** (misalnya saat login, update last_sign_in_at, dll).

Fungsi `handle_user_update()` yang lama:
```sql
full_name = CASE 
  WHEN full_name IS NULL OR full_name = '' THEN 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ...)
  ELSE full_name  
END
```

**Masalah**: Ketika Supabase Auth secara internal mengupdate `auth.users` saat login, trigger ini akan mencoba "restore" nilai dari `raw_user_meta_data` yang outdated.

### Alur Masalah

```
1. User update full_name → Tersimpan di public.users ✓
2. User logout
3. User login → auth.users di-update oleh Supabase
4. Trigger on_auth_user_updated tertrigger
5. handle_user_update() restore nilai lama dari raw_user_meta_data ✗
6. full_name kembali ke nilai lama ✗
```

## ✅ Solusi yang Diterapkan

### File yang Dimodifikasi
- `database/supabase-triggers.sql`

### Perubahan yang Dilakukan

**Sebelumnya**: Fungsi mencoba sync full_name dari auth.users metadata
```sql
full_name = CASE 
  WHEN full_name IS NULL OR full_name = '' THEN 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ...)
  ELSE full_name  
END
```

**Sesudahnya**: Fungsi HANYA sync email, tidak menyentuh full_name
```sql
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync email from auth.users to public.users
  -- Do NOT sync full_name or avatar_url to preserve user edits
  UPDATE public.users SET
    email = NEW.email,
    updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 📋 Langkah Implementasi

### 1. Update Database Schema
```bash
# Jalankan script SQL di Supabase Dashboard:
# Database → SQL Editor → Paste file supabase-triggers.sql yang sudah diupdate
```

### 2. Verify Trigger Baru
```sql
-- Check fungsi yang ter-update
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'handle_user_update' 
AND routine_schema = 'public';

-- Pastikan trigger hanya update email, tidak full_name
```

## 🧪 Testing

### Test Case 1: Update Full Name
```
1. Login dengan user
2. Edit full_name (misal: "John Doe" → "Jane Smith")
3. Click Save → Harus sukses
4. Reload halaman → Harus tetap "Jane Smith"
5. Logout → Login ulang → Harus tetap "Jane Smith" ✓
```

### Test Case 2: Update Email
```
1. Login dengan user
2. Edit email (jika diizinkan)
3. Logout → Login ulang dengan email baru
4. Full_name harus tetap sesuai yang user set ✓
```

## 🔒 Security Notes

- Trigger HANYA sync email (yang sudah tersertifikasi oleh auth system)
- Full_name, phone, avatar_url, dll dikelola sepenuhnya oleh user melalui public.users table
- RLS policies tetap berlaku untuk all tables
- User hanya bisa update profile mereka sendiri (auth.uid() = id)

## 📌 Best Practices Going Forward

1. **Jangan sync profile fields dari auth.users metadata**
   - auth.users hanya untuk authentication
   - public.users untuk user profile data

2. **Validasi di frontend sebelum update**
   ```tsx
   if (!fullName || !fullName.trim()) {
     alert('Nama tidak boleh kosong');
     return;
   }
   ```

3. **Selalu gunakan `.select().single()` setelah update**
   ```tsx
   const { data, error } = await supabase
     .from('users')
     .update(updateData)
     .eq('id', user.id)
     .select()
     .single();
   ```

4. **Refresh profile data setelah update**
   ```tsx
   await refreshProfile(); // Di ProfileContext
   ```

## 🔄 Rollback (Jika Diperlukan)

Jika ada masalah, kembalikan ke file backup sebelum perubahan dan re-run SQL schema lama.

## 📞 Related Files

- Frontend: `frontend/app/contexts/ProfileContext.tsx`
- Frontend: `frontend/app/routes/profile.tsx`
- Database: `database/supabase-triggers.sql`
- Schema: `database/detection-tables.sql`

---

**Status**: ✅ Fixed  
**Date**: 2025-12-26  
**Impact**: Profile updates now persist correctly after logout/login
