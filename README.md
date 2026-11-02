# Toko Buku Ajar Online

Tugas UTS Pemrograman Web 1 — aplikasi web pemesanan buku untuk toko online (nama tampilan di website: **Pustaka Terbuka**). Dibuat hanya dengan **HTML, CSS, dan JavaScript** tanpa server maupun database; seluruh data diambil dari variabel pada file `js/data.js`.

- **Nama:** [Fallah Nugraha Persadad ]
- **NIM:** [312510455]
- **Mata kuliah:** Pemrograman Web 1

## Cara menjalankan

1. Ekstrak folder `tugas-uts-web1`.
2. Buka `index.html` di browser (Chrome, Edge, atau Firefox). Tidak perlu instalasi atau server.
3. Koneksi internet hanya dipakai untuk memuat font Google; tanpa internet, tampilan tetap berfungsi dengan font bawaan.

## Akun demo

| Email | Password | Role |
|---|---|---|
| rina@gmail.com | rina123 | User |
| agus@gmail.com | agus123 | User |
| siti@gmail.com | siti123 | Admin |

Pengguna baru bisa dibuat lewat tombol **Daftar** di halaman login.

Nomor Delivery Order untuk mencoba tracking: `20230012` dan `20230013`, atau nomor DO dari pesanan yang baru dibuat.

## Daftar halaman

| File | Fungsi |
|---|---|
| `index.html` | Login. Validasi, pop-up salah login, modal **Lupa Password** dan **Daftar**. |
| `dashboard.html` | Menu utama, sapaan sesuai waktu lokal (pagi/siang/sore/malam), jam digital, ringkasan angka. |
| `stok.html` | Katalog dari `dataKatalogBuku`: cari, urutkan, tampilan tabel/kartu, tambah dan hapus baris stok lewat DOM. |
| `checkout.html` | Keranjang yang bisa ditambah/diubah/dihapus, data pemesan, metode pembayaran, ringkasan biaya, pembuatan Nomor DO. |
| `tracking.html` | Cari Nomor DO: nama pemesan, status (stepper + progress bar), ekspedisi, tanggal kirim, paket, total, riwayat perjalanan. |
| `laporan.html` | Laporan pemesanan: statistik dan grafik batang. *(tambahan)* |
| `riwayat.html` | History transaksi dengan pencarian dan filter status. *(tambahan)* |

## Struktur folder

```
tugas-uts-web1/
├── index.html          (halaman login)
├── dashboard.html
├── stok.html
├── checkout.html
├── tracking.html
├── laporan.html
├── riwayat.html
├── README.md
├── css/
│   └── style.css
├── js/
│   ├── data.js         (data dummy: pengguna, katalog, tracking)
│   └── script.js       (seluruh logika; fungsi dipilih lewat <body data-page="...">)
├── assets/
│   └── logo.svg
└── img/                (sampul buku)
```

## Pemenuhan indikator tugas

1. **HTML semantik dan valid** — memakai `header`, `nav`, `main`, `section`, `aside`, `footer`, `dialog`; setiap input punya `label`; tabel memakai `caption` dan `th scope`.
2. **CSS** — external stylesheet (`css/style.css`) dengan CSS variable, Flexbox, Grid, dan media query responsif; juga ada sedikit inline style untuk penyesuaian kecil.
3. **JavaScript**
   - **Manipulasi DOM:** render tabel/kartu dari data, tambah dan hapus baris stok, keranjang dinamis.
   - **Validasi form:** pesan error per kolom (email, password, kode barang, nomor HP, kode pos, dll.).
   - **Interaksi UI:** modal box, alert/pop-up, toast, progress bar dan stepper, animasi hitung angka.

## Catatan teknis

- Data tambahan (akun baru, stok baru, keranjang, pesanan, sesi login) disimpan di `localStorage` browser, sehingga tetap ada setelah halaman dimuat ulang. Untuk mengosongkan, jalankan `localStorage.clear()` di console browser.
- Halaman selain login otomatis mengarahkan ke login jika belum masuk.
- Perubahan pada `data.js` dari file asli: ekstensi cover Paud `.jpeg` diperbaiki menjadi `.jpg` agar sesuai file gambar, dan tanggal `"2025-08 25 14:07:56"` diperbaiki menjadi `"2025-08-25 14:07:56"`.
- Proyek ini adalah simulasi front-end: password disimpan sebagai teks biasa pada data dummy dan tidak ada autentikasi server sungguhan.
