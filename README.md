<div align="center">

<!-- Animated Pixel Art Cassette Tape -->
<img src="./public/pixel-art.svg?v=3" width="360" alt="Melodia Pixel Art Animation" />

# 🎵 Melodia

### _Immersive Synced Lyrics Player_

**Dengarkan lagu lengkap + lirik sinkron real-time.**<br>
**Cari lagu apapun. Lirik otomatis muncul & mengikuti musik secara presisi.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

## 🎨 Apa itu Melodia?
**Melodia** adalah pemutar musik web premium berbasis web yang menyinkronkan lirik lagu secara real-time. Dengan menghubungkan basis data lirik **LRCLIB** dan audio streaming dari **Piped (YouTube API)**, Melodia menghadirkan lirik karaoke yang presisi dibalut dengan desain estetika modern bernuansa retro-future.

---

## ✨ Fitur Utama

```
🎧  Full-length streaming      Putar lagu penuh lewat YouTube (hidden player)
🔍  Smart search                Cari lagu, artis, atau album — hasil instan
🏠  Home Dashboard              Halaman muka interaktif dengan saran lagu populer
📝  Synced lyrics               Lirik real-time yang mengikuti beat musik
⛶  Fullscreen Lyrics           Fokus mendengarkan musik dengan lirik layar penuh (immersive)
💬  Artist Recommendations      Panel rekomendasi lagu lain dari penyanyi yang sama secara real-time
🔁  Smart Auto-Play             Lagu berikutnya otomatis diputar ketika lagu aktif selesai
⏮/⏭ Track Navigation          Navigasi mudah ke lagu sebelum/sesudah dalam riwayat putar
📁  Playlist Importer (Beta)    Impor playlist Anda dari Spotify dan YouTube langsung ke antrean
💾  State Persistence           Menyimpan antrean, lirik, dan status halaman di localStorage (aman dari refresh)
🎨  4 premium themes            Pastel Dream · Retro VHS · Dark Space · Cyberpunk
📊  Live visualizer             Animasi audio bars 60fps di canvas
🔧  Sync offset                 Geser timing lirik ± 0.1 detik jika tidak pas
```

---

## 📂 Fitur Impor Playlist — Spotify & YouTube (BETA)

Fitur Impor Playlist memungkinkan Anda memasukkan daftar lagu dari playlist YouTube atau Spotify ke dalam antrean lagu Melodia Anda.

> [!IMPORTANT]
> **Status Fitur: BETA**
> Fitur ini masih dalam tahap uji coba awal. Silakan baca petunjuk integrasi berikut untuk memastikan koneksi lancar.

### 🎥 Impor Playlist YouTube
* Cukup salin URL playlist YouTube publik (misal: `https://www.youtube.com/playlist?list=PL...`) lalu tempelkan ke modal impor playlist.
* Aplikasi akan mengambil video di dalam playlist secara dinamis melalui server Piped dan memutarnya satu per satu.

### 🟢 Impor Playlist Spotify (PKCE Auth Flow)
Untuk mengambil data dari playlist Spotify, aplikasi menggunakan otorisasi **Spotify Web API** resmi dengan metode **PKCE Authorization Code Flow** yang aman dan berjalan 100% di sisi klien.

* **Client ID**: Aplikasi ini telah terintegrasi dengan Client ID default.
* **Alamat Redirect (Redirect URI)**:
  Agar otorisasi berhasil, alamat situs Anda harus didaftarkan di dashboard pengembang Spotify Anda.
  * Saat berjalan lokal: `http://localhost:5174/` atau `http://localhost:5173/`
  * Saat berjalan live (GitHub Pages): `https://ardiansyaht.github.io/music/`
* **Cara Mengatasi Error `redirect_uri: Not matching configuration`**:
  1. Masuk ke [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard).
  2. Buka App Anda dan masuk ke bagian **Settings**.
  3. Di kolom **Redirect URIs**, pastikan Anda telah menambahkan alamat yang sesuai:
     * `http://localhost:5174` (jika menguji lokal)
     * `https://ardiansyaht.github.io/music/` (jika di GitHub Pages)
  4. Klik **Save** di bagian bawah dashboard Spotify.

---

## 🌐 Hosting & Deployment (GitHub Pages)
Aplikasi ini sudah dikonfigurasi agar bisa di-deploy langsung ke **GitHub Pages** secara otomatis menggunakan GitHub Actions.

Untuk mengaktifkannya:
1. Masuk ke tab **Settings** repositori GitHub Anda.
2. Di sidebar kiri, klik **Pages**.
3. Di bawah bagian **Build and deployment** -> **Source**, ubah pilihan dropdown menjadi **GitHub Actions**.
4. Selesai! Halaman web Anda akan otomatis dibuat dan siap diakses di alamat `https://ardiansyaht.github.io/music/`.

---

## 🚀 Cara Menjalankan Secara Lokal

### Menggunakan Script Pembantu (Rekomendasi)
Jika Anda menggunakan Windows dan tidak memiliki Node.js global, Anda bisa langsung menjalankan perintah ini di folder proyek:

