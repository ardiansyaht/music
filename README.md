<div align="center">

<!-- Pixel Art Music Note - Pure HTML/CSS -->
<table>
<tr>
<td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td><td>🟪</td><td>🟪</td><td>🟪</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td>
</tr>
<tr>
<td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td><td>🟪</td><td>⬛</td><td>🟪</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td>
</tr>
<tr>
<td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td><td>🟪</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td>
</tr>
<tr>
<td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td><td>🟪</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td>
</tr>
<tr>
<td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td><td>🟪</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td>
</tr>
<tr>
<td>⬛</td><td>⬛</td><td>⬛</td><td>🟣</td><td>🟣</td><td>🟪</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td>
</tr>
<tr>
<td>⬛</td><td>⬛</td><td>🟣</td><td>🟣</td><td>🟣</td><td>🟣</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td>
</tr>
<tr>
<td>⬛</td><td>⬛</td><td>⬛</td><td>🟣</td><td>🟣</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td><td>⬛</td>
</tr>
</table>

# 🎵 LyricSync

### _Immersive Synced Lyrics Player_

**Dengarkan lagu lengkap + lirik sinkron real-time.**<br>
**Cari lagu apapun. Lirik otomatis muncul & mengikuti musik.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

## ✨ Fitur

```
🎧  Full-length streaming      Putar lagu penuh lewat YouTube (hidden player)
🔍  Smart search                Cari lagu, artis, atau album — hasil instan
📝  Synced lyrics               Lirik real-time yang mengikuti beat musik
🎨  4 premium themes            Pastel Dream · Retro VHS · Dark Space · Cyberpunk
📊  Live visualizer             Animasi audio bars 60fps di canvas
⚡  Self-healing queue          Kalau satu source error, otomatis pindah backup
🔧  Sync offset                 Geser timing lirik ± 0.1 detik
📱  Responsive                  Works on desktop & mobile
```

## 🎨 Themes

<table>
<tr>
<td align="center">🌸<br><b>Pastel Dream</b><br><sub>Warm & soft pink tones</sub></td>
<td align="center">📼<br><b>Retro VHS</b><br><sub>Neon cyan + scanlines</sub></td>
<td align="center">🌌<br><b>Dark Space</b><br><sub>Deep purple nebula</sub></td>
<td align="center">⚡<br><b>Cyberpunk</b><br><sub>Yellow + red electric</sub></td>
</tr>
</table>

## 🚀 Quick Start

```bash
# Clone repo
git clone https://github.com/ardiansyaht/music.git
cd music

# Install dependencies
npm install

# Run dev server
npm run dev
```

Buka **http://localhost:5173** di browser. That's it! 🎉

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| ⚛️ UI Framework | React 19 + JSX |
| ⚡ Build Tool | Vite 8 |
| 🎵 Audio | YouTube IFrame API (hidden) |
| 🔍 Search | Piped API (decentralized YouTube) |
| 📝 Lyrics | LRCLIB.net (synced LRC format) |
| 🖼️ Album Art | Deezer API (JSONP) |
| 🎨 Styling | Vanilla CSS + CSS Variables |

## 📁 Struktur Project

```
music/
├── index.html          # Entry point HTML
├── package.json        # Dependencies & scripts
├── vite.config.js      # Vite configuration
└── src/
    ├── main.jsx        # React mount point
    ├── App.jsx         # 🎯 Main player component
    ├── index.css       # 🎨 All styles + 4 themes
    └── lyrics.js       # 🎵 Default lyrics data
```

## 🎮 Cara Pakai

1. **▶️ Play** — Klik tombol play untuk memutar lagu default (Lover Is a Day - Cuco)
2. **🔍 Search** — Ketik nama lagu/artis di search bar, pilih dari hasil
3. **📝 Click lyric** — Klik baris lirik untuk loncat ke bagian itu
4. **🎨 Theme** — Klik emoji tema di kanan atas untuk ganti tema
5. **🔧 Sync** — Kalau lirik nggak pas, geser sync offset pakai tombol ± di kiri bawah

## 🌐 API yang Digunakan

| API | Fungsi | Butuh Key? |
|-----|--------|:----------:|
| [YouTube IFrame](https://developers.google.com/youtube/iframe_api_reference) | Audio streaming | ❌ |
| [Piped](https://piped.video) | YouTube search tanpa API key | ❌ |
| [LRCLIB](https://lrclib.net) | Synced lyrics database | ❌ |
| [Deezer](https://developers.deezer.com) | Album artwork | ❌ |

> 💡 **Semua API gratis dan tidak butuh API key!**

## 🤝 Contributing

Pull requests welcome! Untuk perubahan besar, buka issue dulu ya.

```bash
# Fork → Clone → Branch → Commit → Push → PR
git checkout -b fitur-keren
git commit -m "Tambah fitur keren"
git push origin fitur-keren
```

## 📄 License

MIT © [ardiansyaht](https://github.com/ardiansyaht)

---

<div align="center">

**Made with ❤️ and lots of 🎵**

<sub>Built with React + Vite · Powered by open APIs</sub>

</div>
