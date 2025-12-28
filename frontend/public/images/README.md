# Petunjuk Menambahkan Gambar untuk Eye Exam Website

## 📁 Lokasi File Gambar
Simpan semua gambar di folder: `public/images/`

## 🖼️ Format File yang Diperlukan

### Tokoh Pendidikan
#### 1. Mohammad Hatta
- **Nama file**: `hatta.png`
- **Lokasi**: `public/images/hatta.png`
- **Recommended size**: 350x380 pixels atau rasio yang sesuai
- **Format**: PNG, JPG, atau WEBP

#### 2. Michael Josephson
- **Nama file**: `josephson.png` 
- **Lokasi**: `public/images/josephson.png`
- **Recommended size**: 350x380 pixels atau rasio yang sesuai
- **Format**: PNG, JPG, atau WEBP

#### 3. R.A. Kartini
- **Nama file**: `kartini.png`
- **Lokasi**: `public/images/kartini.png`
- **Recommended size**: 350x380 pixels atau rasio yang sesuai
- **Format**: PNG, JPG, atau WEBP

### Gambar Ujian/Tes (Featured Images Grid)
#### 1. Gambar Utama (Vertikal)
- **Nama file**: `exam-1.jpg`
- **Lokasi**: `public/images/exam-1.jpg`
- **Recommended size**: 500x600 pixels (vertikal)
- **Deskripsi**: Siswa sedang mengerjakan ujian, suasana kelas dengan dinding geometris

#### 2. Gambar Kecil Atas (Horizontal)
- **Nama file**: `exam-2.jpg`
- **Lokasi**: `public/images/exam-2.jpg`
- **Recommended size**: 400x280 pixels (horizontal)
- **Deskripsi**: Guru mengawasi ujian di kelas

#### 3. Gambar Kecil Tengah (Horizontal)
- **Nama file**: `exam-3.jpg`
- **Lokasi**: `public/images/exam-3.jpg`
- **Recommended size**: 400x280 pixels (horizontal)
- **Deskripsi**: Setting kelas ujian dengan siswa dan meja

#### 4. Gambar Lebar Bawah (Landscape)
- **Nama file**: `exam-4.jpg`
- **Lokasi**: `public/images/exam-4.jpg`
- **Recommended size**: 600x200 pixels (landscape lebar)
- **Deskripsi**: Pandangan lebar ruang kelas saat ujian

## 🔧 Cara Menambahkan Gambar

1. **Simpan gambar** dari attachment yang diberikan
2. **Rename** sesuai dengan nama yang sudah ditentukan:
   - Gambar 1 (R.A. Kartini) → `kartini.jpg`
   - Gambar 2 (Michael Josephson) → `josephson.jpg`
   - Gambar 3 (Mohammad Hatta) → `hatta.jpg`
3. **Copy** file ke folder `public/images/`
4. **Restart** development server dengan `npm run dev`
5. **Refresh** browser (Ctrl+F5)

## 📋 Struktur Folder yang Benar
```
my-react-router-app/
├── public/
│   └── images/
│       ├── hatta.jpg      ← Mohammad Hatta
│       ├── josephson.jpg  ← Michael Josephson
│       └── kartini.jpg    ← R.A. Kartini
└── app/
    └── routes/
        └── articles.tsx
```

## ⚠️ Troubleshooting

Jika gambar tidak muncul:
1. Pastikan nama file exact match (case-sensitive)
2. Pastikan gambar ada di folder `public/images/`
3. Restart development server
4. Hard refresh browser (Ctrl+F5)
5. Check console browser untuk error

## 🎨 Tips Optimisasi Gambar

- **Ukuran ideal**: 350x380 pixels
- **Format**: JPG untuk foto, PNG untuk gambar dengan transparansi
- **File size**: Maksimal 500KB per gambar untuk performa optimal
- **Quality**: 80-90% untuk balance antara kualitas dan ukuran file