```powershell
# Jalankan server development
.\run-dev.ps1
```

### Secara Manual (Jika Node.js terinstal secara global)
```bash
# Install dependencies
npm install

# Run dev server
npm run dev
```

Buka **http://localhost:5174** di browser Anda.

---

## 🎨 Tema Premium

<table>
<tr>
<td align="center">🌸<br><b>Pastel Dream</b><br><sub>Warna pink lembut & estetika hangat</sub></td>
<td align="center">📼<br><b>Retro VHS</b><br><sub>Warna cyan neon & scanlines CRT</sub></td>
<td align="center">🌌<br><b>Dark Space</b><br><sub>Estetika ungu nebula luar angkasa</sub></td>
<td align="center">⚡<br><b>Cyberpunk</b><br><sub>Kontras tinggi kuning & merah neon</sub></td>
</tr>
</table>

---

## 🛠️ Tech Stack & API

| Layer | Teknologi / API | Fungsi | Gratis? |
|-------|-----------------|--------|:-------:|
| ⚛️ Framework | **React 19 + JSX** | Struktur UI Modular | ✅ |
| ⚡ Build Tool | **Vite 8** | Bundler & Development Server super cepat | ✅ |
| 🎵 Audio | **YouTube IFrame API** | Audio streaming (disembunyikan secara visual) | ✅ |
| 🔍 Search / Stream | **Piped API** | Pencarian video & backup stream otomatis | ✅ |
| 📝 Lirik | **LRCLIB.net** | Pengambilan lirik sinkron format LRC | ✅ |
| 🖼️ Album Art | **Deezer API** | Pengambilan cover album melalui JSONP | ✅ |
| 🟢 Playlist Auth | **Spotify API (PKCE)** | Integrasi login & data playlist Spotify | ✅ |

---

## 📁 Struktur Project Modular

```
music/
├── index.html                  # Entry point HTML
├── package.json                # Dependensi & script proyek
├── public/
│   └── pixel-art.svg           # Animasi pixel art cassette tape
└── src/
    ├── main.jsx                # React mount point
    ├── App.jsx                 # 🎯 Main Shell & global state orchestrator
    ├── constants.js            # ⚙️ Konstanta & Quick Suggestions
    ├── components/             # 🧱 Komponen UI Terpisah (Hanya JSX)
    │   ├── TopBar.jsx          # Header search & theme switcher
    │   ├── HomePage.jsx        # Landing page dashboard
    │   ├── NowPlaying.jsx      # Info lagu & cover art aktif
    │   ├── Visualizer.jsx      # Canvas audio visualizer 60fps
    │   ├── LyricsPanel.jsx     # Panel lirik reguler
    │   ├── FullscreenLyrics.jsx# Overlay lirik layar penuh
    │   ├── RecommendedPanel.jsx# Panel rekomendasi lagu artis sejenis
    │   ├── PlayerBar.jsx       # Kontrol audio (Play, Prev, Next, Seek)
    │   ├── PlaylistModal.jsx   # 📂 Modal impor playlist (BETA)
    │   └── Toast.jsx           # Komponen pop-up notifikasi toast
    ├── styles/                 # 🎨 Folder Styling Terpisah (Hanya CSS)
    │   ├── index.css           # CSS global reset & token tema
    │   ├── App.css             # CSS khusus untuk layout App shell
    │   ├── TopBar.css          # Styling untuk header search
    │   ├── HomePage.css        # Styling untuk dashboard
    │   ├── NowPlaying.css      # Styling untuk panel deskripsi lagu
    │   ├── Visualizer.css      # Styling visualizer
    │   ├── LyricsPanel.css     # Styling lirik luring & sinkron
    │   ├── FullscreenLyrics.css# Styling overlay lirik
    │   ├── RecommendedPanel.css# Styling panel rekomendasi artis
    │   ├── PlayerBar.css       # Styling bar pemutar audio
    │   ├── PlaylistModal.css   # Styling kaca glassmorphic playlist modal
    │   ├── AlbumsDrawer.css    # Styling drawer album discography
    │   └── Toast.css           # Styling notifikasi toast
    ├── hooks/
    │   └── useYouTubePlayer.js # 🎣 Custom hook manajemen YouTube IFrame API
    └── utils/
        ├── api/                # 🌐 Modul API Terpisah
        │   ├── index.js        # Barrel file exports
        │   ├── deezer.js       # Deezer API (album art JSONP)
        │   ├── lrclib.js       # LRCLIB API (lirik lagu)
        │   ├── piped.js        # Piped API (YouTube search & playlists)
        │   └── spotify.js      # Spotify API (PKCE Code Auth & tracks)
        └── helpers.js          # 🛠️ Helper waktu, parser LRC, & sorting video
```

---

## 📄 Lisensi
Proyek ini dilisensikan di bawah lisensi MIT.

<div align="center">

**Made with ❤️ and lots of 🎵**

<sub>Built with React + Vite · Powered by open APIs</sub>

</div>
