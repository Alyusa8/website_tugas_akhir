# 🧪 Testing Tahap 1: Pipeline Data Browser → Backend

## ✅ Langkah Testing (BERURUTAN!)

### 1️⃣ Test Backend Endpoint Minimal
```bash
# Terminal 1: Jalan backend Node.js
cd backend
npm start

# Terminal 2: Test endpoint dengan curl
curl -X POST http://localhost:5000/api/detection/frame \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/jpeg;base64,xxx"}'
```

✅ Harus dapat respon JSON:
```json
{
  "status": "ok",
  "direction": "DEPAN",
  "confidence": 0.95,
  "face_detected": true,
  "message": "Frame received and processed"
}
```

---

### 2️⃣ Test Frontend Webcam
```bash
# Terminal 3: Jalan frontend
cd frontend
npm run dev
```

Buka: `http://localhost:5173`

Klik **"Mulai Deteksi"** → Webcam harus tampil

---

### 3️⃣ Test Frame Sending ke Backend

Buka **DevTools** (F12):
- Tab **Network**
- Filter: `frame`

Klik **"Mulai Deteksi"** → Lihat request POST ke `/api/detection/frame`

**Cek:**
- ✅ Request terkirim? (lihat di Network tab)
- ✅ Response status 200?
- ✅ Response JSON muncul?
- ✅ Console error?

---

## 🔴 Jika ada error:

### Webcam tidak muncul?
```
Error: Failed to access webcam
```
**Solusi:**
- Izin browser (allow webcam)
- Cek `HTTP` bukan `HTTPS` lokal

---

### Request tidak terkirim?
**Cek di DevTools → Network:**
- URL benar? (`http://localhost:5000/api/detection/frame`)
- Headers `Content-Type: application/json`?

---

### Backend error / 500?
**Cek terminal backend log:**
```
Error: ...
```

---

## 📊 FPS Counter

Lihat **FPS** di kanan atas layar video.

Target: **≥ 5 FPS** (minimal)

---

## ✅ Setelah Tahap 1 Berhasil:

**Backend menerima base64 image** → Siap untuk **Langkah 4: Integrase YOLO**

**Next:** [LANGKAH_4_YOLO.md](./LANGKAH_4_YOLO.md)
