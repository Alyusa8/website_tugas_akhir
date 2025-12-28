# 🚀 Menjalankan YOLO Detection API

## Prasyarat

1. **Python 3.8+** sudah terinstall
2. **PyTorch dengan CUDA support** (untuk GPU acceleration)
3. **Node.js** untuk backend server
4. Weights file ada di: `backend/yolo/weights/best.pt`

## Cara Menjalankan

### 1. Terminal 1: Jalankan Python Detection API

**Windows (PowerShell):**
```powershell
cd F:\Tugas Akhir\website_tugas_akhir\backend
python yolo/detection_api_v2.py
```

**Output yang diharapkan:**
```
============================================================
🚀 YOLO DETECTION API v2.0
============================================================
📍 Script dir: ...
📍 Weights: ...
📍 Weights exists: True

📦 Loading YOLOv5 model...
🔧 Device: cuda
   NVIDIA GPU detected
   ...
✅ YOLOv5 model loaded

📦 Loading MediaPipe Pose...
✅ MediaPipe Pose loaded

============================================================
✅ All models loaded successfully!
============================================================

🌐 Server running on http://127.0.0.1:5001
   POST /detect - Single frame detection
   GET /health - Health check
   GET / - Info
```

**⏳ Waktu tunggu:** 10-15 detik untuk model loading

### 2. Terminal 2: Jalankan Backend Server

**Windows (PowerShell):**
```powershell
cd F:\Tugas Akhir\website_tugas_akhir\backend
npm install  # (jika belum install)
node server.js
```

**Output yang diharapkan:**
```
Server running on port 5000
```

### 3. Terminal 3: Jalankan Frontend

**Windows (PowerShell):**
```powershell
cd F:\Tugas Akhir\website_tugas_akhir\frontend
npm install  # (jika belum install)
npm run dev
```

**Output yang diharapkan:**
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5174/
```

## Testing

1. Buka browser: `http://localhost:5174/detection`
2. Klik "Mulai Deteksi"
3. Hadapkan wajah ke kamera
4. Lihat:
   - ✅ Bounding box (hijau) muncul di sekitar wajah
   - ✅ Direction label di atas (KIRI/DEPAN/KANAN)
   - ✅ Face confidence di atas bbox

## Debugging

### Issue: "Detection connection lost"
**Solusi:**
- Pastikan Python API berjalan di Terminal 1
- Cek console.log di browser (F12) untuk melihat error detail

### Issue: Direction tidak akurat
**Solusi:**
- Pastikan wajah terlihat jelas dalam frame
- Gerakan kepala lebih ekstrem (minimal 0.25 ratio)
- Lihat console Python untuk debug output

### Issue: "Face not detected"
**Solusi:**
- Pastikan pencahayaan cukup
- Hadapkan wajah langsung ke kamera
- Jarak yang tepat (20-60cm dari kamera)

## Arsitektur

```
Frontend (React)
    ↓
Browser mediaDevices getUserMedia (webcam)
    ↓
Capture frame setiap 500ms
    ↓
POST base64 ke /api/detection/frame
    ↓
Backend (Node.js)
    ↓
Forward ke Python API (port 5001)
    ↓
Python Detection API (detection_api_v2.py)
    ├─ YOLO: Face detection + bbox
    ├─ MediaPipe Pose: Head direction
    └─ Return: {direction, bbox, face_confidence}
    ↓
Draw bbox & direction di overlay canvas
    ↓
Update React state
```

## File Penting

- `backend/yolo/detection_api_v2.py` - Cleaned up detection API
- `backend/routes/detection.js` - Express endpoint `/api/detection/frame`
- `frontend/app/routes/detection.tsx` - React detection page dengan overlay canvas

## Performance Tips

✅ **Running well if:**
- Detection API startup: 10-15s
- Frame processing: 100-200ms per frame
- Webcam FPS: 2 frames per second

⚡ **GPU Optimization:**
- FP16 precision enabled (faster inference)
- Model.eval() mode (no gradient computation)
- Batch processing ready

## Notes

- **Direction threshold:** 0.25 ratio untuk detection yang agresif
- **Frame size:** 1280x720 (matching YOLO model training)
- **Pose detection:** MediaPipe Pose Landmark nose + ears
- **Confidence:** Based on ratio distance antara nose dan ears

---

**Last updated:** December 23, 2025
