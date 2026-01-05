# Fix Google OAuth di Vercel

## 🔴 Masalah
Error: `{"error": "requested path is invalid"}` saat login dengan Google di Vercel

## 🔍 Penyebab
Google OAuth Console dan Supabase belum dikonfigurasi dengan Vercel domain sebagai authorized redirect URI.

## ✅ Solusi

### Step 1: Tambah Vercel Domain ke Google OAuth Console

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Pilih project Anda
3. Pergi ke **APIs & Services** → **Credentials**
4. Edit **OAuth 2.0 Client** yang digunakan
5. Tambahkan ke **Authorized redirect URIs**:
   - `https://your-vercel-domain.vercel.app/auth/callback`
   - Contoh: `https://website-tugas-akhir.vercel.app/auth/callback`
6. Click **Save**

### Step 2: Tambah Vercel Domain ke Supabase

1. Buka [Supabase Dashboard](https://app.supabase.com/)
2. Pilih project Anda
3. Pergi ke **Authentication** → **URL Configuration**
4. Tambahkan ke **Redirect URLs**:
   ```
   https://your-vercel-domain.vercel.app/auth/callback
   ```
5. Click **Save**

### Step 3: Verify Environment Variables di Vercel

Pastikan di Vercel sudah ada environment variables:
- `VITE_SUPABASE_URL` → URL Supabase project
- `VITE_SUPABASE_ANON_KEY` → Anon key dari Supabase

Jika belum ada:
1. Pergi ke Vercel Project Settings
2. **Environment Variables**
3. Tambahkan kedua variables di atas
4. **Redeploy** project

### Step 4: Redeploy Vercel

Setelah semua perubahan, trigger redeploy:
1. Buka [Vercel Dashboard](https://vercel.com/dashboard)
2. Pilih project
3. Klik **Deployments**
4. Pilih deployment terakhir
5. Klik **Redeploy**

## 📝 Contoh URL

Jika Vercel domain Anda: `https://website-tugas-akhir.vercel.app`

Maka redirect URL harus:
- `https://website-tugas-akhir.vercel.app/auth/callback`

## 🧪 Testing

Setelah semua langkah:
1. Buka Vercel domain
2. Klik Login dengan Google
3. Harus bisa login tanpa error

## ❓ Debugging

Jika masih error, check:
1. Console browser → Network tab → cek request ke Google
2. Supabase logs → Authentication
3. Pastikan domain di Google OAuth Console exact match dengan Vercel domain
