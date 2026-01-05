# Perbaikan Error: "requested path is invalid" saat Login dengan Google

## 🔴 Masalah
Error `{"error":"requested path is invalid"}` muncul saat mencoba login dengan Google OAuth.

## 🔍 Penyebab
Redirect URL yang digunakan aplikasi tidak sesuai dengan konfigurasi di:
1. Supabase Dashboard
2. Google OAuth Console

## ✅ Solusi

### 1. Konfigurasi Redirect URL di Supabase

1. Buka [Supabase Dashboard](https://app.supabase.com/)
2. Pilih project: **wxvpjellodxhdttlwysn**
3. Pergi ke **Authentication** → **URL Configuration**
4. Tambahkan URL berikut ke **Redirect URLs**:

   **Untuk Development (localhost):**
   ```
   http://localhost:5173/auth/callback
   http://localhost:3000/auth/callback
   ```

   **Untuk Production (Vercel/domain Anda):**
   ```
   https://your-domain.vercel.app/auth/callback
   https://your-custom-domain.com/auth/callback
   ```

5. Klik **Save**

### 2. Konfigurasi di Google OAuth Console

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Pilih project Anda
3. Pergi ke **APIs & Services** → **Credentials**
4. Edit **OAuth 2.0 Client ID** yang digunakan
5. Di **Authorized redirect URIs**, tambahkan:

   **Supabase Callback (WAJIB):**
   ```
   https://wxvpjellodxhdttlwysn.supabase.co/auth/v1/callback
   ```

   **Application Redirects:**
   ```
   http://localhost:5173/auth/callback
   http://localhost:3000/auth/callback
   https://your-domain.vercel.app/auth/callback
   ```

6. Klik **Save**

### 3. Verifikasi Site URL di Supabase

1. Di Supabase Dashboard → **Authentication** → **URL Configuration**
2. Pastikan **Site URL** sudah benar:
   - Development: `http://localhost:5173` atau `http://localhost:3000`
   - Production: `https://your-domain.vercel.app`

### 4. Test Google Login

1. Refresh browser Anda
2. Buka halaman login
3. Klik tombol "Masuk dengan Google"
4. Seharusnya redirect ke Google Sign-In tanpa error
5. Setelah login, redirect kembali ke aplikasi Anda

## 🔧 Perubahan Kode

File yang sudah diperbaiki:
- `frontend/app/lib/supabase.ts` - Diperbaiki redirect URL di fungsi `signInWithGoogle()`

## 📝 Catatan Penting

1. **Redirect URL harus PERSIS sama** dengan yang dikonfigurasi di Supabase dan Google
2. **Jangan ada trailing slash** di akhir URL (gunakan `/auth/callback` bukan `/auth/callback/`)
3. **HTTP vs HTTPS** - Pastikan protocol (http/https) sesuai dengan environment
4. **Port number** - Untuk localhost, pastikan port sesuai (5173 untuk Vite default)

## 🧪 Cara Test

### Test di Localhost:
```bash
# 1. Start frontend
cd frontend
npm run dev

# 2. Buka browser
http://localhost:5173/login

# 3. Klik "Masuk dengan Google"
# Seharusnya redirect ke Google Sign-In tanpa error
```

### Test di Production:
1. Deploy ke Vercel/server Anda
2. Buka URL production
3. Test Google login
4. Pastikan tidak ada error

## ❓ FAQ

**Q: Masih error setelah konfigurasi?**
A: Tunggu 1-2 menit setelah save konfigurasi di Google Console. Kadang butuh waktu untuk propagasi.

**Q: Redirect ke Supabase tapi tidak balik ke aplikasi?**
A: Check kembali Redirect URLs di Supabase, pastikan URL aplikasi Anda sudah ditambahkan.

**Q: Error "redirect_uri_mismatch"?**
A: URL di Google Console tidak match dengan yang dikirim aplikasi. Check kembali konfigurasi Google OAuth.

## 📞 Support

Jika masih ada masalah:
1. Check console browser untuk error message
2. Check Network tab untuk request/response details
3. Verifikasi semua URL sudah dikonfigurasi dengan benar
