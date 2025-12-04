# MagangHub - Portal Lowongan Magang Indonesia

Aplikasi web sederhana untuk menampilkan lowongan magang dari [MagangHub Kemnaker](https://maganghub.kemnaker.go.id).

![Preview](preview.png)

## Fitur

- 🔍 **Pencarian** - Cari lowongan berdasarkan kata kunci posisi
- 📍 **Filter Provinsi** - Filter lowongan berdasarkan provinsi
- 📄 **Pagination** - Navigasi halaman yang mudah
- 📱 **Responsive** - Tampilan yang optimal di semua perangkat
- 🎨 **Modern UI** - Desain modern dan user-friendly

## Teknologi

- HTML5
- CSS3 (dengan Flexbox & Grid)
- Vanilla JavaScript (ES6+)
- Google Fonts (Inter)

## Cara Menjalankan Secara Lokal

1. Clone repository ini:
   ```bash
   git clone https://github.com/username/magangapp.git
   cd magangapp
   ```

2. Buka file `index.html` di browser, atau gunakan live server:
   ```bash
   # Menggunakan Python
   python -m http.server 8000
   
   # Menggunakan Node.js (npx)
   npx serve
   
   # Menggunakan VS Code Live Server Extension
   # Klik kanan pada index.html -> "Open with Live Server"
   ```

3. Buka browser dan akses `http://localhost:8000`

## Deploy ke GitHub Pages

1. **Buat Repository GitHub:**
   - Buka [GitHub](https://github.com) dan login
   - Klik "New repository"
   - Beri nama repository (contoh: `magangapp`)
   - Pilih "Public"
   - Klik "Create repository"

2. **Push Kode ke GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - MagangHub App"
   git branch -M main
   git remote add origin https://github.com/username/magangapp.git
   git push -u origin main
   ```

3. **Aktifkan GitHub Pages:**
   - Buka repository di GitHub
   - Pergi ke **Settings** → **Pages**
   - Di bagian "Source", pilih **Deploy from a branch**
   - Pilih branch **main** dan folder **/ (root)**
   - Klik **Save**

4. **Akses Aplikasi:**
   - Tunggu beberapa menit untuk proses deploy
   - Aplikasi akan tersedia di: `https://username.github.io/magangapp`

## Struktur File

```
magangapp/
├── index.html      # Halaman utama
├── style.css       # Stylesheet
├── app.js          # Logic aplikasi
└── README.md       # Dokumentasi
```

## API

Aplikasi ini menggunakan API dari MagangHub Kemnaker:

```
GET https://maganghub.kemnaker.go.id/be/v1/api/list/vacancies-aktif
```

**Query Parameters:**
| Parameter | Deskripsi |
|-----------|-----------|
| `page` | Nomor halaman |
| `limit` | Jumlah data per halaman |
| `per_page` | Jumlah data per halaman |
| `keyword` | Kata kunci pencarian |
| `kode_provinsi` | Kode provinsi (contoh: 32 untuk Jawa Barat) |
| `order_by` | Field untuk sorting |
| `order_direction` | ASC atau DESC |

## Screenshot

### Desktop View
Tampilan aplikasi di desktop dengan daftar lowongan magang.

### Mobile View
Tampilan responsif untuk perangkat mobile.

## Lisensi

MIT License - Bebas digunakan dan dimodifikasi.

## Kontribusi

1. Fork repository ini
2. Buat branch baru (`git checkout -b fitur-baru`)
3. Commit perubahan (`git commit -m 'Menambahkan fitur baru'`)
4. Push ke branch (`git push origin fitur-baru`)
5. Buat Pull Request

## Disclaimer

Aplikasi ini dibuat untuk tujuan edukasi. Data lowongan berasal dari API publik MagangHub Kemnaker RI.
